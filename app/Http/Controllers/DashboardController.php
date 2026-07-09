<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\InventoryStatus;
use App\Helpers\PembelianStatus;
use App\Helpers\RemoveItemStatus;
use App\Helpers\SalesStatus;
use App\Helpers\TransferItemStatus;
use App\Helpers\BuybackStatus;
use App\Models\Buyback;
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
    public function takeAction(Request $request)
    {
        $penjualan = TSales::where('approval_status', SalesStatus::APPROVAL)
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->count();
        $pembelian = Pembelian::where('status', PembelianStatus::APPROVAL)
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->count();
        $removeItem = RemoveItem::where('status', RemoveItemStatus::APPROVAL)
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->count();
        $transferItem = TransferItem::where('status', TransferItemStatus::APPROVAL)
            ->when($request->branch_id, fn ($q) => $q->where('branch_source_id', $request->branch_id))
            ->count();
        $buyback = Buyback::where('status', BuybackStatus::APPROVAL)
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
            ->count();

        return ApiResponse::success([
            'count_penjualan' => $penjualan,
            'count_pembelian' => $pembelian,
            'count_remove_item' => $removeItem,
            'count_transfer_item' => $transferItem,
            'count_buyback' => $buyback,
        ]);
    }

    public function dataToday(Request $request)
    {
        $today = Carbon::today();
        $branchId = $request->branch_id;

        $availableInventoryCount = Inventory::where('status', InventoryStatus::AVAILABLE)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->count();

        $sales = TSales::where('approval_status', SalesStatus::SELESAI)
            ->where('updated_at', '>=', $today)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw('
            COUNT(*) as total_item_sold,
            COALESCE(SUM(grand_total), 0) as total_sales
        ')->first();

        $pembelian = Pembelian::where('status', PembelianStatus::DISETUJUI)
            ->where('updated_at', '>=', $today)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw('
            COUNT(*) as total_item_bought,
            COALESCE(SUM(modal), 0) as total_pembelian
        ')->first();

        $finance = Finance::when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->selectRaw("
            COALESCE(SUM(
                CASE
                    WHEN payment_method = 'TUNAI'
                        AND type = 'CASH IN'
                        THEN nominal

                    WHEN payment_method = 'TUNAI'
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

            'total_balance' => $finance->cash_balance +
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

        $sales = TSales::selectRaw('
            DATE(created_at) as trx_date,
            SUM(grand_total) as total_sales
        ')
            ->where('approval_status', SalesStatus::SELESAI)
            ->whereDate('created_at', '>=', $startDate)
            ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
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
                    : 0,
            ];
        }

        return ApiResponse::success(
            $chartData,
            'OK',
            200
        );
    }

    public function latestSales(Request $request)
    {
        return ApiResponse::success(
            TSales::orderBy('id', 'desc')
                ->with(['branch', 'customer'])
                ->whereIn('approval_status', [
                    SalesStatus::CETAK_KWITANSI,
                    SalesStatus::SELESAI,
                ])
                ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
                ->get(),
            'OK', 200
        );
    }

    public function salesStatus(Request $request)
    {
        return ApiResponse::success(
            TSales::selectRaw('approval_status, COUNT(approval_status) as count')
                ->where('created_at', '>=', date('Y-m-d').' 00:00:00')
                ->when($request->branch_id, fn ($q) => $q->where('branch_id', $request->branch_id))
                ->groupBy('approval_status')
                ->toSql(),
            'OK', 200
        );
    }
}
