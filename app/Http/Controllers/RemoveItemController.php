<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\RemoveItemJenis;
use App\Helpers\RemoveItemStatus;
use App\Http\Requests\RemoveItemRequest;
use App\Http\Requests\UpdateStatusRemoveItemRequest;
use App\Models\Inventory;
use App\Models\RemoveItem;
use App\Models\RemoveItemDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RemoveItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = RemoveItem::query();

        if ($request->has('code') && $request->code != "") {
            $query->where('code', 'like', '%' . $request->code . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('jenis') && $request->jenis != "") {
            $query->where('jenis', $request->jenis);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $removeItems = $query->with(['branch', 'user', 'details.inventory'])->paginate($perPage);

        return response()->json($removeItems);
    }

    public function single(RemoveItem $removeItem)
    {
        return ApiResponse::success($removeItem->load(['branch', 'user', 'details.inventory']));
    }

    public function createRemoveItem(RemoveItemRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $code = 'RMV-' . date('Ymd') . "-";
            $counter = RemoveItem::where('code', 'like', $code . "%")->count();
            $counter++;
            $code = $code . str_pad($counter, 4, "0", STR_PAD_LEFT);

            $hdrRemove = array(
                'code' => $code,
                'branch_id' => $validated['branch_id'],
                'created_by' => $request->user()->id,
                'note' => isset($validated['note']) ? $validated['note'] : null,
                'jenis' => $validated['jenis'],
                'status' => RemoveItemStatus::APPROVAL,
            );

            $hdrData = RemoveItem::create($hdrRemove);

            $dateNow = date('Y-m-d H:i:s');
            $insertBatch = [];

            foreach ($validated['item'] as $index => $value) {
                $itemData = array(
                    'remove_header_id' => $hdrData->id,
                    'product_id' => $value['product_id'],
                    'inventory_code' => $value['inventory_code'],
                    'created_at' => $dateNow
                );

                array_push($insertBatch, $itemData);
            }

            RemoveItemDetail::insert($insertBatch);

            DB::commit();

            return ApiResponse::success([], "Success create remove item request", 200);
        } catch (\Throwable $th) {
            DB::rollback();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function changeApproval(UpdateStatusRemoveItemRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            $dateNow = date('Y-m-d H:i:s');
            $status = RemoveItemStatus::from($validated['status']);
            RemoveItem::where('id', $validated['remove_id'])->update([
                'status' => $status,
                'note' => isset($validated['note']) ? $validated['note'] : null,
                'updated_at' => $dateNow
            ]);

            $products = RemoveItemDetail::where('remove_header_id', $validated['remove_id'])->pluck('inventory_code')->toArray();
            if ($status == RemoveItemStatus::DISETUJUI) {
                $dateNow = date('Y-m-d H:i:s');

                $removeItemData = RemoveItem::find($validated['remove_id']);
                $jenis = RemoveItemJenis::from($removeItemData->jenis);
                Inventory::whereIn('inventory_code', $products)->update(array('status' => $jenis == RemoveItemJenis::HILANG ? InventoryStatus::LOST : InventoryStatus::REPAIR, 'updated_at' => $dateNow));
            } elseif ($status == RemoveItemStatus::RETURN) {
                Inventory::whereIn('inventory_code', $products)->update(array('status' => InventoryStatus::AVAILABLE, 'updated_at' => $dateNow));
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status removal", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
