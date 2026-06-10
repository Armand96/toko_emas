<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\PembelianStatus;
use App\Http\Requests\PembelianRequest;
use App\Http\Requests\UpdateStatusPembelianRequest;
use App\Models\Pembelian;
use App\Models\PembelianBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PembelianController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pembelian::query();

        if ($request->has('product_name') && $request->product_name != "") {
            $query->where('product.product_name', 'like', '%' . $request->product_name . '%');
        }
        if ($request->has('product_id') && $request->product_id != "") {
            $query->where('product_id', $request->product_id);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }
        if ($request->has('category_id') && $request->category_id != "") {
            $query->where('category_id', $request->category_id);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $pembelians = $query->with(['product', 'category', 'branch', 'bank'])->paginate($perPage);

        return response()->json($pembelians);
    }

    public function pembelian(PembelianRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            $batch = PembelianBatch::create();
            $dateNow = date('Y-m-d H:i:s');

            foreach ($validated['data'] as $index => $value) {
                $validated['data'][$index]['status'] = PembelianStatus::APPROVAL;
                $validated['data'][$index]['batch'] = $batch->id;
                $validated['data'][$index]['created_at'] = $dateNow;
            }

            Pembelian::insert($validated['data']);
            DB::commit();

            return ApiResponse::success([], "Sukses buat pembelian", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function changeApproval(UpdateStatusPembelianRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            // $dateNow = date('Y-m-d H:i:s');

            Pembelian::whereIn('id', $validated['pembelian_ids'])->where('status', PembelianStatus::APPROVAL)->update([
                'status' => $validated['status']
            ]);

            if ($validated['status'] == PembelianStatus::DISETUJUI) {
                // to do insert into inventory
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status pembelian", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
