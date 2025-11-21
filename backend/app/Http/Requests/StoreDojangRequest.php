<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDojangRequest extends FormRequest
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
            'nama_dojang' => ['required', 'string', 'max:255', Rule::unique('tb_dojang', 'nama_dojang')],
            'email' => 'nullable|email|max:255',
            'no_telp' => 'nullable|string|max:50',
            'negara' => 'nullable|string|max:100',
            'provinsi' => 'nullable|string|max:100',
            'kota' => 'nullable|string|max:100',
            'alamat' => 'nullable|string',
            'founder' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ];
    }
}