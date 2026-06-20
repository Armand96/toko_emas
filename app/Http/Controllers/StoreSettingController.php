<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\StoreSettingRequest;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;


class StoreSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StoreSetting::query();
        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $settings = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($settings);
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
    public function store(StoreSettingRequest $request)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('image')) {

                // Upload new image
                $image = $request->file('image');

                $imageName = 'toko_cover_image' . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

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


            $setting = StoreSetting::create($validated);

            return ApiResponse::success($setting, "Success create store setting", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(StoreSetting $storeSetting)
    {
        return ApiResponse::success($storeSetting, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(StoreSetting $storeSetting)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreSettingRequest $request, StoreSetting $storeSetting)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('image')) {

                // Delete old files
                if ($storeSetting->image_path != null && Storage::disk('public')->exists($storeSetting->image_path)) {
                    Storage::disk('public')->delete($storeSetting->image_path);
                }

                if ($storeSetting->thumb_path != null && Storage::disk('public')->exists($storeSetting->thumb_path)) {
                    Storage::disk('public')->delete($storeSetting->thumb_path);
                }

                // Upload new image
                $image = $request->file('image');

                $imageName = 'toko_cover_image' . "_" . date('Y-m-d') . "." . $image->getClientOriginalExtension();

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

            $storeSetting->update($validated);

            return ApiResponse::success($storeSetting, "Success update setting", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StoreSetting $storeSetting)
    {
        return ApiResponse::error('route not found', null, 404);
    }
}
