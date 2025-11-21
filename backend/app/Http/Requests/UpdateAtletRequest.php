<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAtletRequest extends FormRequest
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
        $atletId = $this->route('atlet');

        return [
            'nama_atlet' => 'sometimes|required|string|max:150',
            'tanggal_lahir' => 'sometimes|required|date',
            'nik' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('tb_atlet', 'nik')->ignore($atletId, 'id_atlet')],
            'berat_badan' => 'sometimes|required|numeric',
            'tinggi_badan' => 'sometimes|required|numeric',
            'jenis_kelamin' => ['sometimes', 'required', Rule::in(['LAKI_LAKI', 'PEREMPUAN'])],
            'id_dojang' => 'sometimes|required|integer|exists:tb_dojang,id_dojang',
            'id_pelatih_pembuat' => 'sometimes|required|integer|exists:tb_pelatih,id_pelatih',
            'provinsi' => 'sometimes|required|string|max:100',
            'kota' => 'nullable|string|max:100',
            'alamat' => 'nullable|string|max:191',
            'belt' => 'sometimes|required|string|max:191',
            'no_telp' => 'nullable|string|max:191',
            'akte_kelahiran' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'pas_foto' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'sertifikat_belt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ];
    }
}