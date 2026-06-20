<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\MCustomer;
use App\Models\TSales;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function customerCount()
    {
        $totalCustomer = MCustomer::count(['id']);
        $customerActive = MCustomer::whereHas('sales', function ($salesQuery) {
            $salesQuery->where(
                'created_at',
                '>=',
                date('Y-m-d', strtotime('-6 months'))
            );
        })->count();
        $newCustomer = MCustomer::where('created_at', '>=', date('Y-m-d', strtotime('-1 month')))->count();

        return ApiResponse::success(array('total_customer' => $totalCustomer, 'customer_active' => $customerActive, 'new_customer' => $newCustomer), "OK", 200);
    }

    public function topCustomer()
    {
        $customers = MCustomer::select(
            [
                'id',
                'customer_name',
                'phone_number'
            ]
        )
            ->withCount('sales')
            ->withSum('sales', 'grand_total')
            ->withMax('sales', 'created_at')
            ->orderByDesc('sales_sum_grand_total')
            ->limit(10)
            ->get();

        return ApiResponse::success($customers, "OK", 200);
    }

    public function topCustomerPagination(Request $request)
    {
        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $customers = MCustomer::select(
            [
                'id',
                'customer_name',
                'phone_number'
            ]
        )
            ->withCount('sales')
            ->withSum('sales', 'grand_total')
            ->withMax('sales', 'created_at')
            ->orderByDesc('sales_sum_grand_total')
            ->paginate($perPage);

        return response()->json($customers);
    }
}
