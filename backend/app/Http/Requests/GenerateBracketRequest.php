<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateBracketRequest extends FormRequest
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
            'kelasKejuaraanId' => 'required|integer|exists:tb_kelas_kejuaraan,id_kelas_kejuaraan',
            'dojangSeparation' => 'nullable|array',
            'dojangSeparation.enabled' => 'nullable|boolean',
            'dojangSeparation.mode' => ['nullable', 'string', Rule::in(['STRICT', 'BALANCED'])],
        ];
    }
}