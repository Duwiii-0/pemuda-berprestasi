<?php

namespace App\Http\Controllers;

use App\Models\Match;
use App\Models\Kompetisi;
use Illuminate\Http\Request;

class PertandinganController extends Controller
{
    /**
     * Get live match information for a competition.
     */
    public function getPertandinganInfo(Kompetisi $kompetisi)
    {
        $matches = Match::whereHas('bagan', function ($query) use ($kompetisi) {
            $query->where('id_kompetisi', $kompetisi->id_kompetisi);
        })
        ->whereNotNull('id_peserta_a')
        ->whereNotNull('id_peserta_b')
        ->with([
            'pesertaA.atlet',
            'pesertaB.atlet',
        ])
        ->get();

        $formattedMatches = $matches->map(function ($match) {
            return [
                'nomor_antrian' => $match->nomor_antrian,
                'nomor_lapangan' => $match->nomor_lapangan,
                'nama_atlet_a' => $match->pesertaA->atlet->nama_atlet ?? null,
                'pas_foto_atlet_a' => $match->pesertaA->atlet->pas_foto ?? null,
                'nama_atlet_b' => $match->pesertaB->atlet->nama_atlet ?? null,
                'pas_foto_atlet_b' => $match->pesertaB->atlet->pas_foto ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedMatches,
        ]);
    }
}
