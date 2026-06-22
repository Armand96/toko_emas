<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\FinancePaymentMethod;
use App\Helpers\FinanceType;
use App\Helpers\InventoryStatus;
use App\Helpers\SalesPaymentMethod;
use App\Helpers\SalesStatus;
use App\Http\Requests\SalesRequest;
use App\Http\Requests\UpdateStatusSalesRequest;
use App\Models\Finance;
use App\Models\Inventory;
use App\Models\MCategoryFinance;
use App\Models\TSales;
use App\Models\TSalesDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TSalesController extends Controller
{
    public function index(Request $request)
    {
        $query = TSales::query();

        if ($request->has('order_id') && $request->order_id != "") {
            $query->where('order_id', 'like', '%' . $request->order_id . '%');
        }
        if ($request->has('customer_name') && $request->customer_name != "") {
            $query->where('customer.customer_name', 'like', '%' . $request->customer_name . '%');
        }
        if ($request->has('approval_status') && $request->status != "") {
            $query->where('approval_status', $request->status);
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $sales = $query->orderBy('id', 'desc')->with(['customer', 'user', 'details.inventory', 'details.product', 'branch'])->paginate($perPage);

        return response()->json($sales);
    }

    public function single(TSales $sales)
    {
        return ApiResponse::success($sales->load(['customer', 'user', 'details.inventory', 'details.product', 'branch']));
    }

    public function createTrx(SalesRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $orderId = 'ORD-' . date('Ymd') . "-";
            $counter = TSales::where('order_id', 'like', $orderId . "%")->count();
            $counter++;
            $orderId = $orderId . str_pad($counter, 4, "0", STR_PAD_LEFT);

            $hdrSales = array(
                'order_id' => $orderId,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'created_by' => $request->user()->id,
                'sub_total' => 0,
                'grand_total' => 0,
                'payment_type' => $validated['payment_type'],
                'sender_name' => isset($validated['sender_bank_name']) ? $validated['sender_bank_name'] : null,
                'sender_rekening' => isset($validated['sender_rekening']) ? $validated['sender_rekening'] : null,
                'sender_bank_id' => isset($validated['sender_bank_id']) ? $validated['sender_bank_id'] : null,
                'approval_status' => SalesStatus::APPROVAL,
                'nominal_paid' => isset($validated['nominal_paid']) ? $validated['nominal_paid'] : null,
                'exchange' => isset($validated['exchange']) ? $validated['exchange'] : null,
            );

            $hdrData = TSales::create($hdrSales);

            $dateNow = date('Y-m-d H:i:s');
            $insertBatch = [];
            $subTotal = 0;

            foreach ($validated['item'] as $index => $value) {
                $itemData = array(
                    'sales_id' => $hdrData->id,
                    'product_id' => $value['product_id'],
                    'price' => $value['price'],
                    'inventory_code' => $value['inventory_code'],
                    'created_at' => $dateNow
                );

                $subTotal += $value['price'];
                array_push($insertBatch, $itemData);
            }

            TSalesDetail::insert($insertBatch);

            $hdrData->sub_total = $subTotal;
            $hdrData->grand_total = $subTotal;
            $hdrData->save();

            DB::commit();

            return ApiResponse::success([], "Success create transaction", 200);
        } catch (\Throwable $th) {
            DB::rollback();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function changeApproval(UpdateStatusSalesRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            // $dateNow = date('Y-m-d H:i:s');
            $status = SalesStatus::from($validated['status']);
            $data = TSales::where('id', $validated['penjualan_id'])->with(['branch.bankcabang'])->first();
            $data->update([
                'approval_status' => $validated['status'],
                'note' => isset($validated['note']) ? $validated['note'] : null
            ]);

            if ($status == SalesStatus::DISETUJUI) {
                $products = TSalesDetail::where('sales_id', $validated['penjualan_id'])->pluck('inventory_code')->toArray();
                $dateNow = date('Y-m-d H:i:s');

                Inventory::whereIn('inventory_code', $products)->update(array('status' => InventoryStatus::SOLD, 'updated_at' => $dateNow));

                $salesPaymentMethod = SalesPaymentMethod::from($data->payment_type);
                $categoryFinance = MCategoryFinance::where('category_name', 'like', '%Penjualan%')->first();
                Finance::create(array(
                    'branch_id' => $data->branch_id,
                    'category_finance_id' => $categoryFinance->id,
                    'bank_cabang_id' => $salesPaymentMethod == SalesPaymentMethod::TUNAI ? 0 : $data->branch->bankcabang->id,
                    'type' => FinanceType::CASHIN,
                    'payment_method' => $salesPaymentMethod == SalesPaymentMethod::TUNAI ? FinancePaymentMethod::CASH : FinancePaymentMethod::TRANSFER,
                    'nominal' => $data->grand_total
                ));
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status penjualan", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
