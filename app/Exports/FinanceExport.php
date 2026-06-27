<?php

namespace App\Exports;

use App\Models\Finance;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FinanceExport implements FromCollection, WithMapping, WithStyles, WithEvents
{
    protected Request $request;
    protected int $headerRows = 5; // title, periode, cabang, blank, column headers

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

    public function map($finance): array
    {
        $bankInfo = null;
        if (optional($finance->bankCabang)->nomor_rekening) {
            $bankName = optional(optional($finance->bankCabang)->bank)->bank_name ?? '';
            $noRek    = $finance->bankCabang->nomor_rekening;
            $bankInfo = $bankName ? "{$bankName} - {$noRek}" : $noRek;
        }

        return [
            $finance->created_at?->format('d/m/Y H:i'),
            optional($finance->branch)->branch_name,
            $finance->type,
            optional($finance->category)->category_name,
            $finance->payment_method,
            $bankInfo,
            $finance->nominal,
            $finance->keterangan ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet      = $event->sheet->getDelegate();
                $collection = $this->collection();

                // Shift data rows down to make room for header rows
                if ($collection->count() > 0) {
                    $sheet->insertNewRowBefore(1, $this->headerRows);
                }

                // Row 1: Title
                $sheet->setCellValue('A1', 'REPORT TRANSAKSI FINANCE');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Row 2: Periode
                $startDate = $this->request->start_date ?? '';
                $endDate   = $this->request->end_date ?? '';

                if ($startDate !== '' && $endDate !== '') {
                    $periodeText = 'Periode : '
                        . \Carbon\Carbon::parse($startDate)->format('d/m/Y')
                        . '-'
                        . \Carbon\Carbon::parse($endDate)->format('d/m/Y');
                } else {
                    $periodeText = 'Periode : ';
                }

                $sheet->setCellValue('A2', $periodeText);

                // Row 3: Cabang
                $branchName = '';
                if ($collection->count() > 0 && $this->request->branch_id) {
                    $branchName = optional($collection->first()->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank (already blank)

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Tanggal',
                    'B5' => 'Cabang',
                    'C5' => 'Tipe',
                    'D5' => 'Kategori',
                    'E5' => 'Metode Bayar',
                    'F5' => 'Bank',
                    'G5' => 'Jumlah',
                    'H5' => 'Keterangan',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:H5')->getFont()->setBold(true);

                // Style column G (Jumlah) data rows: right-aligned + number format
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    $sheet->getStyle("G{$dataStart}:G{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("G{$dataStart}:G{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'H') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
