<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\TSales;
use App\Models\TSalesDetail;
use Illuminate\Http\Request;

class SalesReportController extends Controller
{
    public function salesSummary(Request $request)
    {
        $query = TSales::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('t_sales.created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $summary = (clone $query)
            ->join(
                't_sales_details',
                't_sales.id',
                '=',
                't_sales_details.sales_id'
            )
            ->join(
                'inventories',
                'inventories.inventory_code',
                '=',
                't_sales_details.inventory_code'
            )
            ->selectRaw("
            COALESCE(SUM(t_sales.grand_total), 0) as total_penjualan,

            COUNT(DISTINCT t_sales.id) as jumlah_transaksi,

            COALESCE(SUM(
                t_sales_details.price - inventories.modal
            ), 0) as laba,

            COALESCE(SUM(inventories.berat), 0) as emas_terjual
        ")
            ->first();

        return ApiResponse::success(
            $summary,
            'OK',
            200
        );
    }

    public function salesTrendAndTopProduct(Request $request)
    {
        $query = TSales::query();
        $queryDetail = TSalesDetail::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
            $queryDetail->whereHas('header', function ($dtlQry) use ($request) {
                $dtlQry->where('branch_id', $request->branch_id);
            });
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('t_sales.created_at', [
                $request->start_date,
                $request->end_date
            ]);
            $queryDetail->whereBetween('t_sales_details.created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $trend = $query->selectRaw("
            DATE(t_sales.created_at) as trx_date,
            SUM(grand_total) as total
        ")
            ->groupBy('trx_date')
            ->orderBy('trx_date')
            ->get();

        $topProduct = $queryDetail
            ->join(
                'm_products',
                'm_products.id',
                '=',
                't_sales_details.product_id'
            )
            ->join(
                'inventories',
                'inventories.inventory_code',
                '=',
                't_sales_details.inventory_code'
            )
            ->selectRaw("
                m_products.product_name,

                inventories.karat,

                AVG(inventories.berat) as berat,

                COUNT(*) as terjual
            ")
            ->groupBy(
                'm_products.id',
                'm_products.product_name',
                'inventories.karat'
            )
            ->orderByDesc('terjual')
            ->limit(5)
            ->get();

        return ApiResponse::success([
            'trend' => $trend,
            'top_product' => $topProduct,
        ], 'OK', 200);
    }

    public function salesCategoryAndKarat(Request $request)
    {
        // $query = TSales::query();
        $queryDetail = TSalesDetail::query();

        if ($request->branch_id) {
            // $query->where('branch_id', $request->branch_id);
            $queryDetail->whereHas('header', function ($dtlQry) use ($request) {
                $dtlQry->where('branch_id', $request->branch_id);
            });
        }

        if ($request->start_date && $request->end_date) {
            // $query->whereBetween('t_sales.created_at', [
            //     $request->start_date,
            //     $request->end_date
            // ]);
            $queryDetail->whereBetween('t_sales_details.created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $category = (clone $queryDetail)
            ->join(
                'inventories',
                'inventories.inventory_code',
                '=',
                't_sales_details.inventory_code'
            )
            ->join(
                'm_categories',
                'm_categories.id',
                '=',
                'inventories.category_id'
            )
            ->selectRaw("
                m_categories.category_name,
                SUM(t_sales_details.price) as total
            ")
            ->groupBy(
                'm_categories.id',
                'm_categories.category_name'
            )
            ->orderByDesc('total')
            ->get();

        $subcategory = (clone $queryDetail)
            ->join(
                'inventories',
                'inventories.inventory_code',
                '=',
                't_sales_details.inventory_code'
            )
            ->join(
                'm_categories as sub_categories',
                'sub_categories.id',
                '=',
                'inventories.subcategory_id'
            )
            ->selectRaw("
                sub_categories.category_name as subcategory_name,
                SUM(t_sales_details.price) as total
            ")
            ->groupBy(
                'sub_categories.id',
                'sub_categories.category_name'
            )
            ->orderByDesc('total')
            ->get();

        $karat = $queryDetail
            ->join(
                'inventories',
                'inventories.inventory_code',
                '=',
                't_sales_details.inventory_code'
            )
            ->selectRaw("
                inventories.karat,
                SUM(t_sales_details.price) as total
            ")
            ->groupBy('inventories.karat')
            ->orderByDesc('inventories.karat')
            ->get();

        return ApiResponse::success([
            'category' => $category,
            'subcategory' => $subcategory,
            'karat' => $karat,
        ], 'OK', 200);
    }

    public function salesDetail(Request $request)
    {
        $query = TSales::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->payment_type) {
            $query->where(
                'payment_type',
                $request->payment_type
            );
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('t_sales.created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $data = $query
            ->with([
                'customer:id,customer_name',
                'branch:id,branch_name',
                'user:id,name',

                'details.product:id,product_name',
                'details.inventory:inventory_code,berat'
            ])
            ->latest()
            ->paginate(
                $request->per_page ?? 10
            );

        return ApiResponse::success(
            $data,
            'OK',
            200
        );
    }
}
