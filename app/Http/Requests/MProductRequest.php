<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class MProductRequest extends FormRequest
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
        $imageRules = [
            'image',
            'mimes:jpeg,png,jpg,gif',
            'max:2048',
            'nullable'
        ];

        return [
            'product_name' => 'required|string',

            'branch_id' => 'required|array|min:1',
            'branch_id.*' => 'required|integer',

            'category_id' => 'required|integer',
            'subcategory_id' => 'required|integer',

            'description' => 'required|string',

            'is_active' => 'nullable|boolean',

            'image_path' => 'nullable|string',
            'thumb_path' => 'nullable|string',

            'image' => $imageRules,
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
