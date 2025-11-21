<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterPesertaKompetisiRequest extends FormRequest
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
            'atlitId' => 'required|integer|exists:tb_atlet,id_atlet',
            'kelasKejuaraanId' => 'required|integer|exists:tb_kelas_kejuaraan,id_kelas_kejuaraan',
            'atlitId2' => 'nullable|integer|exists:tb_atlet,id_atlet|different:atlitId',
            'isTeam' => 'boolean', // Provided by frontend, will be re-evaluated in controller
        ];
    }
}