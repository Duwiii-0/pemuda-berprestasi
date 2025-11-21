use App\Models\KelompokUsia;
use App\Models\KelasBerat;

class AtletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Atlet::query()->with(['dojang', 'pelatihPembuat']);

        // Search by name
        $query->when($request->input('search'), function ($q, $search) {
            return $q->where('nama_atlet', 'like', "%{$search}%");
        });

        // Filter by Dojang
        $query->when($request->input('id_dojang'), function ($q, $id_dojang) {
            return $q->where('id_dojang', $id_dojang);
        });

        // Filter by gender
        $query->when($request->input('jenis_kelamin'), function ($q, $jenis_kelamin) {
            return $q->where('jenis_kelamin', $jenis_kelamin);
        });

        // Filter by weight range
        $query->when($request->input('min_weight'), function ($q, $min_weight) {
            return $q->where('berat_badan', '>=', $min_weight);
        });
        $query->when($request->input('max_weight'), function ($q, $max_weight) {
            return $q->where('berat_badan', '<=', $max_weight);
        });

        // Filter by age range
        if ($request->has('min_age') || $request->has('max_age')) {
            $today = Carbon::today();
            if ($request->has('max_age')) {
                $max_age = $request->input('max_age');
                $minBirthDate = $today->copy()->subYears($max_age + 1);
                $query->whereDate('tanggal_lahir', '>', $minBirthDate);
            }
            if ($request->has('min_age')) {
                $min_age = $request->input('min_age');
                $maxBirthDate = $today->copy()->subYears($min_age);
                $query->whereDate('tanggal_lahir', '<=', $maxBirthDate);
            }
        }

        return $query->orderBy('nama_atlet', 'asc')->paginate($request->input('limit', 100));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAtletRequest $request)
    {
        $validatedData = $request->validated();

        $filePaths = [];
        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Store file in public/atlet/{field_name}
                $filePaths[$field] = $request->file($field)->store('atlet/' . $field, 'public');
            }
        }

        // Calculate age from date of birth
        $age = Carbon::parse($validatedData['tanggal_lahir'])->age;

        $dataToCreate = array_merge(
            $validatedData,
            $filePaths,
            ['umur' => $age]
        );

        $atlet = Atlet::create($dataToCreate);

        return response()->json($atlet, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Atlet::with(['dojang', 'pelatihPembuat'])->findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAtletRequest $request, Atlet $atlet)
    {
        $validatedData = $request->validated();

        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if it exists
                if ($atlet->{$field}) {
                    Storage::disk('public')->delete($atlet->{$field});
                }
                // Store new file
                $validatedData[$field] = $request->file($field)->store('atlet/' . $field, 'public');
            }
        }

        // Recalculate age if tanggal_lahir is being updated
        if (isset($validatedData['tanggal_lahir'])) {
            $validatedData['umur'] = Carbon::parse($validatedData['tanggal_lahir'])->age;
        }

        $atlet->update($validatedData);

        return response()->json($atlet);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Atlet $atlet)
    {
        // Check if the athlete is registered in any competition
        if ($atlet->pesertaKompetisi()->exists()) {
            return response()->json(['message' => 'Tidak dapat menghapus atlet yang sudah terdaftar dalam kompetisi'], 400);
        }
        
        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
        foreach ($fileFields as $field) {
            if ($atlet->{$field}) {
                Storage::disk('public')->delete($atlet->{$field});
            }
        }
        
        $atlet->delete();

        return response()->json(null, 204);
    }

    /**
     * Get atlets by dojang.
     */
    public function getByDojang(string $id_dojang)
    {
        return Atlet::where('id_dojang', $id_dojang)->with(['dojang', 'pelatihPembuat'])->paginate(1000);
    }

    /**
     * Get eligible atlets for a competition class.
     */
    public function getEligible(Request $request)
    {
        $validatedData = $request->validate([
            'id_dojang' => 'required|integer|exists:tb_dojang,id_dojang',
            'jenis_kelamin' => 'required|in:LAKI_LAKI,PEREMPUAN',
            'kompetisiId' => 'required|integer|exists:tb_kompetisi,id_kompetisi',
            'kelompokUsiaId' => 'nullable|integer|exists:tb_kelompok_usia,id_kelompok',
            'kelasBeratId' => 'nullable|integer|exists:tb_kelas_berat,id_kelas_berat',
        ]);

        $query = Atlet::query();

        // Filter by dojang and gender
        $query->where('id_dojang', $validatedData['id_dojang'])
              ->where('jenis_kelamin', $validatedData['jenis_kelamin']);

        // Filter by age group
        if (isset($validatedData['kelompokUsiaId'])) {
            $kelompokUsia = KelompokUsia::find($validatedData['kelompokUsiaId']);
            if ($kelompokUsia) {
                $query->whereBetween('umur', [$kelompokUsia->usia_min, $kelompokUsia->usia_max]);
            }
        }

        // Filter by weight class
        if (isset($validatedData['kelasBeratId'])) {
            $kelasBerat = KelasBerat::find($validatedData['kelasBeratId']);
            if ($kelasBerat) {
                $query->whereBetween('berat_badan', [$kelasBerat->batas_min, $kelasBerat->batas_max]);
            }
        }

        // Filter out athletes already registered in this competition
        $kompetisiId = $validatedData['kompetisiId'];
        $query->whereDoesntHave('pesertaKompetisi', function ($q) use ($kompetisiId) {
            $q->where('id_kompetisi', $kompetisiId);
        });

        return $query->with('dojang:id_dojang,nama_dojang')->orderBy('nama_atlet', 'asc')->get();
    }

    /**
     * Get athlete statistics.
     */
    public function getStats()
    {
        $totalAtlet = Atlet::count();
        $maleCount = Atlet::where('jenis_kelamin', 'LAKI_LAKI')->count();
        $femaleCount = Atlet::where('jenis_kelamin', 'PEREMPUAN')->count();
        $registeredInCompetition = Atlet::has('pesertaKompetisi')->count();

        // Age group distribution
        $allAtletTanggals = Atlet::pluck('tanggal_lahir');
        $ageGroups = [
            '5-8' => 0,
            '9-12' => 0,
            '13-16' => 0,
            '17-20' => 0,
            '21+' => 0,
        ];

        foreach ($allAtletTanggals as $tanggal_lahir) {
            $age = Carbon::parse($tanggal_lahir)->age;
            if ($age >= 5 && $age <= 8) $ageGroups['5-8']++;
            else if ($age >= 9 && $age <= 12) $ageGroups['9-12']++;
            else if ($age >= 13 && $age <= 16) $ageGroups['13-16']++;
            else if ($age >= 17 && $age <= 20) $ageGroups['17-20']++;
            else if ($age >= 21) $ageGroups['21+']++;
        }

        return response()->json([
            'totalAtlet' => $totalAtlet,
            'genderDistribution' => [
                'male' => $maleCount,
                'female' => $femaleCount,
            ],
            'registeredInCompetition' => $registeredInCompetition,
            'notRegisteredInCompetition' => $totalAtlet - $registeredInCompetition,
            'ageGroupDistribution' => $ageGroups,
        ]);
    }

    /**
     * Get all athletes in a competition.
     */
    public function getByKompetisi(string $id_kompetisi, Request $request)
    {
        $atlets = Atlet::whereHas('pesertaKompetisi', function ($query) use ($id_kompetisi) {
            $query->where('id_kompetisi', $id_kompetisi);
        })->with(['dojang', 'pelatihPembuat'])->paginate(1000);

        return response()->json($atlets);
    }
}
