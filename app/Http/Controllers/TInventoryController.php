<?php

namespace App\Http\Controllers;

use App\Models\TInventory;
use Illuminate\Http\Request;

class TInventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TInventory::query();

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
        $products = $query->paginate($perPage);

        return response()->json($products);
    }
}
