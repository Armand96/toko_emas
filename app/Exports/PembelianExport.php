<?php

namespace App\Exports;

use App\Models\Pembelian;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PembelianExport implements FromCollection, WithMapping, WithStyles, WithEvents
{
    protected Request $request;
    protected int $headerRows = 5; // title, periode, cabang, blank, column headers

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

        return $query
            ->selectRaw("
                batch,
                branch_id,
                DATE(pembelians.created_at) as tanggal,
                COUNT(*) as total_item,
                SUM(berat) as total_berat,
                SUM(modal) as total_modal
            ")
            ->groupBy('batch', 'branch_id', 'tanggal')
            ->orderByDesc('tanggal')
            ->get();
    }

    public function map($pembelian): array
    {
        return [
            \Carbon\Carbon::parse($pembelian->tanggal)->format('d/m/Y'),
            $pembelian->batch,
            optional($pembelian->branch)->branch_name,
            $pembelian->total_item,
            $pembelian->total_berat,
            $pembelian->total_modal,
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
                $sheet->setCellValue('A1', 'REPORT PEMBELIAN');
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
                    'B5' => 'Batch',
                    'C5' => 'Cabang',
                    'D5' => 'Total Item',
                    'E5' => 'Total Berat',
                    'F5' => 'Total Modal',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:F5')->getFont()->setBold(true);

                // Style numeric columns: right-aligned + number format
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    // Total Item, Total Berat, Total Modal — right align
                    $sheet->getStyle("D{$dataStart}:F{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    // Total Modal — thousand separator
                    $sheet->getStyle("F{$dataStart}:F{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'F') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
