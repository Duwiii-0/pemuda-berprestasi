<?php

namespace App\Http\Controllers;

use App\Models\Atlet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AtletController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Atlet::with(['dojang', 'pelatihPembuat'])->paginate(1000);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'nama_atlet' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'nik' => 'nullable|string|max:255',
            'berat_badan' => 'required|numeric',
            'provinsi' => 'nullable|string|max:255',
            'kota' => 'nullable|string|max:255',
            'belt' => 'nullable|string|max:255',
            'alamat' => 'nullable|string',
            'no_telp' => 'nullable|string|max:255',
            'tinggi_badan' => 'required|numeric',
            'jenis_kelamin' => 'required|in:LAKI_LAKI,PEREMPUAN',
            'umur' => 'required|integer',
            'id_dojang' => 'required|exists:tb_dojang,id_dojang',
            'id_pelatih_pembuat' => 'required|exists:tb_pelatih,id_pelatih',
            'akte_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'pas_foto' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'sertifikat_belt' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                $validatedData[$field] = $request->file($field)->store('public/atlet');
            }
        }

        $atlet = Atlet::create($validatedData);

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
    public function update(Request $request, string $id)
    {
        $atlet = Atlet::findOrFail($id);

        $validatedData = $request->validate([
            'nama_atlet' => 'sometimes|required|string|max:255',
            'tanggal_lahir' => 'sometimes|required|date',
            'nik' => 'nullable|string|max:255',
            'berat_badan' => 'sometimes|required|numeric',
            'provinsi' => 'nullable|string|max:255',
            'kota' => 'nullable|string|max:255',
            'belt' => 'nullable|string|max:255',
            'alamat' => 'nullable|string',
            'no_telp' => 'nullable|string|max:255',
            'tinggi_badan' => 'sometimes|required|numeric',
            'jenis_kelamin' => 'sometimes|required|in:LAKI_LAKI,PEREMPUAN',
            'umur' => 'sometimes|required|integer',
            'id_dojang' => 'sometimes|required|exists:tb_dojang,id_dojang',
            'id_pelatih_pembuat' => 'sometimes|required|exists:tb_pelatih,id_pelatih',
            'akte_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'pas_foto' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'sertifikat_belt' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
        ]);

        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];

        foreach ($fileFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old file if it exists
                if ($atlet->{$field}) {
                    Storage::delete($atlet->{$field});
                }
                $validatedData[$field] = $request->file($field)->store('public/atlet');
            }
        }

        $atlet->update($validatedData);

        return response()->json($atlet);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $atlet = Atlet::findOrFail($id);
        
        $fileFields = ['akte_kelahiran', 'pas_foto', 'sertifikat_belt', 'ktp'];
        foreach ($fileFields as $field) {
            if ($atlet->{$field}) {
                Storage::delete($atlet->{$field});
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
            'id_dojang' => 'required|exists:tb_dojang,id_dojang',
            'jenis_kelamin' => 'required|in:LAKI_LAKI,PEREMPUAN',
            // TODO: Add validation for kelompokUsiaId and kelasBeratId
        ]);

        $query = Atlet::query();

        $query->where('id_dojang', $validatedData['id_dojang']);
        $query->where('jenis_kelamin', $validatedData['jenis_kelamin']);

        // TODO: Implement filtering based on kelompokUsiaId and kelasBeratId

        return $query->with(['dojang', 'pelatihPembuat'])->get();
    }

    /**
     * Get athlete statistics.
     */
    public function getStats()
    {
        return [
            'total' => Atlet::count(),
        ];
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
