<?php

namespace App\Http\Controllers;

// use App\Helpers\ApiResponse;

use App\Helpers\ApiResponse;
use App\Models\Inventory;
use Illuminate\Http\Request;
// use InventoryStatus;

class InventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Inventory::query();

        if ($request->has('search') && $request->search != "") {
            $query->where(function ($q) use ($request) {
                $q->whereHas('product', function ($productQuery) use ($request) {
                    $productQuery
                        ->where('barcode', 'like', '%' . $request->search . '%')
                        ->orWhere('product_name', 'like', '%' . $request->search . '%');
                })
                ->orWhere('inventory_code', 'like', '%' . $request->search . '%')
                ->orWhere('berat', $request->search)
                ->orWhere('karat', $request->search);
            });
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('inventory_code') && $request->inventory_code != "") {
            $query->where('inventory_code', $request->inventory_code);
        }
        if ($request->has('category_id') && $request->category_id != "") {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('status') && $request->status != "") {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $inventories = $query->with(['branch', 'product', 'category', 'subCategory'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($inventories);
    }

    public function single(Inventory $inventory)
    {
        return ApiResponse::success($inventory->load(['product', 'branch', 'category', 'subCategory']), "OK", 200);
    }
}
