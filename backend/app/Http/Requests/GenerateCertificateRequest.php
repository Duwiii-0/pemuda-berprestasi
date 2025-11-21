<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateCertificateRequest extends FormRequest
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
            'id_atlet' => 'required|integer|exists:tb_atlet,id_atlet',
            'id_peserta_kompetisi' => 'required|integer|exists:tb_peserta_kompetisi,id_peserta_kompetisi',
            'id_kompetisi' => 'required|integer|exists:tb_kompetisi,id_kompetisi',
            'medal_status' => 'nullable|string',
        ];
    }
}