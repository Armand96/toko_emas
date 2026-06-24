<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryReportController extends Controller
{
    public function inventorySummary(Request $request)
    {
        $query = Inventory::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $summary = (clone $query)
            ->selectRaw("
            COUNT(
                CASE
                    WHEN status = 'AVAILABLE'
                    THEN 1
                END
            ) as total_item_active,

            COALESCE(SUM(
                CASE
                    WHEN status = 'AVAILABLE'
                    THEN berat
                    ELSE 0
                END
            ), 0) as total_berat_active,

            COALESCE(SUM(
                CASE
                    WHEN status = 'AVAILABLE'
                    THEN modal
                    ELSE 0
                END
            ), 0) as total_modal,

            COALESCE(SUM(
                CASE
                    WHEN status = 'AVAILABLE'
                    THEN jual
                    ELSE 0
                END
            ), 0) as total_jual,

            COUNT(
                CASE
                    WHEN status = 'REPAIR'
                    THEN 1
                END
            ) as item_repair,

            COUNT(
                CASE
                    WHEN status = 'TRANSIT'
                    THEN 1
                END
            ) as item_transit,

            COUNT(
                CASE
                    WHEN status = 'LOST'
                    THEN 1
                END
            ) as item_lost,

            COUNT(
                CASE
                    WHEN status = 'SOLD'
                    THEN 1
                END
            ) as item_sold
        ")->first();

        return ApiResponse::success(
            $summary,
            'OK',
            200
        );
    }

    public function inventoryDistribution(Request $request)
    {
        $query = Inventory::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $category = (clone $query)
            ->join(
                'm_categories',
                'm_categories.id',
                '=',
                'inventories.category_id'
            )
            ->selectRaw("
                m_categories.category_name,
                COUNT(*) as total_item
            ")
            ->where('inventories.status', 'AVAILABLE')
            ->groupBy(
                'm_categories.id',
                'm_categories.category_name'
            )
            ->orderByDesc('total_item')
            ->get();

        $subcategory = (clone $query)
            ->join(
                'm_categories as sub_categories',
                'sub_categories.id',
                '=',
                'inventories.subcategory_id'
            )
            ->selectRaw("
                sub_categories.category_name as subcategory_name,
                COUNT(*) as total_item
            ")
            ->where('inventories.status', 'AVAILABLE')
            ->groupBy(
                'sub_categories.id',
                'sub_categories.category_name'
            )
            ->orderByDesc('total_item')
            ->get();

        $karat = $query
            ->selectRaw("
                karat,
                COUNT(*) as total_item
            ")
            ->where('status', 'AVAILABLE')
            ->groupBy('karat')
            ->orderByDesc('karat')
            ->get();

        return ApiResponse::success([
            'category' => $category,
            'subcategory' => $subcategory,
            'karat' => $karat,
        ], 'OK', 200);
    }

    public function inventoryStatusAndAging(Request $request)
    {
        $query = Inventory::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $status = (clone $query)
            ->selectRaw("
                status,
                COUNT(*) as total
            ")
            ->groupBy('status')
            ->get();

        $aging = $query
            ->selectRaw("
                CASE
                    WHEN DATEDIFF(NOW(), created_at) <= 30
                        THEN '0-30 Hari'

                    WHEN DATEDIFF(NOW(), created_at) <= 90
                        THEN '31-90 Hari'

                    WHEN DATEDIFF(NOW(), created_at) <= 180
                        THEN '91-180 Hari'

                    ELSE '>180 Hari'
                END as aging_group,

                COUNT(*) as total
            ")
            ->where('status', 'AVAILABLE')
            ->groupBy('aging_group')
            ->get();

        return ApiResponse::success([
            'status' => $status,
            'aging' => $aging,
        ], 'OK', 200);
    }

    public function inventoryDetail(Request $request)
    {
        $query = Inventory::query();

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->karat) {
            $query->where('karat', $request->karat);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {

                $q->where(
                    'inventory_code',
                    'like',
                    '%' . $request->search . '%'
                )

                    ->orWhereHas('product', function ($product) use ($request) {

                        $product->where(
                            'product_name',
                            'like',
                            '%' . $request->search . '%'
                        );
                    });
            });
        }

        $data = $query
            ->with([
                'product:id,product_name,image_path',
                'category:id,category_name',
                'subCategory:id,category_name',
                'branch:id,branch_name'
            ])
            ->selectRaw("
            *,

            DATEDIFF(
                NOW(),
                created_at
            ) as aging_days
        ")
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
