<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\FinancePaymentMethod;
use App\Helpers\FinanceType;
use App\Helpers\InventoryStatus;
use App\Helpers\PembelianStatus;
use App\Http\Requests\PembelianImageRequest;
use App\Http\Requests\PembelianRequest;
use App\Http\Requests\UpdateStatusPembelianRequest;
use App\Models\Finance;
use App\Models\Inventory;
use App\Models\MCategoryFinance;
// use App\Models\MProduct;
use App\Models\Pembelian;
use App\Models\PembelianBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class PembelianController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pembelian::query();

        if ($request->has('search') && $request->search != "") {
            $query->whereHas('product.product_name', function($qry) use($request) {
                $qry->where('product_name', 'like', '%'.$request->search.'%');
            });
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
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $pembelians = $query->with(['product', 'category', 'subcategory', 'supplier', 'branch', 'bankCabang.bank', 'inventory', 'user'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($pembelians);
    }

    public function single(Pembelian $pembelian)
    {
        return ApiResponse::success($pembelian->load([
            'product',
            'category',
            'subcategory',
            'supplier',
            'branch',
            'bankCabang.bank',
            'user'
        ]), "OK", 200);
    }

    public function pembelian(PembelianRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();

        try {

            $currentBatch = PembelianBatch::max('batch_sequence');
            $batch = PembelianBatch::create(['batch_sequence' => $currentBatch+1]);
            $dateNow = date('Y-m-d H:i:s');
            $result = [];

            foreach ($validated['data'] as $index => $value) {
                $validated['data'][$index]['status'] = PembelianStatus::APPROVAL;
                $validated['data'][$index]['batch'] = $batch->id;
                $validated['data'][$index]['created_at'] = $dateNow;
                $validated['data'][$index]['created_by'] = $request->user()->id;

                $tempInsert = Pembelian::create($validated['data'][$index]);
                array_push($result, $tempInsert);
            }

            // $result = Pembelian::insert($validated['data']);
            DB::commit();

            return ApiResponse::success($result, "Sukses buat pembelian", 201);
        } catch (\Throwable $th) {
            Log::error($th);
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
                'status' => $validated['status'],
                'note' => isset($validated['note']) ? $validated['note'] : null
            ]);

            $status = PembelianStatus::from($validated['status']);
            if ($status == PembelianStatus::DISETUJUI) {
                $dataPembelian = Pembelian::whereIn('id', $validated['pembelian_ids'])->get();
                // $batchInsert = [];
                $dateNow = date('Y-m-d');

                foreach ($dataPembelian as $idx => $value) {

                    $data = Inventory::where('product_id', $value->product_id)->count();

                    $value->inventory_code = $value->barcode . "-" . str_pad($data + 1, 4, "0", STR_PAD_LEFT);
                    $value->update();

                    Inventory::create(array(
                        'inventory_code' => $value->barcode . "-" . str_pad($data + 1, 4, "0", STR_PAD_LEFT),
                        'pembelian_id' => $value->id,
                        'product_id' => $value->product_id,
                        'category_id' => $value->category_id,
                        'subcategory_id' => $value->subcategory_id,
                        'branch_id' => $value->branch_id,
                        'barcode' => $value->barcode,
                        'berat' => $value->berat,
                        'karat' => $value->karat,
                        'modal' => $value->modal,
                        'jual' => $value->jual,
                        'image_path' => $value->image_path,
                        'thumb_path' => $value->thumb_path,
                        'serial_number' => $value->serial_number,
                        'created_at' => $dateNow,
                        'status' => InventoryStatus::AVAILABLE
                    ));
                }

                // if (count($batchInsert) > 0) Inventory::insert($batchInsert);
                // TO DO INSERT KE FINANCE
                $categoryFinance = MCategoryFinance::where('category_name', 'like', '%Pembelian%')->first();
                Finance::create(array(
                    'branch_id' => $value->branch_id,
                    'category_finance_id' => $categoryFinance->id,
                    'bank_cabang_id' => $value->bank_cabang_id,
                    'type' => FinanceType::CASHOUT,
                    'payment_method' => FinancePaymentMethod::TRANSFER,
                    'nominal' => $value->modal
                ));
            }

            DB::commit();

            return ApiResponse::success([], "Sukses update status pembelian", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function pembelianImage(PembelianImageRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();
        $imagePath = [];

        try {
            $ids = explode(",", $validated['pembelian_ids']);

            foreach ($ids as $index => $value) {
                $dataInsert = array(
                    'image_path' => "",
                    'thumb_path' => ""
                );
                // dd($validated['images'][$index]);
                // Upload new image
                $image = $request->file('images')[$index];

                $imageName = "pembelian_" . $value . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

                $image->storeAs(
                    'images',
                    $imageName,
                    'public'
                );


                $dataInsert['image_path'] = 'images/' . $imageName;

                $dataInsert['thumb_path'] = 'thumbs/' . $imageName;

                // Generate thumbnail
                $thumb = Image::decode($image)
                    ->scale(height: 200);

                Storage::disk('public')->put(
                    $dataInsert['thumb_path'],
                    $thumb->encodeUsingFileExtension(
                        $image->getClientOriginalExtension(),
                        quality: 70
                    )
                );
                array_push($imagePath, $dataInsert);

                Pembelian::where('id', $value)->update($dataInsert);
            }

            DB::commit();

            return ApiResponse::success([], 'Success Upload Image', 200);
        } catch (\Throwable $th) {
            foreach ($imagePath as $key => $value) {
                if ($value['image_path'] != null && Storage::disk('public')->exists($value['image_path'])) {
                    Storage::disk('public')->delete($value['image_path']);
                }
                if ($value['thumb_path'] != null && Storage::disk('public')->exists($value['thumb_path'])) {
                    Storage::disk('public')->delete($value['thumb_path']);
                }
            }

            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
