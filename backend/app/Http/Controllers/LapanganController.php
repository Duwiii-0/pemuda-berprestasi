<?php

namespace App\Http\Controllers;

use App\Models\Kompetisi;
use App\Models\Lapangan;
use App\Models\Antrian;
use App\Models\LapanganKelas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LapanganController extends Controller
{
    public function getHariLapanganByKompetisi(Kompetisi $kompetisi)
    {
        $lapangan = $kompetisi->lapangan()
            ->with(['kelasList.kelasKejuaraan.kategoriEvent', 'kelasList.kelasKejuaraan.kelompok', 'kelasList.kelasKejuaraan.kelasBerat', 'kelasList.kelasKejuaraan.poomsae', 'antrian'])
            ->orderBy('tanggal', 'asc')
            ->orderBy('nama_lapangan', 'asc')
            ->get();

        $groupedByDate = $lapangan->groupBy(function ($item) {
            return $item->tanggal->format('Y-m-d');
        });

        $hariPertandingan = $groupedByDate->map(function ($lapangansOnDate, $tanggal) {
            return [
                'tanggal' => $tanggal,
                'jumlah_lapangan' => $lapangansOnDate->count(),
                'lapangan' => $lapangansOnDate,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'total_hari' => $hariPertandingan->count(),
                'total_lapangan' => $lapangan->count(),
                'hari_pertandingan' => $hariPertandingan,
            ],
        ]);
    }

    public function tambahHariLapangan(Request $request)
    {
        $validated = $request->validate(['id_kompetisi' => 'required|integer|exists:tb_kompetisi,id_kompetisi']);
        
        $lapanganTerakhir = Lapangan::where('id_kompetisi', $validated['id_kompetisi'])->orderBy('tanggal', 'desc')->first();

        $tanggalBaru = $lapanganTerakhir ? $lapanganTerakhir->tanggal->addDay() : now()->startOfDay();

        $lapanganBaru = Lapangan::create([
            'id_kompetisi' => $validated['id_kompetisi'],
            'nama_lapangan' => 'A',
            'tanggal' => $tanggalBaru,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menambahkan hari pertandingan.',
            'data' => ['tanggal' => $tanggalBaru->format('Y-m-d'), 'lapangan' => $lapanganBaru],
        ], 201);
    }
    
    public function tambahLapanganKeHari(Request $request)
    {
        $validated = $request->validate([
            'id_kompetisi' => 'required|integer|exists:tb_kompetisi,id_kompetisi',
            'tanggal' => 'required|date_format:Y-m-d',
        ]);

        $lapanganExistingCount = Lapangan::where('id_kompetisi', $validated['id_kompetisi'])
            ->whereDate('tanggal', $validated['tanggal'])
            ->count();
        
        $namaLapanganBaru = $this->getColumnName($lapanganExistingCount);

        $lapanganBaru = Lapangan::create([
            'id_kompetisi' => $validated['id_kompetisi'],
            'nama_lapangan' => $namaLapanganBaru,
            'tanggal' => $validated['tanggal'],
        ]);

        return response()->json(['success' => true, 'message' => "Berhasil menambahkan lapangan {$namaLapanganBaru}", 'data' => $lapanganBaru], 201);
    }

    public function hapusLapangan(Request $request)
    {
        $validated = $request->validate(['id_lapangan' => 'required|integer|exists:tb_lapangan,id_lapangan']);
        $lapangan = Lapangan::find($validated['id_lapangan']);

        // Simplified check, in reality, you might check tb_jadwal_pertandingan if it exists.
        if ($lapangan->kelasList()->exists()) {
             return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus lapangan karena sudah ada kelas yang terdaftar.'], 400);
        }

        $lapangan->delete(); // This will also delete related lapangan_kelas due to db constraints
        return response()->json(['success' => true, 'message' => "Berhasil menghapus lapangan {$lapangan->nama_lapangan}"]);
    }
    
    public function hapusHariLapangan(Request $request)
    {
        $validated = $request->validate([
            'id_kompetisi' => 'required|integer|exists:tb_kompetisi,id_kompetisi',
            'tanggal' => 'required|date_format:Y-m-d',
        ]);
        
        // A more robust check would join with tb_jadwal_pertandingan
        $lapangans = Lapangan::where('id_kompetisi', $validated['id_kompetisi'])->whereDate('tanggal', $validated['tanggal'])->get();
        foreach($lapangans as $lapangan) {
            if ($lapangan->kelasList()->exists()) {
                return response()->json(['success' => false, 'message' => 'Tidak dapat menghapus hari karena salah satu lapangan sudah memiliki jadwal kelas.'], 400);
            }
        }

        $deletedCount = Lapangan::where('id_kompetisi', $validated['id_kompetisi'])->whereDate('tanggal', $validated['tanggal'])->delete();

        return response()->json(['success' => true, 'message' => "Berhasil menghapus {$deletedCount} lapangan."]);
    }

    public function simpanKelasLapangan(Request $request)
    {
        $validated = $request->validate([
            'id_lapangan' => 'required|integer|exists:tb_lapangan,id_lapangan',
            'kelas_kejuaraan_ids' => 'present|array',
            'kelas_kejuaraan_ids.*' => 'integer|exists:tb_kelas_kejuaraan,id_kelas_kejuaraan',
        ]);

        $id_lapangan = $validated['id_lapangan'];
        $kelas_ids = $validated['kelas_kejuaraan_ids'];

        DB::transaction(function () use ($id_lapangan, $kelas_ids) {
            LapanganKelas::where('id_lapangan', $id_lapangan)->delete();
            if (!empty($kelas_ids)) {
                $insertData = collect($kelas_ids)->map(function ($id, $index) use ($id_lapangan) {
                    return [
                        'id_lapangan' => $id_lapangan,
                        'id_kelas_kejuaraan' => $id,
                        'urutan' => $index + 1,
                    ];
                });
                LapanganKelas::insert($insertData->all());
            }
        });

        return response()->json(['success' => true, 'message' => 'Berhasil menyimpan kelas kejuaraan untuk lapangan.']);
    }

    public function getKelasKejuaraanByLapangan(Lapangan $lapangan)
    {
        $kelasList = $lapangan->kelasList()->with('kelasKejuaraan')->orderBy('urutan', 'asc')->get();
        return response()->json(['success' => true, 'data' => $kelasList]);
    }

    public function simpanAntrian(Request $request)
    {
        $validated = $request->validate([
            'id_lapangan' => 'required|integer|exists:tb_lapangan,id_lapangan',
            'bertanding' => 'nullable|integer',
            'persiapan' => 'nullable|integer',
            'pemanasan' => 'nullable|integer',
        ]);

        $antrian = Antrian::updateOrCreate(
            ['id_lapangan' => $validated['id_lapangan']],
            [
                'bertanding' => $validated['bertanding'] ?? 0,
                'persiapan' => $validated['persiapan'] ?? 0,
                'pemanasan' => $validated['pemanasan'] ?? 0,
            ]
        );
        
        return response()->json(['success' => true, 'message' => 'Antrian berhasil disimpan.', 'data' => $antrian]);
    }
    
    private function getColumnName(int $index): string {
        $name = '';
        $index++;
        while ($index > 0) {
            $modulo = ($index - 1) % 26;
            $name = chr(65 + $modulo) . $name;
            $index = floor(($index - $modulo) / 26);
        }
        return $name;
    }
}
