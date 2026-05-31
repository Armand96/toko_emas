<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Inventory;
use Illuminate\Http\Request;
use InventoryStatus;

class InventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Inventory::query();

        if ($request->has('search') && $request->search != "") {
            $query->where('product.barcode', 'like', '%' . $request->search . '%')
                ->orWhere('product.product_name', 'like', '%' . $request->search . '%')
                ->orWhere('berat',  $request->berat)
                ->orWhere('karat',  $request->karat);
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('category_id') && $request->category_id != "") {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $inventories = $query->paginate($perPage);

        return response()->json($inventories);
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
    public function store(Request $request)
    {
        $validated = $request->validated();

        try {
            $validated['status'] = InventoryStatus::;
            $inventory = Inventory::create($validated);

            return ApiResponse::success($inventory, "Success create branch", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Inventory $inventory)
    {
        return ApiResponse::success($inventory, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Inventory $inventory)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Inventory $inventory)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Inventory $inventory)
    {
        return ApiResponse::error('route not found', null, 404);
    }

}
