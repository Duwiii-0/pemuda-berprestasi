<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\Atlet;
use App\Models\PesertaKompetisi;
use App\Http\Requests\GenerateCertificateRequest;
use Illuminate\Http\Request;

class CertificateController extends Controller
{
    /**
     * Generate certificate number for athlete in specific class.
     */
    public function generateCertificateNumber(GenerateCertificateRequest $request)
    {
        $validatedData = $request->validated();

        $id_atlet = $validatedData['id_atlet'];
        $id_peserta_kompetisi = $validatedData['id_peserta_kompetisi'];

        // Check if certificate already exists
        $existing = Certificate::where('id_atlet', $id_atlet)
                               ->where('id_peserta_kompetisi', $id_peserta_kompetisi)
                               ->first();
        
        if ($existing) {
            return response()->json([
                'success' => true,
                'data' => [
                    'certificateNumber' => $existing->certificate_number,
                    'alreadyExists' => true,
                ],
            ]);
        }

        // Get next certificate number (GLOBAL counter)
        $lastCert = Certificate::orderBy('id_certificate', 'desc')->first();
        $nextNumber = $lastCert ? (int)$lastCert->certificate_number + 1 : 1;
        $certificateNumber = str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        // Create certificate record
        $certificate = Certificate::create([
            'certificate_number' => $certificateNumber,
            'id_atlet' => $id_atlet,
            'id_peserta_kompetisi' => $id_peserta_kompetisi,
            'id_kompetisi' => $validatedData['id_kompetisi'],
            'medal_status' => $validatedData['medal_status'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'certificateNumber' => $certificate->certificate_number,
                'alreadyExists' => false,
            ],
        ]);
    }

    /**
     * Get all certificates for an athlete.
     */
    public function getAthleteCertificates(Atlet $atlet)
    {
        $certificates = $atlet->certificates()->with([
            'pesertaKompetisi.kelasKejuaraan.kategoriEvent',
            'pesertaKompetisi.kelasKejuaraan.kelompok',
            'pesertaKompetisi.kelasKejuaraan.kelasBerat',
            'pesertaKompetisi.kelasKejuaraan.poomsae',
            'pesertaKompetisi.kelasKejuaraan.kompetisi',
        ])->orderBy('generated_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }

    /**
     * Check if certificate exists.
     */
    public function checkCertificateExists(Atlet $atlet, PesertaKompetisi $pesertaKompetisi)
    {
        $existing = Certificate::where('id_atlet', $atlet->id_atlet)
                               ->where('id_peserta_kompetisi', $pesertaKompetisi->id_peserta_kompetisi)
                               ->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'exists' => !!$existing,
                'certificateNumber' => $existing->certificate_number ?? null,
            ],
        ]);
    }
}
