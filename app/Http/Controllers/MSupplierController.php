<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MSupplierRequest;
use App\Models\MSupplier;
use Illuminate\Http\Request;

class MSupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MSupplier::query();

        if ($request->has('supplier_name') && $request->supplier_name != "") {
            $query->where('supplier_name', 'like', '%' . $request->supplier_name . '%');
        }
        if ($request->has('address') && $request->address != "") {
            $query->where('address', 'like', '%' . $request->address . '%');
        }
        if ($request->has('phone_number') && $request->phone_number != "") {
            $query->where('phone_number', 'like', '%' . $request->phone_number . '%');
        }
        if ($request->has('is_active') && $request->is_active != "") {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $suppliers = $query->paginate($perPage);

        return response()->json($suppliers);
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
    public function store(MSupplierRequest $request)
    {
        $validated = $request->validated();

        try {
            $branch = MSupplier::create($validated);

            return ApiResponse::success($branch, "Success create supplier", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MSupplier $supplier)
    {
        return ApiResponse::success($supplier, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MSupplier $supplier)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MSupplierRequest $request, MSupplier $supplier)
    {
        $validated = $request->validated();

        try {
            $supplier->update($validated);

            return ApiResponse::success($supplier, "Success update supplier", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MSupplier $supplier)
    {
        return ApiResponse::error('route not found', null, 404);
    }
}
