<?php

namespace App\Http\Controllers;

// use App\Helpers\ApiResponse;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Http\Requests\InventoryImageRequest;
use App\Http\Requests\StoreInventoryRequest;
use App\Http\Requests\UpdateInventoryRequest;
use App\Models\Inventory;
use App\Models\InventoryEditHistory;
use App\Models\MProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

// use InventoryStatus;

class InventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Inventory::query();

        if ($request->has('search') && $request->search != '') {
            $query->where(function ($q) use ($request) {
                $q->whereHas('product', function ($productQuery) use ($request) {
                    $productQuery
                        ->where('barcode', 'like', '%'.$request->search.'%')
                        ->orWhere('product_name', 'like', '%'.$request->search.'%');
                })
                    ->orWhere('inventory_code', 'like', '%'.$request->search.'%')
                    ->orWhere('berat', $request->search)
                    ->orWhere('karat', $request->search);
            });
        }
        if ($request->has('branch_id') && $request->branch_id != '') {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('inventory_code') && $request->inventory_code != '') {
            $query->where('inventory_code', $request->inventory_code);
        }
        if ($request->has('category_id') && $request->category_id != '') {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $inventories = $query->with(['branch', 'product', 'category', 'subCategory'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($inventories);
    }

    /**
     * Tambah item inventory secara langsung (bukan lewat pembelian/buyback).
     * Dibatasi FE untuk role Owner, Super Admin, PIC — dicek ulang di sini sebagai defense-in-depth.
     */
    public function store(StoreInventoryRequest $request)
    {
        // if (!in_array($request->user()->role_id, [1, 2, 3])) {
        //     return ApiResponse::error('Anda tidak memiliki akses untuk menambah item inventory', null, 403);
        // }

        $validated = $request->validated();

        DB::beginTransaction();

        try {
            $product = MProduct::findOrFail($validated['product_id']);

            $latestInventory = Inventory::where('product_id', $validated['product_id'])
                ->lockForUpdate()
                ->orderByDesc('id')
                ->value('inventory_code');
            $lastSeq = $latestInventory ? (int) substr($latestInventory, strrpos($latestInventory, '-') + 1) : 0;
            $inventoryCode = $product->barcode.'-'.str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);

            $inventory = Inventory::create([
                'inventory_code' => $inventoryCode,
                'pembelian_id' => null,
                'buyback_id' => null,
                'product_id' => $validated['product_id'],
                'category_id' => $validated['category_id'],
                'subcategory_id' => $validated['subcategory_id'] ?? null,
                'branch_id' => $validated['branch_id'],
                'barcode' => $product->barcode,
                'berat' => $validated['berat'],
                'karat' => $validated['karat'],
                'modal' => $validated['modal'],
                'jual' => $validated['jual'] ?? 0,
                'note' => $validated['note'] ?? null,
                'serial_number' => $validated['serial_number'] ?? null,
                'status' => InventoryStatus::AVAILABLE,
            ]);

            DB::commit();

            return ApiResponse::success($inventory, 'Item inventory berhasil ditambahkan', 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    public function uploadImage(InventoryImageRequest $request)
    {
        $validated = $request->validated();

        DB::beginTransaction();
        $imagePath = [];

        try {
            $ids = explode(',', $validated['inventory_ids']);

            foreach ($ids as $index => $value) {
                $dataInsert = [
                    'image_path' => '',
                    'thumb_path' => '',
                ];

                $image = $request->file('images')[$index];

                $imageName = 'inventory_'.$value.'_'.date('Y-m-d').'.'.$image->getClientOriginalExtension();

                $image->storeAs(
                    'images',
                    $imageName,
                    'public'
                );

                $dataInsert['image_path'] = 'images/'.$imageName;
                $dataInsert['thumb_path'] = 'thumbs/'.$imageName;

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

                Inventory::where('id', $value)->update($dataInsert);
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

    public function single(Inventory $inventory)
    {
        return ApiResponse::success($inventory->load([
            'product',
            'branch',
            'category',
            'subCategory',
            'editHistories.updateByUser:id,name,role_id',
            'editHistories.updateByUser.role:id,role_name',
            'pembelian.user:id,name,role_id',
            'pembelian.user.role:id,role_name',
            'transferDetails.header.branchSource',
            'transferDetails.header.branchDest',
            'transferDetails.header.user:id,name,role_id',
            'transferDetails.header.user.role:id,role_name',
            'removeDetails.header.user:id,name,role_id',
            'removeDetails.header.user.role:id,role_name',
            'salesDetail.header.user:id,name,role_id',
            'salesDetail.header.user.role:id,role_name',
        ]), 'OK', 200);
    }

    public function update(UpdateInventoryRequest $request, Inventory $inventory)
    {
        DB::beginTransaction();

        $validated = $request->validated();
        try {

            $data = $inventory->toArray();
            unset($data['id']);
            $data['inventory_id'] = $inventory->id;
            $data['updated_by'] = $request->user()->id;
            // dd($data);
            $dataEdit = InventoryEditHistory::create($data);

            $inventory->update($validated);

            DB::commit();

            return ApiResponse::success($dataEdit, 'Update Success', 201);
        } catch (\Throwable $th) {
            DB::rollBack();

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
