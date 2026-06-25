<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MProductRequest;
use App\Models\BranchProduct;
use App\Models\MCategory;
use App\Models\MProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class MProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MProduct::query();

        if ($request->has('product_name') && $request->product_name != "") {
            $query->where('product_name', 'like', '%' . $request->product_name . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->whereHas('branches', function($qry) use($request) {
                $qry->where('branch_id', $request->branch_id);
            });
        }
        if ($request->has('category_id') && $request->category_id != "") {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('description') && $request->description != "") {
            $query->where('description', 'like', '%' . $request->description . '%');
        }
        if ($request->has('barcode') && $request->barcode != "") {
            $query->where('barcode', 'like', '%' . $request->barcode . '%');
        }
        if ($request->has('is_active') && $request->is_active != "") {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $products = $query->with(['category.parent', 'branches.branch', 'subcategory'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(MProductRequest $request)
    {
        DB::beginTransaction();
        $validated = $request->validated();
        try {
            if ($request->hasFile('image')) {
                // Upload new image
                $image = $request->file('image');
                $imageName = $validated['product_name'] . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();
                $image->storeAs('images', $imageName, 'public');
                $validated['image_path'] = 'images/' . $imageName;
                $validated['thumb_path'] = 'thumbs/' . $imageName;
                // Generate thumbnail
                $thumb = Image::decode($image)->scale(height: 200);
                Storage::disk('public')->put($validated['thumb_path'], $thumb->encodeUsingFileExtension($image->getClientOriginalExtension(), quality: 70));
            }
            $countData = MProduct::where('category_id', $validated['category_id'])->lockForUpdate()->count();
            $category = MCategory::find($validated['category_id']);
            $validated['barcode'] = $category->category_code . "-" . str_pad($countData + 1, 5, "0", STR_PAD_LEFT);
            $branchIds = $validated['branch_id'];
            $validated['branch_id'] = 0;
            $product = MProduct::create($validated);

            $batchInsert = [];
            foreach ($branchIds as $key => $value) {
                array_push($batchInsert, array(
                    'product_id' => $product->id,
                    'branch_id' => $value,
                    'created_at' => $product->created_at
                ));
            }
            BranchProduct::insert($batchInsert);

            DB::commit();
            return ApiResponse::success($product, "Success create product", 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MProduct $product)
    {
        return ApiResponse::success($product->load(['subcategory', 'category.parent', 'branches.branch']), "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MProduct $product)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MProductRequest $request, MProduct $product)
    {
        DB::beginTransaction();
        $validated = $request->validated();

        try {

            if ($request->hasFile('image')) {

                // Delete old files
                if ($product->image_path != null && Storage::disk('public')->exists($product->image_path)) {
                    Storage::disk('public')->delete($product->image_path);
                }

                if ($product->thumb_path != null && Storage::disk('public')->exists($product->thumb_path)) {
                    Storage::disk('public')->delete($product->thumb_path);
                }

                // Upload new image
                $image = $request->file('image');

                $imageName = $validated['product_name'] . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

                $image->storeAs(
                    'images',
                    $imageName,
                    'public'
                );

                $validated['image_path'] = 'images/' . $imageName;

                $validated['thumb_path'] = 'thumbs/' . $imageName;

                // Generate thumbnail
                $thumb = Image::decode($image)
                    ->scale(height: 200);

                Storage::disk('public')->put(
                    $validated['thumb_path'],
                    $thumb->encodeUsingFileExtension(
                        $image->getClientOriginalExtension(),
                        quality: 70
                    )
                );
            }

            $branchIds = $validated['branch_id'];
            $validated['branch_id'] = 0;
            $product->update($validated);

            $batchInsert = [];
            foreach ($branchIds as $key => $value) {
                array_push($batchInsert, array(
                    'product_id' => $product->id,
                    'branch_id' => $value,
                    'created_at' => $product->created_at,
                    'updated_at' => $product->updated_at
                ));
            }
            BranchProduct::where('product_id', $product->id)->delete();
            BranchProduct::insert($batchInsert);

            DB::commit();

            return ApiResponse::success($product, "Success update product", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MProduct $product)
    {
        return ApiResponse::error('route not found', null, 404);
        // try {
        //     $product->delete();
        //     if ($product->image_path != null && Storage::disk('public')->exists($product->image_path)) {
        //         Storage::disk('public')->delete($product->image_path);
        //     }

        //     if ($product->thumb_path != null && Storage::disk('public')->exists($product->thumb_path)) {
        //         Storage::disk('public')->delete($product->thumb_path);
        //     }
        //     return ApiResponse::success($product, "Product deleted", 200);
        // } catch (\Throwable $th) {
        //     return ApiResponse::error($th->getMessage(), $th, 500);
        // }
    }
}
