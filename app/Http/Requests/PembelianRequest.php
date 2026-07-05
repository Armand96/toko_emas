<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class PembelianRequest extends FormRequest
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
            'data' => ['required', 'array', 'min:1'],

            'data.*.branch_id' => ['required', 'integer'],
            'data.*.product_id' => ['required', 'integer'],
            'data.*.category_id' => ['required', 'integer'],
            'data.*.subcategory_id' => ['required', 'integer'],
            'data.*.supplier_id' => ['nullable', 'integer'],
            'data.*.customer_id' => ['nullable', 'integer'],
            'data.*.batch' => ['nullable', 'integer'],
            'data.*.barcode' => ['required', 'string'],
            'data.*.bank_cabang_id' => ['nullable', 'integer'],
            'data.*.berat' => ['required', 'numeric'],
            'data.*.karat' => ['required', 'numeric'],
            'data.*.modal' => ['required', 'numeric'],
            'data.*.tipe_pembayaran' => ['required', 'string'],
            'data.*.serial_number' => ['nullable', 'string'],
            'data.*.jual' => ['nullable', 'numeric'],
        ];
    }

    protected function prepareForValidation()
    {
        $data = $this->input('data', []);

        $data = array_map(function ($item) {
            $item['jual'] = $item['jual'] ?? 0;
            return $item;
        }, $data);

        $this->merge(['data' => $data]);
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Validation error',
            'errors' => $validator->errors(),
        ], 422));
    }
}
