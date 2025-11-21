<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBuktiTransferRequest extends FormRequest
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
            'id_dojang' => 'required|integer|exists:tb_dojang,id_dojang',
            'id_pelatih' => 'required|integer|exists:tb_pelatih,id_pelatih',
            'bukti_transfer' => 'required|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ];
    }
}