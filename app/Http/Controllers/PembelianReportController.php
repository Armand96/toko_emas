<?php

namespace App\Http\Controllers;

use App\Exports\PembelianExport;
use App\Helpers\ApiResponse;
use App\Helpers\PembelianStatus;
use App\Models\Pembelian;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class PembelianReportController extends Controller
{
    public function totalItem(Request $request)
    {
        $query = Pembelian::query();

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('pembelians.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        return ApiResponse::success([
            'total_item_dibeli' => (clone $query)->where('status', PembelianStatus::DISETUJUI)->count(),
            'total_berat' => (clone $query)->where('status', PembelianStatus::DISETUJUI)->sum('berat'),
            'total_nilai' => $query->where('status', PembelianStatus::DISETUJUI)->sum('modal'),
        ], 'OK', 200);
    }

    public function pembelianKategoriReport(Request $request)
    {
        $query = Pembelian::query()->where('status', PembelianStatus::DISETUJUI);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('pembelians.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $category = (clone $query)
            ->join(
                'm_categories',
                'm_categories.id',
                '=',
                'pembelians.category_id'
            )
            ->selectRaw('
            m_categories.category_name,
            SUM(pembelians.modal) as total_modal
        ')
            ->groupBy(
                'm_categories.id',
                'm_categories.category_name'
            )
            ->orderByDesc('total_modal')
            ->get();

        $subcategory = (clone $query)
            ->join(
                'm_categories as sub_categories',
                'sub_categories.id',
                '=',
                'pembelians.subcategory_id'
            )
            ->selectRaw('
            sub_categories.category_name as subcategory_name,
            SUM(pembelians.modal) as total_modal
        ')
            ->groupBy(
                'sub_categories.id',
                'sub_categories.category_name'
            )
            ->orderByDesc('total_modal')
            ->get();

        return ApiResponse::success([
            'category' => $category,
            'subcategory' => $subcategory,
        ], 'OK', 200);
    }

    public function pembelianKaratReport(Request $request)
    {
        $query = Pembelian::query()->where('status', PembelianStatus::DISETUJUI);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('pembelians.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $data = $query
            ->selectRaw('
            karat,
            SUM(modal) as total_modal
        ')
            ->groupBy('karat')
            ->orderByDesc('karat')
            ->get();

        return ApiResponse::success(
            $data,
            'OK',
            200
        );
    }

    public function pembelianDetail(Request $request)
    {
        $query = Pembelian::query()->where('status', PembelianStatus::DISETUJUI);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('pembelians.created_at', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $data = $query
            ->with([
                'branch:id,branch_name',
            ])
            ->selectRaw('
            batch,
            branch_id,
            DATE(pembelians.created_at) as tanggal,

            COUNT(*) as total_item,

            SUM(berat) as total_berat,

            SUM(modal) as total_modal
        ')
            ->groupBy(
                'batch',
                'branch_id',
                'tanggal'
            )
            ->orderByDesc('tanggal')
            ->paginate(
                $request->per_page ?? 10
            );

        return ApiResponse::success(
            $data,
            'OK',
            200
        );
    }

    public function exportPembelian(Request $request)
    {
        $filename = 'pembelian-report-'.date('Ymd-His').'.xlsx';

        return Excel::download(new PembelianExport($request), $filename);
    }
}
