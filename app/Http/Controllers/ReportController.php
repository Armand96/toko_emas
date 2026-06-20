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

    }
}
