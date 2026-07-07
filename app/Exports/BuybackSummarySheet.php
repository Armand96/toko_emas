<?php

namespace App\Exports;

use App\Models\Buyback;
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

class BuybackSummarySheet implements FromCollection, WithMapping, WithStyles, WithEvents, WithTitle
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
        $query = Buyback::query()
            ->with([
                'customer:id,customer_name',
                'branch:id,branch_name',
                'user:id,name',
                'details',
                'senderBank.bank:id,bank_name',
            ])
            ->whereIn('status', ['SELESAI', 'CETAK KWITANSI']);

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->payment_type) {
            $query->where('payment_type', $this->request->payment_type);
        }
        if ($this->request->start_date && $this->request->end_date) {
            $query->whereBetween('buybacks.created_at', [
                $this->request->start_date,
                $this->request->end_date,
            ]);
        }

        return $query->latest()->get();
    }

    public function map($buyback): array
    {
        $totalItem  = $buyback->details->count();
        $totalBerat = $buyback->details->sum('berat');

        $bankInfo = null;
        if ($buyback->senderBank) {
            $bankName = optional($buyback->senderBank->bank)->bank_name ?? '';
            $noRek    = $buyback->senderBank->nomor_rekening ?? '';
            $bankInfo = $bankName ? "{$bankName} - {$noRek}" : $noRek;
        }

        return [
            $buyback->created_at?->format('d/m/Y'),
            $buyback->buyback_id,
            optional($buyback->customer)->customer_name,
            $totalItem,
            $totalBerat . ' gr',
            $buyback->grand_total,
            $buyback->payment_type,
            $bankInfo,
            optional($buyback->branch)->branch_name,
            optional($buyback->user)->name,
            $buyback->status,
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
                $sheet->setCellValue('A1', 'REPORT BUYBACK');
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
                    $branchName = optional($collection->first()->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Tanggal',
                    'B5' => 'Buyback ID',
                    'C5' => 'Customer',
                    'D5' => 'Total Item',
                    'E5' => 'Total Berat',
                    'F5' => 'Total Nominal',
                    'G5' => 'Pembayaran',
                    'H5' => 'Bank Keluar',
                    'I5' => 'Cabang',
                    'J5' => 'User',
                    'K5' => 'Status',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                $sheet->getStyle('A5:K5')->getFont()->setBold(true);

                // Style numeric columns
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    $sheet->getStyle("F{$dataStart}:F{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("F{$dataStart}:F{$dataEnd}")
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
