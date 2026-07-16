<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class FinanceRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $FileRules = [
            'file',
            'max:2048',
            'nullable'
        ];

        return [
            'branch_id' => "required|string",
            'category_finance_id' => "required|string",
            'bank_cabang_id' => "required|string",
            'type' => "required|string",
            'payment_method' => "required|string",
            'nominal' => "required|string",
            'note' => "required|string",
            'attachment' => $FileRules,
        ];
    }

    public function messages(): array
    {
        return [
            'attachment.max' => 'Ukuran file terlalu besar. Maksimal ukuran file adalah 2 MB.',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Validation error',
            'errors' => $validator->errors()
        ], 422));
    }
}
