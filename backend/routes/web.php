<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AtletController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BuktiTransferController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\DojangController;
use App\Http\Controllers\KelasController;
use App\Http\Controllers\KompetisiController;
use App\Http\Controllers\LapanganController;
use App\Http\Controllers\PelatihController;
use App\Http\Controllers\PesertaKompetisiController;
use App\Http\Controllers\PertandinganController;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::apiResource('admins', AdminController::class);
Route::get('atlets/kompetisi/{id_kompetisi}', [AtletController::class, 'getByKompetisi']);
Route::get('atlets/stats', [AtletController::class, 'getStats']);
Route::post('atlets/eligible', [AtletController::class, 'getEligible']);
Route::get('atlets/dojang/{id_dojang}', [AtletController::class, 'getByDojang']);
Route::apiResource('atlets', AtletController::class);
Route::get('/bukti-transfers', [BuktiTransferController::class, 'index']);
Route::post('/bukti-transfers', [BuktiTransferController::class, 'store']);
Route::delete('/bukti-transfers/{buktiTransfer}', [BuktiTransferController::class, 'destroy']);
Route::get('/bukti-transfers/dojang/{dojang}', [BuktiTransferController::class, 'getByDojang']);
Route::get('/bukti-transfers/pelatih/{pelatih}', [BuktiTransferController::class, 'getByPelatih']);

Route::post('/certificates/generate', [CertificateController::class, 'generateCertificateNumber']);
Route::get('/atlets/{atlet}/certificates', [CertificateController::class, 'getAthleteCertificates']);
Route::get('/atlets/{atlet}/peserta-kompetisi/{pesertaKompetisi}/certificates/check', [CertificateController::class, 'checkCertificateExists']);
Route::apiResource('dojangs', DojangController::class);
Route::get('/dojangs/{dojang}/active-kompetisi', [DojangController::class, 'getActiveKompetisi']);
Route::get('/kelas/kelompok-usia', [KelasController::class, 'getKelompokUsia']);
Route::get('/kelas/berat', [KelasController::class, 'getKelasBerat']);
Route::get('/kelas/poomsae', [KelasController::class, 'getKelasPoomsae']);
Route::get('/kompetisi/{kompetisi}/kelas-kejuaraan', [KelasController::class, 'getKelasKejuaraanByKompetisi']);

Route::apiResource('kompetisis', KompetisiController::class);
Route::post('/kompetisi/{kompetisi}/register-atlet', [KompetisiController::class, 'registerAtlet']);
Route::delete('/kompetisi/{kompetisi}/participants/{pesertaKompetisi}', [KompetisiController::class, 'deleteParticipant']);
Route::get('/kompetisi/{kompetisi}/atlets', [KompetisiController::class, 'getAtletsByKompetisi']);
Route::put('/kompetisi/{kompetisi}/participants/{pesertaKompetisi}/status', [KompetisiController::class, 'updateRegistrationStatus']);
Route::put('/kompetisi/{kompetisi}/participants/{pesertaKompetisi}/class', [KompetisiController::class, 'updateParticipantClass']);
Route::get('/kompetisi/{kompetisi}/participants/{pesertaKompetisi}/available-classes', [KompetisiController::class, 'getAvailableClassesForParticipant']);
Route::post('/kompetisi/{kompetisi}/participants/{pesertaKompetisi}/penimbangan', [KompetisiController::class, 'updatePenimbangan']);
Route::post('/kompetisi/{kompetisi}/generate-brackets', [KompetisiController::class, 'generateBrackets']);


// Lapangan Routes
Route::prefix('lapangan')->group(function () {
    Route::post('/hari', [LapanganController::class, 'tambahHariLapangan']);
    Route::delete('/hari', [LapanganController::class, 'hapusHariLapangan']);
    Route::post('/lapangan', [LapanganController::class, 'tambahLapanganKeHari']);
    Route::delete('/lapangan', [LapanganController::class, 'hapusLapangan']);
    Route::post('/kelas', [LapanganController::class, 'simpanKelasLapangan']);
    Route::get('/{lapangan}/kelas', [LapanganController::class, 'getKelasKejuaraanByLapangan']);
    Route::post('/antrian', [LapanganController::class, 'simpanAntrian']);
});
Route::get('/kompetisi/{kompetisi}/lapangan', [LapanganController::class, 'getHariLapanganByKompetisi']);

Route::apiResource('pelatihs', PelatihController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/pelatih/me', [PelatihController::class, 'me']);
    Route::post('/pelatih/upload-files', [PelatihController::class, 'uploadFiles']);
    Route::delete('/pelatih/delete-file/{fileType}', [PelatihController::class, 'deleteFile']);
});

Route::apiResource('peserta-kompetisi', PesertaKompetisiController::class);
Route::get('/pertandingan/kompetisi/{kompetisi}', [PertandinganController::class, 'getPertandinganInfo']);