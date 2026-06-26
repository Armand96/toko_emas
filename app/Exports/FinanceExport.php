<?php

namespace App\Exports;

use App\Models\Finance;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Finance::with(['branch', 'category', 'bankCabang.bank']);

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->payment_method) {
            $query->where('payment_method', $this->request->payment_method);
        }
        if ($this->request->bank_cabang_id) {
            $query->where('bank_cabang_id', $this->request->bank_cabang_id);
        }
        if ($this->request->type) {
            $query->where('finances.type', $this->request->type);
        }
        if ($this->request->start_date && $this->request->end_date) {
            $query->whereBetween('created_at', [
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
            'Tipe',
            'Cabang',
            'Kategori',
            'Nominal',
            'Metode Pembayaran',
            'Bank',
            'No. Rekening',
            'Keterangan',
        ];
    }

    public function map($finance): array
    {
        return [
            $finance->created_at?->format('Y-m-d H:i'),
            $finance->type,
            optional($finance->branch)->branch_name,
            optional($finance->category)->category_name,
            $finance->nominal,
            $finance->payment_method,
            optional(optional($finance->bankCabang)->bank)->bank_name,
            optional($finance->bankCabang)->nomor_rekening,
            $finance->keterangan ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
