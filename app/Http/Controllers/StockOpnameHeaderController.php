<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\OpnameDetailStatus;
use App\Helpers\OpnameHeaderStatus;
use App\Http\Requests\StockOpnameRequest;
use App\Models\Inventory;
use App\Models\MBranch;
use App\Models\StockOpnameDetail;
use App\Models\StockOpnameHeader;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockOpnameHeaderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StockOpnameHeader::query();

        if ($request->has('kode_sesi') && $request->kode_sesi != "") {
            $query->where('kode_sesi', 'like', '%' . $request->kode_sesi . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('created_at', '>=', $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('created_at', '<=', $request->end_date . " 23:59:59");
        }

        if ($request->has('start_date_time') && $request->start_date_time != "") {
            $query->where('start_date_time', '>=', $request->start_date_time);
        }
        if ($request->has('end_date_time') && $request->end_date_time != "") {
            $query->where('end_date_time', '<=', $request->end_date_time);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $opnames = $query->orderBy('id', 'desc')->with(['branch'])->paginate($perPage);

        return response()->json($opnames);
    }

    public function single(StockOpnameHeader $header)
    {
        return ApiResponse::success($header->load(['details.inventory.category.parent', 'details.inventory.subCategory', 'details.product', 'branch']), "OK", 200);
    }

    public function createOpname(StockOpnameRequest $request)
    {
        DB::beginTransaction();
        $validated = $request->validated();

        try {

            $dataBranch = MBranch::find($validated['branch_id']);
            $kodeSesi = 'OPN-' . $dataBranch->branch_code . '-' . date('y') . date('m');
            $counter = StockOpnameHeader::where('kode_sesi', 'like', $kodeSesi . "%")->count();
            $counter++;
            $kodeSesi = $kodeSesi . "-" . str_pad($counter, 4, "0", STR_PAD_LEFT);

            $totalInventoryBranch = Inventory::where('branch_id', $dataBranch->id)->where('status', InventoryStatus::AVAILABLE)->count();

            $dataInsertBatch = [];
            $itemInStock = 0;
            $itemMissing = 0;
            $itemExtra = 0;
            $dateNow = date('Y-m-d H:i:s');

            foreach ($validated['item'] as $key => $value) {
                $dataTemp = array(
                    'stockopname_header_id' => 0,
                    'inventory_code' => $value['inventory_code'],
                    'product_id' => $value['product_id'],
                    'last_status' => $value['last_status'],
                    'opname_status' => $value['opname_status'],
                    'note' => isset($value['note']) ? $value['note'] : null,
                    'scanned_at' => isset($value['scanned_at']) ? $value['scanned_at'] : null,
                    'created_at' => $dateNow
                );

                $status = OpnameDetailStatus::from($value['opname_status']);
                if($status == OpnameDetailStatus::EXTRA) $itemExtra++;
                if($status == OpnameDetailStatus::INSTOCK) $itemInStock++;
                if($status == OpnameDetailStatus::MISSING) $itemMissing++;

                array_push($dataInsertBatch, $dataTemp);
            }

            $dataHeader = StockOpnameHeader::create(array(
                'kode_sesi'        => $kodeSesi,
                'branch_id'        => $validated['branch_id'],
                'total_item'       => $totalInventoryBranch,
                'in_stock'         => $itemInStock,
                'missing'          => $itemMissing,
                'extra'            => $itemExtra,
                'status'           => ($itemInStock == $totalInventoryBranch && $itemExtra == 0) ? OpnameHeaderStatus::SESUAI : OpnameHeaderStatus::SELISIH,
                'start_date_time'  => isset($validated['start_date_time']) ? $validated['start_date_time'] : null,
                'end_date_time'    => isset($validated['end_date_time']) ? $validated['end_date_time'] : null,
            ));

            foreach ($dataInsertBatch as $key => $value) {
                $dataInsertBatch[$key]['stockopname_header_id'] = $dataHeader->id;
            }

            StockOpnameDetail::insert($dataInsertBatch);

            DB::commit();
            return ApiResponse::success([], "Success create opname", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
