<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePesertaKompetisiPenimbanganRequest extends FormRequest
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
            'penimbangan1' => 'sometimes|nullable|numeric|min:0',
            'penimbangan2' => 'sometimes|nullable|numeric|min:0',
        ];
    }

    protected function prepareForValidation()
    {
        // Ensure at least one field is present
        if (!$this->has('penimbangan1') && !$this->has('penimbangan2')) {
            $this->merge(['_error_no_fields' => true]);
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('_error_no_fields')) {
                $validator->errors()->add('fields', 'Harus mengubah minimal penimbangan1 atau penimbangan2.');
            }
        });
    }
}