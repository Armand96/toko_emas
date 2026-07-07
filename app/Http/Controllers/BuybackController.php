<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\BuybackStatus;
use App\Helpers\FinancePaymentMethod;
use App\Helpers\FinanceType;
use App\Helpers\InventoryStatus;
use App\Http\Requests\BuybackRequest;
use App\Http\Requests\UpdateStatusBuybackRequest;
use App\Models\Buyback;
use App\Models\BuybackDetail;
use App\Models\Finance;
use App\Models\Inventory;
use App\Models\MCategoryFinance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BuybackController extends Controller
{
    /**
     * Display a paginated listing of buyback transactions.
     */
    public function index(Request $request)
    {
        $query = Buyback::query();

        if ($request->has('buyback_code') && $request->buyback_code != '') {
            $query->where('buyback_code', 'like', '%' . $request->buyback_code . '%');
        }

        if ($request->has('customer_id') && $request->customer_id != '') {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        if ($request->has('branch_id') && $request->branch_id != '') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('payment_type') && $request->payment_type != '') {
            $query->where('payment_type', $request->payment_type);
        }

        $perPage = $request->input('per_page', 10);
        $buybacks = $query
            ->orderBy('id', 'desc')
            ->with([
                'customer',
                'user',
                'branch',
                'senderBank.bank',
                'details.product',
                'details.inventory',
            ])
            ->paginate($perPage);

        return response()->json($buybacks);
    }

    /**
     * Display a single buyback transaction.
     */
    public function single(Buyback $buyback)
    {
        return ApiResponse::success($buyback->load([
            'customer',
            'user',
            'branch',
            'senderBank.bank',
            'details.product',
            'details.inventory',
        ]));
    }

    /**
     * Create a new buyback transaction (header + details).
     * Status starts at APPROVAL pending owner review.
     */
    public function createTrx(BuybackRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            // Generate sequential Buyback ID: BB-YYMM####
            $prefix = 'BB-' . date('ym');
            $latestBuyback = Buyback::where('buyback_code', 'like', $prefix . '%')
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('buyback_code');

            $counter = $latestBuyback
                ? (int) substr($latestBuyback, strrpos($latestBuyback, $prefix) + strlen($prefix)) + 1
                : 1;

            $buybackId = $prefix . str_pad($counter, 4, '0', STR_PAD_LEFT);

            // Create header
            $header = Buyback::create([
                'buyback_code'        => $buybackId,
                'customer_id'         => $validated['customer_id'],
                'branch_id'           => $validated['branch_id'],
                'created_by'          => $request->user()->id,
                'sub_total'           => 0,
                'grand_total'         => 0,
                'payment_type'        => $validated['payment_type'],
                'receiver_name'       => $validated['receiver_name'] ?? null,
                'receiver_bank_name'  => $validated['receiver_bank_name'] ?? null,
                'receiver_rekening'   => $validated['receiver_rekening'] ?? null,
                'sender_bank_id'      => $validated['sender_bank_id'] ?? null,
                'status'              => BuybackStatus::APPROVAL,
            ]);

            // Create details
            $insertBatch = [];
            $subTotal    = 0;

            foreach ($validated['item'] as $value) {
                $subTotal += $value['price'];

                $insertBatch[] = [
                    'buyback_id'     => $header->id,
                    'product_id'     => $value['product_id'],
                    'inventory_code' => $value['inventory_code'] ?? null,
                    'berat'          => $value['berat'],
                    'karat'          => $value['karat'],
                    'serial_number'  => $value['serial_number'] ?? null,
                    'price'          => $value['price'],
                    'created_at'     => $header->created_at,
                    'updated_at'     => $header->created_at,
                ];
            }

            BuybackDetail::insert($insertBatch);

            $header->sub_total   = $subTotal;
            $header->grand_total = $subTotal;
            $header->save();

            DB::commit();

            return ApiResponse::success(
                $header->load(['customer', 'details.product']),
                'Sukses buat transaksi buyback',
                201
            );
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error($th);

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Change approval status of a buyback transaction.
     *
     * Flow:
     *   APPROVAL → CETAK KWITANSI → SELESAI  (approved path)
     *   APPROVAL → DITOLAK / DIBATALKAN       (rejected path)
     *
     * On SELESAI: items are recorded as new inventory (pembelian kembali)
     *             and a CASHOUT finance entry is created.
     */
    public function changeApproval(UpdateStatusBuybackRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            /** @var Buyback $data */
            $data = Buyback::where('id', $validated['buyback_id'])
                ->lockForUpdate()
                ->first();

            if (!$data) {
                DB::rollBack();
                return ApiResponse::error('Buyback tidak ditemukan', null, 404);
            }

            $newStatus = BuybackStatus::from($validated['status']);

            $data->update([
                'status' => $validated['status'],
                'note'   => $validated['note'] ?? null,
            ]);

            if ($newStatus === BuybackStatus::SELESAI) {
                // Load details to create inventory entries for each bought-back item
                $details  = BuybackDetail::where('buyback_id', $data->id)->get();
                $dateNow  = date('Y-m-d H:i:s');

                foreach ($details as $detail) {
                    // Determine next inventory_code for this product
                    $latestInventory = Inventory::where('product_id', $detail->product_id)
                        ->lockForUpdate()
                        ->orderByDesc('id')
                        ->value('inventory_code');

                    $seq = $latestInventory
                        ? (int) substr($latestInventory, strrpos($latestInventory, '-') + 1)
                        : 0;

                    // Derive barcode prefix from product (same logic as pembelian)
                    $product = $detail->product;
                    $barcode = $product ? $product->barcode : 'BB';

                    $inventoryCode = $barcode . '-' . str_pad($seq + 1, 4, '0', STR_PAD_LEFT);

                    // Update detail with generated inventory code
                    $detail->inventory_code = $inventoryCode;
                    $detail->save();

                    Inventory::create([
                        'inventory_code' => $inventoryCode,
                        'product_id'     => $detail->product_id,
                        'branch_id'      => $data->branch_id,
                        'berat'          => $detail->berat,
                        'karat'          => $detail->karat,
                        'serial_number'  => $detail->serial_number,
                        'modal'          => $detail->price,
                        'jual'           => $detail->price,
                        'status'         => InventoryStatus::AVAILABLE,
                        'created_at'     => $dateNow,
                    ]);
                }

                // Record cash-out finance entry (store pays the customer)
                $categoryFinance = MCategoryFinance::where('category_name', 'like', '%Buyback%')->first();
                Finance::create([
                    'branch_id'          => $data->branch_id,
                    'category_finance_id' => $categoryFinance?->id,
                    'bank_cabang_id'     => $data->payment_type === 'TUNAI' ? 0 : ($data->sender_bank_id ?? 0),
                    'type'               => FinanceType::CASHOUT,
                    'payment_method'     => $data->payment_type === 'TUNAI'
                        ? FinancePaymentMethod::TUNAI
                        : FinancePaymentMethod::TRANSFER,
                    'nominal'            => $data->grand_total,
                    'is_auto'            => true,
                ]);
            }

            DB::commit();

            return ApiResponse::success([], 'Sukses update status buyback', 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error($th);

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
