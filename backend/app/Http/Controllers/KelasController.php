<?php

namespace App\Http\Controllers;

use App\Models\KelasKejuaraan;
use App\Models\KelasBerat;
use App\Models\KelasPoomsae;
use App\Models\KelompokUsia;
use App\Models\Kompetisi;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KelasController extends Controller
{
    public function getKelompokUsia()
    {
        return KelompokUsia::orderBy('usia_min', 'asc')->get();
    }

    public function getKelasBerat(Request $request)
    {
        $validated = $request->validate([
            'kelompokId' => 'required|integer|exists:tb_kelompok_usia,id_kelompok',
            'jenis_kelamin' => ['required', Rule::in(['LAKI_LAKI', 'PEREMPUAN'])],
        ]);

        return KelasBerat::where('id_kelompok', $validated['kelompokId'])
            ->where('jenis_kelamin', $validated['jenis_kelamin'])
            ->orderBy('batas_min', 'asc')
            ->get();
    }

    public function getKelasPoomsae(Request $request)
    {
        $validated = $request->validate([
            'kelompokId' => 'required|integer|exists:tb_kelompok_usia,id_kelompok',
            'jenis_kelamin' => ['required', Rule::in(['LAKI_LAKI', 'PEREMPUAN'])],
        ]);

        return KelasPoomsae::where('id_kelompok', $validated['kelompokId'])
            ->where('jenis_kelamin', $validated['jenis_kelamin'])
            ->get();
    }

    public function getKelasKejuaraanByKompetisi(Kompetisi $kompetisi)
    {
        // This method replicates the complex filtering from the legacy `getKelasKejuaraanByKompetisi` service method.
        $kelasList = $kompetisi->kelasKejuaraan()->with(['kategoriEvent', 'kelompok', 'kelasBerat', 'poomsae'])->get();

        $filteredList = $kelasList->filter(function ($kelas) {
            $kategori = strtolower($kelas->kategoriEvent->nama_kategori ?? '');
            
            if (strcasecmp($kelas->cabang, 'KYORUGI') == 0) {
                return $kelas->id_kelas_berat !== null && $kelas->id_kelompok !== null;
            }

            if (strcasecmp($kelas->cabang, 'POOMSAE') == 0) {
                $namaKelas = strtolower($kelas->poomsae->nama_kelas ?? '');
                $isIndividu = str_contains($namaKelas, 'individu');
                
                if (str_contains($kategori, 'pemula')) {
                    return $isIndividu;
                }

                if (str_contains($kategori, 'prestasi')) {
                    $kelompokNama = strtolower($kelas->kelompok->nama_kelompok ?? '');
                    $excludedKelompok = ["super-pracadet", "super pracadet", "pracadet", "cadet"];
                    
                    foreach ($excludedKelompok as $excluded) {
                        if (str_contains($kelompokNama, $excluded)) {
                            return false; // Exclude if it's in the excluded group
                        }
                    }
                    return $isIndividu; // Include if it's individual and not excluded
                }
            }
            return true;
        });

        return response()->json($filteredList->values());
    }
}
