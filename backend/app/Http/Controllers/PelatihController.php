<?php

namespace App\Http\Controllers;

use App\Models\Pelatih;
use App\Models\Akun; // Added this use statement
use App\Http\Requests\UpdatePelatihRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule; // Added this use statement for deleteFile validation

class PelatihController extends Controller
{
    /**
     * Display a listing of the resource for admins.
     */
    public function index(Request $request)
    {
        $query = Pelatih::query()->with(['akun', 'dojang'])->withCount('atletDibuat');

        // Search logic
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('nama_pelatih', 'like', "%{$search}%")
              ->orWhere('no_telp', 'like', "%{$search}%")
              ->orWhere('nik', 'like', "%{$search}%")
              ->orWhereHas('akun', fn($q_akun) => $q_akun->where('email', 'like', "%{$search}%"))
              ->orWhereHas('dojang', fn($q_dojang) => $q_dojang->where('nama_dojang', 'like', "%{$search}%"));
        });

        // Sorting logic
        $sort = $request->input('sort', 'nama_pelatih');
        $order = $request->input('order', 'asc');
        $query->orderBy($sort, $order);

        return $query->paginate($request->input('limit', 10));
    }

    /**
     * Display the specified resource.
     */
    public function show(Pelatih $pelatih)
    {
        return $pelatih->load(['akun', 'dojang', 'atletDibuat' => function ($query) {
            $query->take(5)->orderBy('id_atlet', 'desc');
        }]);
    }

    /**
     * Get the profile of the currently authenticated coach.
     */
    public function me(Request $request)
    {
        $akun = $request->user();
        $pelatih = $akun->pelatih()->with('dojang')->first();

        if (!$pelatih) {
            return response()->json(['message' => 'Profil pelatih tidak ditemukan.'], 404);
        }
        return response()->json($pelatih);
    }
    
    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePelatihRequest $request, Pelatih $pelatih)
    {
        $validatedData = $request->validated();
        
        $this->handleFileUploads($request, $pelatih, $validatedData);

        $pelatih->update($validatedData);

        return response()->json($pelatih->load('akun', 'dojang'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Pelatih $pelatih)
    {
        if ($pelatih->atletDibuat()->exists()) {
            return response()->json(['message' => 'Tidak dapat menghapus pelatih yang telah membuat atlet.'], 400);
        }

        try {
            DB::transaction(function () use ($pelatih) {
                // Delete files
                if ($pelatih->foto_ktp) Storage::disk('public')->delete($pelatih->foto_ktp);
                if ($pelatih->sertifikat_sabuk) Storage::disk('public')->delete($pelatih->sertifikat_sabuk);
                
                // Delete pelatih and then the associated account
                $akun = $pelatih->akun;
                $pelatih->delete();
                $akun?->delete();
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menghapus pelatih: ' . $e->getMessage()], 500);
        }

        return response()->json(null, 204);
    }

    /**
     * Upload files for the authenticated coach.
     */
    public function uploadFiles(Request $request)
    {
        $request->validate([
            'foto_ktp' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sertifikat_sabuk' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $pelatih = $request->user()->pelatih;

        if (!$pelatih) {
            return response()->json(['message' => 'Profil pelatih tidak ditemukan.'], 404);
        }
        
        $validatedData = [];
        $this->handleFileUploads($request, $pelatih, $validatedData);
        
        $pelatih->update($validatedData);

        return response()->json($pelatih);
    }

    /**
     * Delete a specific file for the authenticated coach.
     */
    public function deleteFile(Request $request, $fileType)
    {
        $request->validate([
            'fileType' => ['required', Rule::in(['foto_ktp', 'sertifikat_sabuk'])]
        ]);

        $pelatih = $request->user()->pelatih;

        if (!$pelatih) {
            return response()->json(['message' => 'Profil pelatih tidak ditemukan.'], 404);
        }

        if ($pelatih->{$fileType}) {
            Storage::disk('public')->delete($pelatih->{$fileType});
            $pelatih->{$fileType} = null;
            $pelatih->save();
            return response()->json(['message' => 'File berhasil dihapus.']);
        }

        return response()->json(['message' => 'File tidak ditemukan.'], 404);
    }

    /**
     * Private helper to handle file uploads.
     */
    private function handleFileUploads(Request $request, Pelatih $pelatih, &$validatedData)
    {
        $fileFields = [
            'foto_ktp' => 'pelatih/ktp',
            'sertifikat_sabuk' => 'pelatih/sertifikat',
        ];

        foreach ($fileFields as $field => $path) {
            if ($request->hasFile($field)) {
                if ($pelatih->{$field}) {
                    Storage::disk('public')->delete($pelatih->{$field});
                }
                $validatedData[$field] = $request->file($field)->store($path, 'public');
            }
        }
    }
}