<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKompetisiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_penyelenggara' => 'required|integer|exists:tb_penyelenggara,id_penyelenggara',
            'id_kategori_event' => 'required|integer|exists:tb_kategori_event,id_kategori_event',
            'nama_kompetisi' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date|after_or_equal:today',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'lokasi' => 'nullable|string|max:191',
            'status' => ['required', Rule::in(['PENDAFTARAN_BUKA', 'PENDAFTARAN_TUTUP', 'BERJALAN', 'SELESAI', 'DIBATALKAN'])],
            'banner' => 'nullable|file|mimes:jpg,jpeg,png|max:2048',
            'proposal' => 'nullable|file|mimes:pdf|max:2048',
        ];
    }
}