<?php

namespace App\Http\Controllers;

use App\Models\Kompetisi;
use Illuminate\Http\Request;

class KompetisiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Kompetisi::with('penyelenggara')->paginate(100);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'id_penyelenggara' => 'required|exists:tb_penyelenggara,id_penyelenggara',
            'tanggal_mulai' => 'required|date',
            'lokasi' => 'required|string|max:255',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'nama_event' => 'required|string|max:255',
            'status' => 'required|in:PENDAFTARAN,SEDANG_DIMULAI,SELESAI',
            'deskripsi' => 'nullable|string',
            'website_url' => 'nullable|url|max:500',
            'poster_image' => 'nullable|string|max:255', // Assuming string path for image
        ]);

        $kompetisi = Kompetisi::create($validatedData);

        return response()->json($kompetisi, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Kompetisi::with('penyelenggara')->findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $kompetisi = Kompetisi::findOrFail($id);

        $validatedData = $request->validate([
            'id_penyelenggara' => 'sometimes|required|exists:tb_penyelenggara,id_penyelenggara',
            'tanggal_mulai' => 'sometimes|required|date',
            'lokasi' => 'sometimes|required|string|max:255',
            'tanggal_selesai' => 'sometimes|required|date|after_or_equal:tanggal_mulai',
            'nama_event' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|required|in:PENDAFTARAN,SEDANG_DIMULAI,SELESAI',
            'deskripsi' => 'nullable|string',
            'website_url' => 'nullable|url|max:500',
            'poster_image' => 'nullable|string|max:255', // Assuming string path for image
        ]);

        $kompetisi->update($validatedData);

        return response()->json($kompetisi);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $kompetisi = Kompetisi::findOrFail($id);
        $kompetisi->delete();

        return response()->json(null, 204);
    }
}
