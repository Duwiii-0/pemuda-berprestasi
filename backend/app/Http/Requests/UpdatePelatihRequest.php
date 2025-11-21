<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePelatihRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization logic can be handled by middleware or in the controller
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Getting the pelatih instance from the route
        $pelatihId = $this->route('pelatih');

        return [
            'nama_pelatih' => 'sometimes|required|string|max:255',
            'no_telp' => 'nullable|string|max:50',
            'nik' => ['sometimes', 'required', 'string', 'max:191', Rule::unique('tb_pelatih', 'nik')->ignore($pelatihId, 'id_pelatih')],
            'tanggal_lahir' => 'nullable|date',
            'jenis_kelamin' => ['nullable', Rule::in(['LAKI_LAKI', 'PEREMPUAN'])],
            'provinsi' => 'nullable|string|max:100',
            'kota' => 'nullable|string|max:100',
            'alamat' => 'nullable|string|max:191',
            'foto_ktp' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'sertifikat_sabuk' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}