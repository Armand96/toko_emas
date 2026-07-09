<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BuybackRequest extends FormRequest
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
            'customer_id'         => ['required', 'integer'],
            'branch_id'           => ['required', 'integer'],
            'payment_type'        => ['required', 'string', 'in:TUNAI,TRANSFER'],
            'receiver_name'       => ['nullable', 'string'],
            'receiver_bank_name'  => ['nullable', 'string'],
            'receiver_rekening'   => ['nullable', 'string'],
            'sender_bank_id'      => ['nullable', 'integer'],
            'bank_cabang_id'      => ['nullable', 'integer'],

            'item'                => ['required', 'array', 'min:1'],
            'item.*.product_id'   => ['required', 'integer'],
            'item.*.berat'        => ['required', 'numeric'],
            'item.*.karat'        => ['required', 'integer'],
            'item.*.price'        => ['required', 'numeric'],
            'item.*.serial_number'=> ['nullable', 'string'],
            'item.*.inventory_code' => ['nullable', 'string'],
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Validation error',
            'errors'  => $validator->errors()
        ], 422));
    }
}
