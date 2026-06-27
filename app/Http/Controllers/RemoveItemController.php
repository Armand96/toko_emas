<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\RemoveItemJenis;
use App\Helpers\RemoveItemStatus;
use App\Http\Requests\RemoveItemRequest;
use App\Http\Requests\UpdateStatusRemoveItemDetailRequest;
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
        $removeItems = $query->orderBy('id', 'desc')->with(['branch', 'user', 'details.inventory'])->paginate($perPage);

        return response()->json($removeItems);
    }

    public function single(RemoveItem $removeItem)
    {
        return ApiResponse::success($removeItem->load(['branch', 'user', 'details.inventory', 'details.product']));
    }

    public function indexDetail(Request $request)
    {
        $query = RemoveItemDetail::query()
            ->with(['header.branch', 'header.user', 'product', 'inventory']);

        // Filter by specific header
        if ($request->has('remove_header_id') && $request->remove_header_id != "") {
            $query->where('remove_header_id', $request->remove_header_id);
        }

        // Filter by detail-level status (APPROVAL / DISETUJUI / DITOLAK / DIBATALKAN / RETURN)
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        // Filter by inventory code
        if ($request->has('inventory_code') && $request->inventory_code != "") {
            $query->where('inventory_code', 'like', '%' . $request->inventory_code . '%');
        }

        // Filter by product
        if ($request->has('product_id') && $request->product_id != "") {
            $query->where('product_id', $request->product_id);
        }

        // Filter through header relationship
        $hasHeaderFilter =
            ($request->has('branch_id')     && $request->branch_id     != "") ||
            ($request->has('jenis')          && $request->jenis          != "") ||
            ($request->has('header_status')  && $request->header_status  != "") ||
            ($request->has('code')           && $request->code           != "");

        if ($hasHeaderFilter) {
            $query->whereHas('header', function ($q) use ($request) {
                if ($request->has('branch_id') && $request->branch_id != "") {
                    $q->where('branch_id', $request->branch_id);
                }
                if ($request->has('jenis') && $request->jenis != "") {
                    $q->where('jenis', $request->jenis);
                }
                if ($request->has('header_status') && $request->header_status != "") {
                    $q->where('status', $request->header_status);
                }
                if ($request->has('code') && $request->code != "") {
                    $q->where('code', 'like', '%' . $request->code . '%');
                }
            });
        }

        $perPage = $request->input('per_page', 10);
        $details = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($details);
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
                'note_approval' => isset($validated['note']) ? $validated['note'] : null,
                'updated_at' => $dateNow
            ]);

            $products = RemoveItemDetail::where('remove_header_id', $validated['remove_id'])->pluck('inventory_code')->toArray();
            if ($status == RemoveItemStatus::DISETUJUI) {

                $removeItemData = RemoveItem::find($validated['remove_id']);
                $jenis = RemoveItemJenis::from($removeItemData->jenis);
                Inventory::whereIn('inventory_code', $products)->update(array('status' => $jenis == RemoveItemJenis::HILANG ? InventoryStatus::LOST : InventoryStatus::REPAIR, 'updated_at' => $dateNow));
            } elseif ($status == RemoveItemStatus::RETURN || $status == RemoveItemStatus::DIBATALKAN) {
                Inventory::whereIn('inventory_code', $products)->update(array('status' => InventoryStatus::AVAILABLE, 'updated_at' => $dateNow));
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status removal", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function changeApprovalDetail(UpdateStatusRemoveItemDetailRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            $dateNow = date('Y-m-d H:i:s');
            $status = RemoveItemStatus::from($validated['status']);
            $detailIds = $validated['remove_detail_id'];

            // Bulk update status on all selected details
            RemoveItemDetail::whereIn('id', $detailIds)->update([
                'status'     => $status,
                'updated_at' => $dateNow,
            ]);

            // Collect inventory codes of affected details
            $details = RemoveItemDetail::whereIn('id', $detailIds)->get();
            $inventoryCodes = $details->pluck('inventory_code')->toArray();

            if ($status == RemoveItemStatus::DISETUJUI) {
                // All details share the same header, grab it from the first one
                $removeItemData = RemoveItem::find($details->first()->remove_header_id);
                $jenis = RemoveItemJenis::from($removeItemData->jenis);
                $inventoryStatus = $jenis == RemoveItemJenis::HILANG ? InventoryStatus::LOST : InventoryStatus::REPAIR;

                Inventory::whereIn('inventory_code', $inventoryCodes)->update([
                    'status'     => $inventoryStatus,
                    'updated_at' => $dateNow,
                ]);
            } elseif (
                $status == RemoveItemStatus::DITOLAK ||
                $status == RemoveItemStatus::DIBATALKAN ||
                $status == RemoveItemStatus::RETURN
            ) {
                Inventory::whereIn('inventory_code', $inventoryCodes)->update([
                    'status'     => InventoryStatus::AVAILABLE,
                    'updated_at' => $dateNow,
                ]);
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status item removal", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
