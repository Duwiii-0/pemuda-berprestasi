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
Route::apiResource('bukti-transfers', BuktiTransferController::class);
Route::apiResource('certificates', CertificateController::class);
Route::apiResource('dojangs', DojangController::class);
Route::apiResource('kelas', KelasController::class);
Route::apiResource('kompetisis', KompetisiController::class);
Route::apiResource('lapangans', LapanganController::class);
Route::apiResource('pelatihs', PelatihController::class);
Route::apiResource('pertandingans', PertandinganController::class);
