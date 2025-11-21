<?php

namespace App\Http\Controllers;

use App\Models\Dojang;
use App\Models\Kompetisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Requests\StoreDojangRequest;
use App\Http\Requests\UpdateDojangRequest;

class DojangController extends Controller
{
    /**
     * Display a listing of the resource with search and counts.
     */
    public function index(Request $request)
    {
        $query = Dojang::query()->withCount('atlet')->with('pelatih');

        // Search by name
        $query->when($request->input('search'), function ($q, $search) {
            return $q->where('nama_dojang', 'like', "%{$search}%");
        });

        $dojangs = $query->orderBy('id_dojang', 'desc')->paginate($request->input('limit', 100));
        
        // Format data to match legacy output
        $dojangs->getCollection()->transform(function ($item) {
            $item->jumlah_atlet = $item->atlet_count;
            unset($item->atlet_count);
            return $item;
        });

        return $dojangs;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDojangRequest $request)
    {
        $validatedData = $request->validated();
        
        if ($request->hasFile('logo')) {
            $validatedData['logo'] = $request->file('logo')->store('dojang/logos', 'public');
        }

        $dojang = Dojang::create($validatedData);

        return response()->json($dojang, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Dojang $dojang)
    {
        return $dojang->load(['pelatih', 'atlet']);
    }

    /**
     * Get the active or most relevant competition for a dojang.
     */
    public function getActiveKompetisi(Dojang $dojang)
    {
        $activeStatuses = ['PENDAFTARAN_BUKA', 'PENDAFTARAN_TUTUP', 'BERJALAN'];

        // 1. Find an active competition where the dojang has participants
        $activeKompetisi = Kompetisi::whereIn('status', $activeStatuses)
            ->whereHas('peserta', function ($query) use ($dojang) {
                $query->where('id_dojang', $dojang->id_dojang);
            })
            ->orderBy('tanggal_mulai', 'desc')
            ->first();

        // 2. If not found, find the latest active competition
        if (!$activeKompetisi) {
            $activeKompetisi = Kompetisi::whereIn('status', $activeStatuses)
                ->orderBy('tanggal_mulai', 'desc')
                ->first();
        }

        // 3. If still not found, find the absolute latest competition
        if (!$activeKompetisi) {
            $activeKompetisi = Kompetisi::orderBy('id_kompetisi', 'desc')->first();
        }

        return response()->json($activeKompetisi);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDojangRequest $request, Dojang $dojang)
    {
        $validatedData = $request->validated();

        if ($request->hasFile('logo')) {
            // Delete old logo if it exists
            if ($dojang->logo) {
                Storage::disk('public')->delete($dojang->logo);
            }
            // Store new logo
            $validatedData['logo'] = $request->file('logo')->store('dojang/logos', 'public');
        }

        $dojang->update($validatedData);

        return response()->json($dojang);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Dojang $dojang)
    {
        // Prevent deletion if there are related bukti_transfer records
        if ($dojang->buktiTransfer()->exists()) {
            return response()->json(['message' => 'Tidak bisa menghapus dojang yang memiliki riwayat bukti transfer'], 400);
        }

        // Delete logo from storage
        if ($dojang->logo) {
            Storage::disk('public')->delete($dojang->logo);
        }

        $dojang->delete();

        return response()->json(null, 204);
    }
}
