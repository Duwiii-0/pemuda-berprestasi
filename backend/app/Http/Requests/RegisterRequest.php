<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
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
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('tb_akun', 'email')],
            'password' => ['required', 'string', 'min:6'],
            'nama_pelatih' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'string', 'max:191', Rule::unique('tb_pelatih', 'nik')],
            'id_dojang' => ['required', 'integer', 'exists:tb_dojang,id_dojang'],
            'no_telp' => ['nullable', 'string', 'max:50'],
        ];
    }
}