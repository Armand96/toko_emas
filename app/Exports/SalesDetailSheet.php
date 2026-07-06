<?php

namespace App\Exports;

use App\Models\TSalesDetail;
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

class SalesDetailSheet implements FromCollection, WithMapping, WithStyles, WithEvents, WithTitle
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
        $query = TSalesDetail::query()
            ->with([
                'header:id,order_id,branch_id,grand_total',
                'header.branch:id,branch_name',
                'inventory:inventory_code,berat,karat,modal,jual,category_id,subcategory_id',
                'inventory.category:id,category_name',
                'inventory.subCategory:id,category_name',
                'product:id,product_name',
            ])
            ->whereHas('header', function ($q) {
                $q->whereIn('approval_status', ['CETAK KWITANSI', 'SELESAI']);
                if ($this->request->branch_id) {
                    $q->where('branch_id', $this->request->branch_id);
                }
                if ($this->request->payment_type) {
                    $q->where('payment_type', $this->request->payment_type);
                }
                if ($this->request->start_date && $this->request->end_date) {
                    $q->whereBetween('t_sales.created_at', [
                        $this->request->start_date,
                        $this->request->end_date,
                    ]);
                }
            });

        return $query->latest()->get();
    }

    public function map($detail): array
    {
        $inventory = $detail->inventory;
        $modal     = optional($inventory)->modal ?? 0;
        $jual      = $detail->price ?? optional($inventory)->jual ?? 0;
        $margin    = $jual - $modal;

        return [
            optional($detail->header)->order_id,
            $detail->inventory_code,
            optional($detail->product)->product_name,
            optional(optional($inventory)->category)->category_name,
            optional(optional($inventory)->subCategory)->category_name,
            (optional($inventory)->berat ?? '') . ' gr',
            (optional($inventory)->karat ?? '') . 'K',
            $modal,
            $jual,
            $margin,
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
                $sheet->setCellValue('A1', 'REPORT PENJUALAN');
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
                    $first = $collection->first();
                    $branchName = optional(optional($first->header)->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank (already blank)

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Order ID',
                    'B5' => 'Kode',
                    'C5' => 'Produk',
                    'D5' => 'Kategori',
                    'E5' => 'Sub Kategori',
                    'F5' => 'Berat',
                    'G5' => 'Karat',
                    'H5' => 'Modal',
                    'I5' => 'Harga Jual',
                    'J5' => 'Margin',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:J5')->getFont()->setBold(true);

                // Style numeric columns
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    // Modal, Harga Jual, Margin — right-aligned + thousand separator
                    $sheet->getStyle("H{$dataStart}:J{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("H{$dataStart}:J{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'J') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
