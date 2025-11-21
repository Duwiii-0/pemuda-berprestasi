<?php

namespace App\Http\Controllers;

use App\Models\Kompetisi;
use App\Models\Atlet;
use App\Models\KelasKejuaraan;
use App\Models\PesertaKompetisi;
use App\Models\PesertaTim;
use App\Models\Match;
use App\Http\Requests\StoreKompetisiRequest;
use App\Http\Requests\UpdateKompetisiRequest;
use App\Http\Requests\RegisterPesertaKompetisiRequest;
use App\Http\Requests\UpdatePesertaKompetisiClassRequest;
use App\Http\Requests\UpdatePesertaKompetisiStatusRequest;
use App\Http\Requests\UpdatePesertaKompetisiPenimbanganRequest;
use App\Http\Requests\GenerateBracketRequest;
use App\Services\BracketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class KompetisiController extends Controller
{
    /**
     * Display a listing of the resource with filtering.
     */
    public function index(Request $request)
    {
        $query = Kompetisi::query()->with(['penyelenggara'])->withCount('kelasKejuaraan');

        // Filter by search term
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('nama_kompetisi', 'like', "%{$search}%")
              ->orWhereHas('penyelenggara', function ($q_penyelenggara) use ($search) {
                  $q_penyelenggara->where('nama_penyelenggara', 'like', "%{$search}%");
              });
        });

        // Filter by status
        $query->when($request->input('status'), function ($q, $status) {
            return $q->where('status', $status);
        });

        // Filter by date range
        $query->when($request->input('start_date'), function ($q, $start_date) {
            return $q->whereDate('tanggal_mulai', '>=', $start_date);
        });
        $query->when($request->input('end_date'), function ($q, $end_date) {
            return $q->whereDate('tanggal_mulai', '<=', $end_date);
        });

        return $query->orderBy('tanggal_mulai', 'desc')
                     ->paginate($request->input('limit', 10));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreKompetisiRequest $request)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('banner')) {
            $validatedData['banner'] = $request->file('banner')->store('kompetisi/banners', 'public');
        }
        if ($request->hasFile('proposal')) {
            $validatedData['proposal'] = $request->file('proposal')->store('kompetisi/proposals', 'public');
        }

        $kompetisi = Kompetisi::create($validatedData);

        return response()->json($kompetisi->load('penyelenggara'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Kompetisi $kompetisi)
    {
        return $kompetisi->load([
            'penyelenggara',
            'kelasKejuaraan.kategoriEvent',
            'kelasKejuaraan.kelompok',
            'kelasKejuaraan.kelasBerat',
            'kelasKejuaraan.poomsae',
            'kelasKejuaraan' => function ($query) {
                $query->withCount('pesertaKompetisi');
            }
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateKompetisiRequest $request, Kompetisi $kompetisi)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('banner')) {
            if ($kompetisi->banner) {
                Storage::disk('public')->delete($kompetisi->banner);
            }
            $validatedData['banner'] = $request->file('banner')->store('kompetisi/banners', 'public');
        }

        if ($request->hasFile('proposal')) {
            if ($kompetisi->proposal) {
                Storage::disk('public')->delete($kompetisi->proposal);
            }
            $validatedData['proposal'] = $request->file('proposal')->store('kompetisi/proposals', 'public');
        }

        $kompetisi->update($validatedData);

        return response()->json($kompetisi->load('penyelenggara'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kompetisi $kompetisi)
    {
        if ($kompetisi->kelasKejuaraan()->exists()) {
            return response()->json(['message' => 'Tidak dapat menghapus kompetisi yang sudah memiliki kelas kejuaraan.'], 400);
        }

        if ($kompetisi->banner) {
            Storage::disk('public')->delete($kompetisi->banner);
        }
        if ($kompetisi->proposal) {
            Storage::disk('public')->delete($kompetisi->proposal);
        }

        $kompetisi->delete();

        return response()->json(null, 204);
    }

    /**
     * Register an atlet (individual or team) to a competition class.
     */
    public function registerAtlet(RegisterPesertaKompetisiRequest $request, Kompetisi $kompetisi)
    {
        $validatedData = $request->validated();
        $atlitId = $validatedData['atlitId'];
        $kelasKejuaraanId = $validatedData['kelasKejuaraanId'];
        $atlitId2 = $validatedData['atlitId2'] ?? null;

        $kelasKejuaraan = $kompetisi->kelasKejuaraan()->findOrFail($kelasKejuaraanId);
            
        $isTeam = $atlitId2 && (strcasecmp($kelasKejuaraan->cabang, 'POOMSAE') == 0);

        // Further validation and creation logic...
    }

    public function deleteParticipant(Kompetisi $kompetisi, PesertaKompetisi $peserta)
    {
        // ...
    }

    public function getAtletsByKompetisi(Kompetisi $kompetisi, Request $request)
    {
        // ...
    }

    public function updateRegistrationStatus(Kompetisi $kompetisi, PesertaKompetisi $peserta, UpdatePesertaKompetisiStatusRequest $request)
    {
        // ...
    }
    
    public function generateBrackets(GenerateBracketRequest $request, Kompetisi $kompetisi)
    {
        $validatedData = $request->validated();
        
        try {
            $bracket = BracketService::createBracket(
                $kompetisi->id_kompetisi,
                $validatedData['kelasKejuaraanId'],
                $validatedData['dojangSeparation'] ?? null
            );
            return response()->json($bracket, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}