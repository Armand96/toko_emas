<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\PembelianStatus;
use App\Helpers\RemoveItemStatus;
use App\Helpers\SalesStatus;
use App\Helpers\TransferItemStatus;
use App\Models\Finance;
use App\Models\Inventory;
use App\Models\Pembelian;
use App\Models\RemoveItem;
use App\Models\TransferItem;
use App\Models\TSales;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function takeAction()
    {
        $penjualan = TSales::where('approval_status', SalesStatus::APPROVAL)->count();
        $pembelian = Pembelian::where('status', PembelianStatus::APPROVAL)->count();
        $removeItem = RemoveItem::where('status', RemoveItemStatus::APPROVAL)->count();
        $transferItem = TransferItem::where('status', TransferItemStatus::APPROVAL)->count();

        return ApiResponse::success([
            'count_penjualan' => $penjualan,
            'count_pembelian' => $pembelian,
            'count_remove_item' => $removeItem,
            'count_transfer_item' => $transferItem,
        ]);
    }

    public function dataToday()
    {
        $today = Carbon::today();

        /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */

        $availableInventoryCount = Inventory::where(
            'status',
            InventoryStatus::AVAILABLE
        )->count();

        /*
    |--------------------------------------------------------------------------
    | Sales Summary
    |--------------------------------------------------------------------------
    */

        $sales = TSales::whereIn('approval_status', [
            SalesStatus::DISETUJUI,
            SalesStatus::CETAK_KWITANSI,
            SalesStatus::SELESAI
        ])
            ->where('updated_at', '>=', $today)
            ->selectRaw("
            COUNT(*) as total_item_sold,
            COALESCE(SUM(grand_total), 0) as total_sales
        ")
            ->first();

        /*
    |--------------------------------------------------------------------------
    | Pembelian Summary
    |--------------------------------------------------------------------------
    */

        $pembelian = Pembelian::where(
            'status',
            PembelianStatus::DISETUJUI
        )
            ->where('updated_at', '>=', $today)
            ->selectRaw("
            COUNT(*) as total_item_bought,
            COALESCE(SUM(modal), 0) as total_pembelian
        ")
            ->first();

        /*
    |--------------------------------------------------------------------------
    | Finance Summary
    |--------------------------------------------------------------------------
    */

        $finance = Finance::selectRaw("
            COALESCE(SUM(
                CASE
                    WHEN payment_method = 'CASH'
                        AND type = 'CASH IN'
                        THEN nominal

                    WHEN payment_method = 'CASH'
                        AND type = 'CASH OUT'
                        THEN -nominal

                    ELSE 0
                END
            ), 0) as cash_balance,

            COALESCE(SUM(
                CASE
                    WHEN payment_method = 'TRANSFER'
                        AND type = 'CASH IN'
                        THEN nominal

                    WHEN payment_method = 'TRANSFER'
                        AND type = 'CASH OUT'
                        THEN -nominal

                    ELSE 0
                END
            ), 0) as bank_balance
        ")
            ->first();

        return ApiResponse::success([
            'available_inventory' => $availableInventoryCount,

            'item_sold_today' => $sales->total_item_sold,
            'sales_today' => $sales->total_sales,

            'item_bought_today' => $pembelian->total_item_bought,
            'pembelian_today' => $pembelian->total_pembelian,

            'cash_balance' => $finance->cash_balance,
            'bank_balance' => $finance->bank_balance,

            'total_balance' =>
            $finance->cash_balance +
                $finance->bank_balance,

        ], 'OK', 200);
    }

    public function salesTrend(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | Filter
        |--------------------------------------------------------------------------
        */

        $days = $request->days ?? 7;

        $startDate = Carbon::today()->subDays($days - 1);

        /*
        |--------------------------------------------------------------------------
        | Query
        |--------------------------------------------------------------------------
        */

        $sales = TSales::selectRaw("
            DATE(created_at) as trx_date,
            SUM(grand_total) as total_sales
        ")
            ->whereIn('approval_status', [
                SalesStatus::DISETUJUI,
                SalesStatus::CETAK_KWITANSI,
                SalesStatus::SELESAI
            ])
            ->whereDate('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('trx_date')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Fill Missing Dates
        |--------------------------------------------------------------------------
        */

        $chartData = [];

        for ($i = 0; $i < $days; $i++) {

            $date = Carbon::today()->subDays(
                ($days - 1) - $i
            );

            $found = $sales->firstWhere(
                'trx_date',
                $date->format('Y-m-d')
            );

            $chartData[] = [
                'date' => $date->format('d M'),
                'full_date' => $date->format('Y-m-d'),
                'total_sales' => $found
                    ? (float) $found->total_sales
                    : 0
            ];
        }

        return ApiResponse::success(
            $chartData,
            "OK",
            200
        );
    }

    public function latestSales()
    {
        return ApiResponse::success(TSales::orderBy('id', 'desc')->with(['branch', 'customer'])->get(), "OK", 200);
    }

    public function salesStatus()
    {
        return ApiResponse::success(TSales::selectRaw('approval_status, COUNT(approval_status) as count')->where('created_at', '>=', date('Y-m-d') . " 00:00:00")->groupBy('approval_status')->get(), "OK", 200);
    }
}
