<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MCategoryFinanceRequest;
use App\Models\MCategoryFinance;
use Illuminate\Http\Request;

class MCategoryFinanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MCategoryFinance::query();

        if ($request->has('category_name') && $request->category_name != "") {
            $query->where('category_name', 'like', '%' . $request->category_name . '%');
        }
        if ($request->has('is_active') && $request->is_active != "") {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $categories = $query->orderBy('id', 'desc')->paginate($perPage);

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
    public function store(MCategoryFinanceRequest $request)
    {
        $validated = $request->validated();

        try {

            $category = MCategoryFinance::create($validated);

            return ApiResponse::success($category, "Success create category", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MCategoryFinance $categoryFinance)
    {
        return ApiResponse::success($categoryFinance, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MCategoryFinance $categoryFinance)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MCategoryFinanceRequest $request, MCategoryFinance $categoryFinance)
    {
        $validated = $request->validated();

        try {
            $categoryFinance->update($validated);

            return ApiResponse::success($categoryFinance, "Success update category", 201);
        } catch (\Throwable $th) {
            ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MCategoryFinance $mCategoryFinance)
    {
        return ApiResponse::error('route not found', null, 404);
    }
}
