<?php

namespace App\Http\Controllers;

use App\Models\TApproval;
use Illuminate\Http\Request;

class TApprovalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = TApproval::query();

        if ($request->has('search') && $request->search != "") {
            $query->where('product.barcode', 'like', '%' . $request->search . '%')
                ->orWhere('product.product_name', 'like', '%' . $request->search . '%')
                ->orWhere('order_id',  $request->berat);
        }
        if ($request->has('payment_type') && $request->payment_type != "") {
            $query->where('payment_type', $request->payment_type);
        }
        if ($request->has('approval_type') && $request->approval_type != "") {
            $query->where('approval_type', $request->approval_type);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $approvals = $query->paginate($perPage);

        return response()->json($approvals);
    }
}
