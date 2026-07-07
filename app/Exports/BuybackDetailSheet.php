<?php

namespace App\Exports;

use App\Models\BuybackDetail;
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

class BuybackDetailSheet implements FromCollection, WithMapping, WithStyles, WithEvents, WithTitle
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
        $query = BuybackDetail::query()
            ->with([
                'header:id,buyback_id,branch_id,customer_id,payment_type,grand_total,created_at',
                'header.branch:id,branch_name',
                'header.customer:id,customer_name',
                'product:id,product_name,category_id,subcategory_id',
                'product.category:id,category_name',
                'product.subcategory:id,category_name',
            ])
            ->whereHas('header', function ($q) {
                $q->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);

                if ($this->request->branch_id) {
                    $q->where('branch_id', $this->request->branch_id);
                }
                if ($this->request->payment_type) {
                    $q->where('payment_type', $this->request->payment_type);
                }
                if ($this->request->start_date && $this->request->end_date) {
                    $q->whereBetween('buybacks.created_at', [
                        $this->request->start_date,
                        $this->request->end_date,
                    ]);
                }
            });

        return $query->latest()->get();
    }

    public function map($detail): array
    {
        $product     = $detail->product;
        $header      = $detail->header;

        return [
            optional($header)->buyback_id,
            optional($header->customer ?? null)->customer_name,
            optional($product)->product_name,
            optional(optional($product)->category)->category_name,
            optional(optional($product)->subcategory)->category_name,
            ($detail->berat ?? '') . ' gr',
            ($detail->karat ?? '') . 'K',
            $detail->serial_number ?? '-',
            $detail->price,
            optional($header)->payment_type,
            optional(optional($header)->branch)->branch_name,
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

                if ($collection->count() > 0) {
                    $sheet->insertNewRowBefore(1, $this->headerRows);
                }

                // Row 1: Title
                $sheet->setCellValue('A1', 'REPORT BUYBACK - DETAIL ITEM');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Row 2: Periode
                $startDate = $this->request->start_date ?? '';
                $endDate   = $this->request->end_date ?? '';

                $periodeText = 'Periode : ';
                if ($startDate !== '' && $endDate !== '') {
                    $periodeText = 'Periode : '
                        . Carbon::parse($startDate)->format('d/m/Y')
                        . ' - '
                        . Carbon::parse($endDate)->format('d/m/Y');
                }
                $sheet->setCellValue('A2', $periodeText);

                // Row 3: Cabang
                $branchName = '';
                if ($collection->count() > 0 && $this->request->branch_id) {
                    $first = $collection->first();
                    $branchName = optional(optional($first->header)->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Buyback ID',
                    'B5' => 'Customer',
                    'C5' => 'Produk',
                    'D5' => 'Kategori',
                    'E5' => 'Sub Kategori',
                    'F5' => 'Berat',
                    'G5' => 'Karat',
                    'H5' => 'No. Seri',
                    'I5' => 'Harga Buyback',
                    'J5' => 'Pembayaran',
                    'K5' => 'Cabang',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                $sheet->getStyle('A5:K5')->getFont()->setBold(true);

                // Style numeric column (Harga Buyback)
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    $sheet->getStyle("I{$dataStart}:I{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("I{$dataStart}:I{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'K') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
