<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class MProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'data' => ['required', 'array', 'min:1'],

            'data.*.product_name' => ['required', 'string'],
            'data.*.branch_id' => ['required', 'integer'],
            'data.*.category_id' => ['required', 'integer'],
            'data.*.subcategory_id' => ['required', 'integer'],
            'data.*.description' => ['required', 'string'],
            'data.*.is_active' => ['nullable', 'boolean'],

            // optional image path
            'data.*.image_path' => ['nullable', 'string'],
            'data.*.thumb_path' => ['nullable', 'string'],
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
