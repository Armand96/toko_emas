<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\TransferItemStatus;
use App\Http\Requests\TransferItemRequest;
use App\Http\Requests\UpdateStatusTransferItemRequest;
use App\Models\BranchProduct;
use App\Models\Inventory;
use App\Models\TransferItem;
use App\Models\TransferItemDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferItemController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TransferItem::query();

        if ($request->has('kode_transfer') && $request->kode_transfer != '') {
            $query->where('kode_transfer', 'like', '%'.$request->kode_transfer.'%');
        }
        if ($request->has('note') && $request->note != '') {
            $query->where('note', 'like', '%'.$request->note.'%');
        }
        if ($request->has('branch_source_id') && $request->branch_source_id != '') {
            $query->where('branch_source_id', $request->branch_source_id);
        }
        if ($request->has('branch_dest_id') && $request->branch_dest_id != '') {
            $query->where('branch_dest_id', $request->branch_dest_id);
        }
        if ($request->has('created_by') && $request->created_by != '') {
            $query->where('created_by', $request->created_by);
        }
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $sales = $query->orderBy('id', 'desc')->with(['user', 'details.inventory', 'branchSource', 'branchDest'])->paginate($perPage);

        return response()->json($sales);
    }

    public function single(TransferItem $transferItem)
    {
        return ApiResponse::success($transferItem->load(['branchSource', 'branchDest', 'details.inventory', 'user']));
    }

    public function createTrx(TransferItemRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $transferId = 'TRF-'.date('Ymd').'-';
            $latestTransfer = TransferItem::where('kode_transfer', 'like', $transferId.'%')->lockForUpdate()->orderByDesc('id')->value('kode_transfer');
            $counter = $latestTransfer ? (int) substr($latestTransfer, strrpos($latestTransfer, '-') + 1) + 1 : 1;
            $transferId = $transferId.str_pad($counter, 4, '0', STR_PAD_LEFT);

            $hdrTransfer = [
                'kode_transfer' => $transferId,
                'branch_source_id' => $validated['branch_source_id'],
                'branch_dest_id' => $validated['branch_dest_id'],
                'created_by' => $request->user()->id,
                'status' => TransferItemStatus::APPROVAL,
            ];

            $hdrData = TransferItem::create($hdrTransfer);

            $dateNow = date('Y-m-d H:i:s');
            $insertBatch = [];
            $whereInInventoryCode = [];

            foreach ($validated['item'] as $index => $value) {
                $itemData = [
                    'transfer_item_id' => $hdrData->id,
                    'product_id' => $value['product_id'],
                    'inventory_code' => $value['inventory_code'],
                    'created_at' => $dateNow,
                ];

                array_push($whereInInventoryCode, $value['inventory_code']);
                array_push($insertBatch, $itemData);
            }

            Inventory::whereIn('inventory_code', $whereInInventoryCode)->update([
                'status' => InventoryStatus::TRANSIT,
            ]);
            TransferItemDetail::insert($insertBatch);

            DB::commit();

            return ApiResponse::success([], 'Success create pengajuan transfer', 200);
        } catch (\Throwable $th) {
            DB::rollback();

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function changeApproval(UpdateStatusTransferItemRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            // $dateNow = date('Y-m-d H:i:s');
            $status = TransferItemStatus::from($validated['status']);
            $data = TransferItem::where('id', $validated['transfer_item_id'])->where('status', TransferItemStatus::APPROVAL)->first();
            $data->update([
                'status' => $status,
                'note_approval' => isset($validated['note']) ? $validated['note'] : null,
            ]);

            $dateNow = date('Y-m-d H:i:s');
            $products = TransferItemDetail::where('transfer_item_id', $validated['transfer_item_id'])->pluck('inventory_code')->toArray();

            if ($status == TransferItemStatus::DISETUJUI) {
                // $mproducts = BranchProduct::whereIn('product_id', $products)->select(['branch_id'])->toArray();
                Inventory::whereIn('inventory_code', $products)->update(['status' => InventoryStatus::AVAILABLE, 'updated_at' => $dateNow, 'branch_id' => $data->branch_dest_id]);

                // Sync BranchProduct for each unique product in the transfer
                $productIds = TransferItemDetail::where('transfer_item_id', $validated['transfer_item_id'])
                    ->pluck('product_id')
                    ->unique()
                    ->values();

                // Batch-insert BranchProduct for the destination branch (ignore duplicates)
                $branchProductBatch = $productIds->map(fn ($productId) => [
                    'product_id' => $productId,
                    'branch_id' => $data->branch_dest_id,
                ])->toArray();

                BranchProduct::upsert($branchProductBatch, ['product_id', 'branch_id']);
            } elseif ($status == TransferItemStatus::DIBATALKAN || $status == TransferItemStatus::DITOLAK) {
                Inventory::whereIn('inventory_code', $products)->update(['status' => InventoryStatus::AVAILABLE, 'updated_at' => $dateNow]);
            }

            DB::commit();

            return ApiResponse::success([], 'Sukses update status transfer item', 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
