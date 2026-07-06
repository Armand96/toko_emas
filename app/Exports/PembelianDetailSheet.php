<?php

namespace App\Exports;

use App\Helpers\PembelianStatus;
use App\Models\Pembelian;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PembelianDetailSheet implements FromCollection, WithMapping, WithStyles, WithEvents, WithTitle
{
    protected Request $request;
    protected int $headerRows = 5; // title, periode, cabang, blank, column headers

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function title(): string
    {
        return 'Detail';
    }

    public function collection()
    {
        $query = Pembelian::query()
            ->with([
                'branch:id,branch_name',
                'product:id,product_name',
                'category:id,category_name',
                'subcategory:id,category_name',
            ])
            ->where('status', PembelianStatus::DISETUJUI);

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

        return $query->orderByDesc('batch')->get();
    }

    public function map($pembelian): array
    {
        return [
            $pembelian->batch,
            $pembelian->inventory_code,
            optional($pembelian->product)->product_name,
            optional($pembelian->category)->category_name,
            optional($pembelian->subcategory)->category_name,
            $pembelian->berat . ' gr',
            $pembelian->karat . 'K',
            $pembelian->modal,
            $pembelian->jual,
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
                        . Carbon::parse($startDate)->format('d/m/Y')
                        . '-'
                        . Carbon::parse($endDate)->format('d/m/Y');
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
                    'A5' => 'Batch',
                    'B5' => 'Kode',
                    'C5' => 'Produk',
                    'D5' => 'Kategori',
                    'E5' => 'Sub Kategori',
                    'F5' => 'Berat',
                    'G5' => 'Karat',
                    'H5' => 'Modal',
                    'I5' => 'Harga Jual',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:I5')->getFont()->setBold(true);

                // Style numeric columns
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    // Modal & Harga Jual — right align + thousand separator
                    $sheet->getStyle("H{$dataStart}:I{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("H{$dataStart}:I{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'I') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
