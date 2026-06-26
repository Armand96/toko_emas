<?php

namespace App\Exports;

use App\Models\Pembelian;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PembelianExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Pembelian::query()->with(['branch:id,branch_name']);

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->supplier_id) {
            $query->where('supplier_id', $this->request->supplier_id);
        }
        if ($this->request->start_date && $this->request->end_date) {
            $query->whereBetween('pembelians.created_at', [
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
            'Batch',
            'Cabang',
            'Supplier ID',
            'Karat',
            'Berat (gr)',
            'Modal',
            'Status',
        ];
    }

    public function map($pembelian): array
    {
        return [
            $pembelian->created_at?->format('Y-m-d H:i'),
            $pembelian->batch,
            optional($pembelian->branch)->branch_name,
            $pembelian->supplier_id,
            $pembelian->karat,
            $pembelian->berat,
            $pembelian->modal,
            $pembelian->status,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
