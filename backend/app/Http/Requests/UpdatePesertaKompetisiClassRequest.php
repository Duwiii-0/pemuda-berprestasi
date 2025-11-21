<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePesertaKompetisiClassRequest extends FormRequest
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
            'kelas_kejuaraan_id' => 'sometimes|nullable|integer|exists:tb_kelas_kejuaraan,id_kelas_kejuaraan',
            'status' => ['sometimes', 'nullable', 'string', Rule::in(['PENDING', 'APPROVED', 'REJECTED'])],
        ];
    }

    protected function prepareForValidation()
    {
        // Ensure at least one field is present
        if (!$this->has('kelas_kejuaraan_id') && !$this->has('status')) {
            $this->merge(['_error_no_fields' => true]);
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('_error_no_fields')) {
                $validator->errors()->add('fields', 'Harus mengubah minimal kelas atau status.');
            }
        });
    }
}