<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAtletRequest extends FormRequest
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
            'nama_atlet' => 'required|string|max:150',
            'tanggal_lahir' => 'required|date',
            'nik' => ['required', 'string', 'max:191', Rule::unique('tb_atlet', 'nik')],
            'berat_badan' => 'required|numeric',
            'tinggi_badan' => 'required|numeric',
            'jenis_kelamin' => ['required', Rule::in(['LAKI_LAKI', 'PEREMPUAN'])],
            'id_dojang' => 'required|integer|exists:tb_dojang,id_dojang',
            'id_pelatih_pembuat' => 'required|integer|exists:tb_pelatih,id_pelatih',
            'provinsi' => 'required|string|max:100',
            'kota' => 'nullable|string|max:100',
            'alamat' => 'nullable|string|max:191',
            'belt' => 'required|string|max:191',
            'no_telp' => 'nullable|string|max:191',
            'akte_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'pas_foto' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'sertifikat_belt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ];
    }
}