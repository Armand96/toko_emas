<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class SalesRequest extends FormRequest
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
            'customer_id' => ['required', 'integer'],
            'user_id' => ['required', 'integer'],
            'branch_id' => ['required', 'integer'],
            'payment_type' => ['required', 'string'],
            'nominal_paid' => ['nullable', 'numeric'],
            'exchange' => ['nullable', 'numeric'],
            'sender_rekening' => ['nullable', 'string'],
            'sender_bank_name' => ['nullable', 'numeric'],
            'sender_bank_id' => ['nullable', 'numeric'],
            'receiver_bank_id' => ['nullable', 'numeric'],

            'item' => ['required', 'array', 'min:1'],

            'item.*.inventory_id' => ['required', 'string'],
            'item.*.product_id' => ['required', 'integer'],
            'item.*.price' => ['required', 'numeric'],
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
