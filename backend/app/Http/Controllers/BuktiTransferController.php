<?php

namespace App\Http\Controllers;

use App\Models\BuktiTransfer;
use App\Models\Dojang;
use App\Models\Pelatih;
use App\Http\Requests\StoreBuktiTransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BuktiTransferController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return BuktiTransfer::with(['dojang', 'pelatih'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBuktiTransferRequest $request)
    {
        $validatedData = $request->validated();
        
        $filePath = $request->file('bukti_transfer')->store('pelatih/BuktiTf', 'public');

        $buktiTransfer = BuktiTransfer::create([
            'id_dojang' => $validatedData['id_dojang'],
            'id_pelatih' => $validatedData['id_pelatih'],
            'bukti_transfer_path' => basename($filePath),
        ]);

        return response()->json($buktiTransfer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(BuktiTransfer $buktiTransfer)
    {
        return $buktiTransfer->load(['dojang', 'pelatih']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BuktiTransfer $buktiTransfer)
    {
        if ($buktiTransfer->bukti_transfer_path) {
            Storage::disk('public')->delete('pelatih/BuktiTf/' . $buktiTransfer->bukti_transfer_path);
        }
        
        $buktiTransfer->delete();

        return response()->json(null, 204);
    }

    /**
     * Get proofs of transfer by dojang.
     */
    public function getByDojang(Dojang $dojang)
    {
        return $dojang->buktiTransfer()->with(['dojang', 'pelatih'])->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get proofs of transfer by pelatih.
     */
    public function getByPelatih(Pelatih $pelatih)
    {
        return $pelatih->buktiTransfer()->with(['dojang', 'pelatih'])->orderBy('created_at', 'desc')->get();
    }
}
