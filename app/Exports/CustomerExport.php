<?php

namespace App\Exports;

use App\Models\MCustomer;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomerExport implements FromCollection, WithMapping, WithStyles, WithEvents
{
    protected Request $request;
    protected int $headerRows = 4; // rows before data starts (title, periode, blank, column headers)

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = MCustomer::query()->select(['id', 'customer_name', 'phone_number', 'created_at'])
            ->withCount(['sales' => fn ($q) => $q->where('approval_status', 'SELESAI')])
            ->withSum(['sales' => fn ($q) => $q->where('approval_status', 'SELESAI')], 'grand_total')
            ->withMax(['sales' => fn ($q) => $q->where('approval_status', 'SELESAI')], 'created_at');

        if ($this->request->has('start_date') && $this->request->start_date != '') {
            $query->where('created_at', '>=', $this->request->start_date . ' 00:00:00');
        }
        if ($this->request->has('end_date') && $this->request->end_date != '') {
            $query->where('created_at', '<=', $this->request->end_date . ' 23:59:59');
        }

        return $query->orderByDesc('sales_sum_grand_total')->get();
    }

    public function map($customer): array
    {
        return [
            $customer->customer_name,
            $customer->phone_number,
            $customer->sales_count,
            $customer->sales_sum_grand_total ?? 0,
            $customer->sales_max_created_at
                ? \Carbon\Carbon::parse($customer->sales_max_created_at)->format('d/m/Y')
                : '-',
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
                $sheet = $event->sheet->getDelegate();
                $collection = $this->collection();
                $totalRows = $this->headerRows + $collection->count();

                // --- Shift existing data rows down to make room for header rows ---
                // Data was written starting at row 1, shift it down by (headerRows - 1)
                if ($collection->count() > 0) {
                    $sheet->insertNewRowBefore(1, $this->headerRows);
                }

                // Row 1: Title
                $sheet->setCellValue('A1', 'REPORT TRANSAKSI CUSTOMER');
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

                // Row 3: blank (already blank)

                // Row 4: Column headers
                $headers = [
                    'A4' => 'Nama Customer',
                    'B4' => 'No. HP',
                    'C4' => 'Jumlah Transaksi',
                    'D4' => 'Total Pembelian',
                    'E4' => 'Transaksi Terakhir',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 4 headers: bold
                $sheet->getStyle('A4:E4')->getFont()->setBold(true);

                // Style column C & D data rows: right-aligned (number)
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();
                    $sheet->getStyle("C{$dataStart}:D{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    // Format column D as number with thousand separator
                    $sheet->getStyle("D{$dataStart}:D{$dataEnd}")
                        ->getNumberFormat()
                        ->setFormatCode('#,##0');
                }

                // Auto-size columns
                foreach (range('A', 'E') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
