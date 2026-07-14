<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreInventoryRequest extends FormRequest
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
        return [
            'product_id' => ['required', 'integer', 'exists:m_products,id'],
            'category_id' => ['required', 'integer'],
            'subcategory_id' => ['nullable', 'integer'],
            'branch_id' => ['required', 'integer'],
            'berat' => ['required', 'numeric'],
            'karat' => ['required', 'integer'],
            'modal' => ['required', 'numeric'],
            'jual' => ['nullable', 'numeric'],
            'note' => ['nullable', 'string'],
            'serial_number' => ['nullable', 'string'],
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
