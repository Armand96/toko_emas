<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\MCustomer;
use Illuminate\Http\Request;

class CustomerReportController extends Controller
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

    public function topCustomer(Request $request)
    {
        $query = MCustomer::query();

        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('created_at', '>=',  $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('created_at', '<=',  $request->end_date . " 23:59:59");
        }

        $customers = $query->select(
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
            ->limit(5)
            ->get();

        return ApiResponse::success($customers, "OK", 200);
    }

    public function topCustomerPagination(Request $request)
    {
        $query = MCustomer::query();

        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('created_at', '>=',  $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('created_at', '<=',  $request->end_date . " 23:59:59");
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $customers = $query->select(
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

    public function customerTransaction(Request $request)
    {
        return ApiResponse::success([
            'frequency_transaction' => $this->customerFrequencies($request),
            'purchase_segment' => $this->customerSegment($request),
        ], "OK", 200);
    }

    private function customerFrequencies(Request $request)
    {
        $query = MCustomer::query();

        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('t_sales.created_at', '>=',  $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('t_sales.created_at', '<=',  $request->end_date . " 23:59:59");
        }
        $customerFrequency = $query->selectRaw('m_customers.id, COUNT(t_sales.id) as total_transaction ')
            ->join('t_sales', 't_sales.customer_id', '=', 'm_customers.id')
            ->groupBy('m_customers.id')
            ->get();

        $result = [
            '1-2 kali' => 0,
            '3-5 kali' => 0,
            '6-10 kali' => 0,
            '>10 kali' => 0,
        ];

        foreach ($customerFrequency as $customer) {

            $total = $customer->total_transaction;

            if ($total >= 1 && $total <= 2) {
                $result['1-2 kali']++;
            } elseif ($total >= 3 && $total <= 5) {
                $result['3-5 kali']++;
            } elseif ($total >= 6 && $total <= 10) {
                $result['6-10 kali']++;
            } else {
                $result['>10 kali']++;
            }
        }

        return $result;
    }

    private function customerSegment(Request $request)
    {
        $query = MCustomer::query();

        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('t_sales.created_at', '>=',  $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('t_sales.created_at', '<=',  $request->end_date . " 23:59:59");
        }

        $customerSpending = $query->selectRaw('m_customers.id, COALESCE(SUM(t_sales.grand_total), 0) as total_spending')
            ->join('t_sales', 't_sales.customer_id', '=', 'm_customers.id')
            ->groupBy('m_customers.id')
            ->get();

        $result = [
            '<5 juta' => 0,
            '5-15 juta' => 0,
            '16-30 juta' => 0,
            '>30 juta' => 0,
        ];

        foreach ($customerSpending as $customer) {

            $total = $customer->total_spending;

            if ($total < 5000000) {
                $result['<5 juta']++;
            } elseif ($total >= 5000000 && $total <= 15000000) {
                $result['5-15 juta']++;
            } elseif ($total >= 16000000 && $total <= 30000000) {
                $result['16-30 juta']++;
            } else {
                $result['>30 juta']++;
            }
        }

        return $result;
    }
}
