<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Finance;
use Illuminate\Http\Request;

class FinanceReportController extends Controller
{
    public function totalCount()
    {
        $data = Finance::selectRaw("
            COALESCE(SUM(
                CASE
                    WHEN type = 'CASH IN' THEN nominal
                    WHEN type = 'CASH OUT' THEN -nominal
                    ELSE 0
                END
            ), 0) as total_all,
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
            ), 0) as total_cash,
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
            ), 0) as total_transfer
        ")->first();

        return ApiResponse::success($data, "OK", 200);
    }

    public function totalGroupedCabang()
    {
        $data = Finance::selectRaw("
            branch_id,
            bank_cabang_id,

            SUM(
                CASE
                    WHEN finances.type = 'CASH IN'
                        THEN nominal
                    WHEN finances.type = 'CASH OUT'
                        THEN -nominal
                    ELSE 0
                END
            ) as balance
        ")
        ->groupBy('branch_id', 'bank_cabang_id')
        ->with([
            'branch:id,branch_name,branch_code',
            'bankCabang:id,bank_id,nomor_rekening',
            'bankCabang.bank:id,bank_name,bank_code'
        ])
        ->get();

        return ApiResponse::success($data, "OK", 200);
    }

    public function financeSummary(Request $request)
    {
        try {
            $query = Finance::query();

            if ($request->branch_id) {
                $query->where('branch_id', $request->branch_id);
            }

            if ($request->payment_method) {
                $query->where(
                    'payment_method',
                    $request->payment_method
                );
            }

            if ($request->start_date && $request->end_date) {
                $query->whereBetween('finances.created_at', [
                    $request->start_date,
                    $request->end_date
                ]);
            }

            $summary = (clone $query)->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN finances.type = 'CASH IN'
                            THEN nominal
                        ELSE 0
                    END
                ), 0) as total_cash_in,

                COALESCE(SUM(
                    CASE
                        WHEN finances.type = 'CASH OUT'
                            THEN nominal
                        ELSE 0
                    END
                ), 0) as total_cash_out
            ")->first();

            $openingBalance = 0;
            if ($request->start_date) {
                $obQuery = Finance::where('finances.created_at', '<', $request->start_date . " 00:00:00");
                if ($request->branch_id) {
                    $obQuery->where('branch_id', $request->branch_id);
                }
                if ($request->payment_method) {
                    $obQuery->where('payment_method', $request->payment_method);
                }
                $openingBalance = $obQuery->selectRaw("
                    COALESCE(SUM(
                        CASE
                            WHEN finances.type = 'CASH IN'
                                THEN nominal
                            WHEN finances.type = 'CASH OUT'
                                THEN -nominal
                            ELSE 0
                        END
                    ), 0) as balance
                ")->value('balance');
            }

            $closingBalance = $openingBalance + $summary->total_cash_in - $summary->total_cash_out;

            $cashInCategory = (clone $query)
            ->where('finances.type', 'CASH IN')
            ->join(
                'm_category_finances',
                'm_category_finances.id',
                '=',
                'finances.category_finance_id'
            )->selectRaw("
                m_category_finances.category_name,
                SUM(finances.nominal) as total
            ")->groupBy(
                'm_category_finances.id',
                'm_category_finances.category_name'
            )->get();

            $cashOutCategory = (clone $query)
            ->where('finances.type', 'CASH OUT')
            ->join(
                'm_category_finances',
                'm_category_finances.id',
                '=',
                'finances.category_finance_id'
            )->selectRaw("
                m_category_finances.category_name,
                SUM(finances.nominal) as total
            ")->groupBy(
                'm_category_finances.id',
                'm_category_finances.category_name'
            )->get();

            return ApiResponse::success([
                'summary' => [
                    'opening_balance' => $openingBalance,
                    'cash_in' => $summary->total_cash_in,
                    'cash_out' => $summary->total_cash_out,
                    'closing_balance' => $closingBalance,
                ],
                'cash_in_category' => $cashInCategory,
                'cash_out_category' => $cashOutCategory,
            ], 'OK', 200);
        } catch (\Throwable $th) {
            throw $th;
        }
    }

    public function financeDetail(Request $request)
    {
        $query = Finance::with([
            'branch',
            'category',
            'bankCabang.bank'
        ]);

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->payment_method) {
            $query->where(
                'payment_method',
                $request->payment_method
            );
        }

        if ($request->type) {
            $query->where('finances.type', $request->type);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $data = $query
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
