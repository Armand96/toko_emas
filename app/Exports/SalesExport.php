<?php

namespace App\Exports;

use App\Models\TSales;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = TSales::query()->with([
            'customer:id,customer_name',
            'branch:id,branch_name',
            'user:id,name',
            'details.product:id,product_name',
            'details.inventory:inventory_code,berat',
        ]);

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->payment_type) {
            $query->where('payment_type', $this->request->payment_type);
        }
        if ($this->request->start_date && $this->request->end_date) {
            $query->whereBetween('t_sales.created_at', [
                $this->request->start_date,
                $this->request->end_date,
            ]);
        }

        return $query->latest()->get();
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'Kode Transaksi',
            'Cabang',
            'Customer',
            'Kasir',
            'Payment Type',
            'Grand Total',
            'Produk (kode|nama|berat)',
        ];
    }

    public function map($sale): array
    {
        $products = $sale->details->map(function ($d) {
            $name   = optional($d->product)->product_name ?? '-';
            $berat  = optional($d->inventory)->berat ?? 0;
            return "{$d->inventory_code}|{$name}|{$berat}gr";
        })->implode('; ');

        return [
            $sale->created_at?->format('Y-m-d H:i'),
            $sale->code ?? $sale->id,
            optional($sale->branch)->branch_name,
            optional($sale->customer)->customer_name,
            optional($sale->user)->name,
            $sale->payment_type,
            $sale->grand_total,
            $products,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
