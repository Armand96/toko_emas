<?php

namespace App\Http\Controllers;

use App\Exports\BuybackExport;
use App\Helpers\ApiResponse;
use App\Models\Buyback;
use App\Models\BuybackDetail;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class BuybackReportController extends Controller
{
    /**
     * Summary statistics: total transactions, total items, total berat, total nilai buyback.
     * Only counts SELESAI / CETAK KWITANSI transactions (dana sudah keluar, stok sudah masuk).
     */
    public function summary(Request $request)
    {
        $query = Buyback::query()
            ->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('buybacks.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $queryDetail = BuybackDetail::query()
            ->whereHas('header', function ($q) use ($request) {
                $q->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);
                if ($request->branch_id) {
                    $q->where('branch_id', $request->branch_id);
                }
                if ($request->start_date && $request->end_date) {
                    $q->whereBetween('buybacks.created_at', [
                        $request->start_date,
                        $request->end_date,
                    ]);
                }
            });

        return ApiResponse::success([
            'jumlah_transaksi'  => (clone $query)->count(),
            'total_item'        => (clone $queryDetail)->count(),
            'total_berat'       => (clone $queryDetail)->sum('berat'),
            'total_nilai'       => (clone $query)->sum('grand_total'),
        ], 'OK', 200);
    }

    /**
     * Buyback per kategori & sub-kategori (joined from m_products/m_categories via detail).
     */
    public function buybackKategoriReport(Request $request)
    {
        $queryDetail = BuybackDetail::query()
            ->whereHas('header', function ($q) use ($request) {
                $q->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);
                if ($request->branch_id) {
                    $q->where('branch_id', $request->branch_id);
                }
                if ($request->start_date && $request->end_date) {
                    $q->whereBetween('buybacks.created_at', [
                        $request->start_date,
                        $request->end_date,
                    ]);
                }
            });

        // Per-kategori: join product → category
        $category = (clone $queryDetail)
            ->join('m_products', 'm_products.id', '=', 'buyback_details.product_id')
            ->join('m_categories', 'm_categories.id', '=', 'm_products.category_id')
            ->selectRaw('
                m_categories.category_name,
                SUM(buyback_details.price) as total_nilai,
                SUM(buyback_details.berat) as total_berat,
                COUNT(*) as total_item
            ')
            ->groupBy('m_categories.id', 'm_categories.category_name')
            ->orderByDesc('total_nilai')
            ->get();

        // Per-sub-kategori: join product → subcategory
        $subcategory = (clone $queryDetail)
            ->join('m_products', 'm_products.id', '=', 'buyback_details.product_id')
            ->join('m_categories as sub_categories', 'sub_categories.id', '=', 'm_products.subcategory_id')
            ->selectRaw('
                sub_categories.category_name as subcategory_name,
                SUM(buyback_details.price) as total_nilai,
                SUM(buyback_details.berat) as total_berat,
                COUNT(*) as total_item
            ')
            ->groupBy('sub_categories.id', 'sub_categories.category_name')
            ->orderByDesc('total_nilai')
            ->get();

        return ApiResponse::success([
            'category'    => $category,
            'subcategory' => $subcategory,
        ], 'OK', 200);
    }

    /**
     * Buyback per karat — distribution of gold karat in bought-back items.
     */
    public function buybackKaratReport(Request $request)
    {
        $data = BuybackDetail::query()
            ->whereHas('header', function ($q) use ($request) {
                $q->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);
                if ($request->branch_id) {
                    $q->where('branch_id', $request->branch_id);
                }
                if ($request->start_date && $request->end_date) {
                    $q->whereBetween('buybacks.created_at', [
                        $request->start_date,
                        $request->end_date,
                    ]);
                }
            })
            ->selectRaw('
                karat,
                SUM(price) as total_nilai,
                SUM(berat) as total_berat,
                COUNT(*) as total_item
            ')
            ->groupBy('karat')
            ->orderByDesc('karat')
            ->get();

        return ApiResponse::success($data, 'OK', 200);
    }

    /**
     * Paginated detail table of buyback transactions (header level).
     * Matches the "Detail Buyback" table in the UI image.
     */
    public function buybackDetail(Request $request)
    {
        $query = Buyback::query()
            ->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->payment_type) {
            $query->where('payment_type', $request->payment_type);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('buybacks.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $data = $query
            ->with([
                'customer:id,customer_name',
                'branch:id,branch_name',
                'user:id,name',
                'details.product:id,product_name',
                'senderBank.bank:id,bank_name',
            ])
            ->latest()
            ->paginate($request->per_page ?? 10);

        return ApiResponse::success($data, 'OK', 200);
    }

    /**
     * Export buyback report to Excel (two sheets: Ringkasan + Detail).
     */
    public function exportBuyback(Request $request)
    {
        $filename = 'buyback-report-' . date('Ymd-His') . '.xlsx';

        return Excel::download(new BuybackExport($request), $filename);
    }
}
