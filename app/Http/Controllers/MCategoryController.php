<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MCategoryRequest;
use App\Models\MCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class MCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MCategory::query();

        if ($request->has('category_name') && $request->category_name != "") {
            $query->where('category_name', 'like', '%' . $request->category_name . '%');
        }
        if ($request->has('description') && $request->description != "") {
            $query->where('description', 'like', '%' . $request->description . '%');
        }
        if ($request->has('parent_id') && $request->parent_id != "") {
            $query->where('parent_id', $request->parent_id);
        }
        if($request->has('has_subcategory') && $request->has_subcategory > 0) {
            $query->has('subcategories');
        }
        if($request->has('has_parent') && $request->has_parent > 0) {
            $query->has('parent');
        }
        // if ($request->has('is_active') && $request->is_active != "") {
        //     $query->where('is_active', $request->is_active);
        // }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $categories = $query->with(['subcategory', 'parent'])->paginate($perPage);

        return response()->json($categories);
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
    public function store(MCategoryRequest $request)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('image')) {

                // Upload new image
                $image = $request->file('image');

                $imageName = $validated['category_name'] . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

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

            $category = MCategory::create($validated);

            return ApiResponse::success($category, "Success create category", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MCategory $category)
    {
        return ApiResponse::success($category, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MCategory $category)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MCategoryRequest $request, MCategory $category)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('image')) {

                // Delete old files
                if ($category->image_path != null && Storage::disk('public')->exists($category->image_path)) {
                    Storage::disk('public')->delete($category->image_path);
                }
                if ($category->thumb_path != null && Storage::disk('public')->exists($category->thumb_path)) {
                    Storage::disk('public')->delete($category->thumb_path);
                }


                // Upload new image
                $image = $request->file('image');

                $imageName = $validated['category_name'] . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

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

            $category->update($validated);

            return ApiResponse::success($category, "Success update category", 201);
        } catch (\Throwable $th) {
            ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MCategory $category)
    {
        // try {
        //     $category->delete();

        //     if ($category->image_path != null && Storage::disk('public')->exists($category->image_path)) {
        //         Storage::disk('public')->delete($category->image_path);
        //     }

        //     if ($category->thumb_path != null && Storage::disk('public')->exists($category->thumb_path)) {
        //         Storage::disk('public')->delete($category->thumb_path);
        //     }

        //     return ApiResponse::success($category, "Category deleted", 200);
        // } catch (\Throwable $th) {
        //     return ApiResponse::error($th->getMessage(), $th, 500);
        // }
        return ApiResponse::error('route not found', null, 404);
    }
}
