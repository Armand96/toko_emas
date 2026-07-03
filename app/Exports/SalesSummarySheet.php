<?php

namespace App\Exports;

use App\Models\TSales;
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

class SalesSummarySheet implements FromCollection, WithMapping, WithStyles, WithEvents, WithTitle
{
    protected Request $request;
    protected int $headerRows = 5; // title, periode, cabang, blank, column headers

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function collection()
    {
        $query = TSales::query()->with([
            'customer:id,customer_name',
            'branch:id,branch_name',
            'user:id,name',
            'details.inventory:inventory_code,berat,modal',
            'senderBank.bank:id,bank_name',
            'receiverBank.bank:id,bank_name',
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

    public function map($sale): array
    {
        $totalItem  = $sale->details->count();
        $totalBerat = $sale->details->sum(fn($d) => optional($d->inventory)->berat ?? 0);
        $totalModal = $sale->details->sum(fn($d) => optional($d->inventory)->modal ?? 0);
        $totalJual  = $sale->grand_total;
        $margin     = $totalJual - $totalModal;

        // Bank: prefer receiver_bank (store's bank), fallback to sender_bank
        $bankCabang = $sale->receiverBank ?? $sale->senderBank;
        $bankInfo   = null;
        if ($bankCabang) {
            $bankName = optional($bankCabang->bank)->bank_name ?? '';
            $noRek    = $bankCabang->nomor_rekening ?? '';
            $bankInfo = $bankName ? "{$bankName} - {$noRek}" : $noRek;
        }

        return [
            $sale->created_at?->format('d/m/Y'),
            $sale->order_id,
            optional($sale->customer)->customer_name,
            $totalItem,
            $totalBerat . ' gr',
            $totalModal,
            $totalJual,
            $margin,
            $sale->payment_type,
            $bankInfo,
            optional($sale->branch)->branch_name,
            optional($sale->user)->name,
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
                    $branchName = optional($collection->first()->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank (already blank)

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Tanggal',
                    'B5' => 'Order ID',
                    'C5' => 'Customer',
                    'D5' => 'Total Item',
                    'E5' => 'Total Berat',
                    'F5' => 'Total Modal',
                    'G5' => 'Total Jual',
                    'H5' => 'Margin',
                    'I5' => 'Pembayaran',
                    'J5' => 'Bank',
                    'K5' => 'Cabang',
                    'L5' => 'Kasir',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:L5')->getFont()->setBold(true);

                // Style numeric columns
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    // Total Modal, Total Jual, Margin — right-aligned + thousand separator
                    $sheet->getStyle("F{$dataStart}:H{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("F{$dataStart}:H{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'L') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
