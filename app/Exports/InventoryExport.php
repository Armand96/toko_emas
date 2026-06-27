<?php

namespace App\Exports;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromCollection, WithMapping, WithStyles, WithEvents
{
    protected Request $request;
    protected int $headerRows = 5; // title, tanggal, cabang, blank, column headers

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Inventory::query()->with([
            'product:id,product_name',
            'category:id,category_name',
            'subCategory:id,category_name',
            'branch:id,branch_name',
        ]);

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->category_id) {
            $query->where('category_id', $this->request->category_id);
        }
        if ($this->request->status) {
            $query->where('status', $this->request->status);
        }
        if ($this->request->karat) {
            $query->where('karat', $this->request->karat);
        }
        if ($this->request->search) {
            $query->where(function ($q) {
                $q->where('inventory_code', 'like', '%' . $this->request->search . '%')
                  ->orWhereHas('product', function ($p) {
                      $p->where('product_name', 'like', '%' . $this->request->search . '%');
                  });
            });
        }

        return $query->selectRaw('*, DATEDIFF(NOW(), created_at) as aging_days')->latest()->get();
    }

    public function map($inventory): array
    {
        return [
            $inventory->inventory_code,
            optional($inventory->product)->product_name,
            optional($inventory->category)->category_name,
            optional($inventory->subCategory)->category_name,
            $inventory->berat . ' gr',
            $inventory->karat,
            $inventory->modal,
            $inventory->jual,
            optional($inventory->branch)->branch_name,
            $inventory->created_at?->format('d/m/Y'),
            $inventory->aging_days,
            $inventory->status,
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
                $sheet->setCellValue('A1', 'REPORT ITEM INVENTORY');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Row 2: Tanggal
                $startDate = $this->request->start_date ?? '';
                $endDate   = $this->request->end_date ?? '';

                if ($startDate !== '' && $endDate !== '') {
                    $tanggalText = 'Tanggal : '
                        . \Carbon\Carbon::parse($startDate)->format('d/m/Y')
                        . '-'
                        . \Carbon\Carbon::parse($endDate)->format('d/m/Y');
                } elseif ($startDate !== '') {
                    $tanggalText = 'Tanggal : ' . \Carbon\Carbon::parse($startDate)->format('d/m/Y');
                } else {
                    $tanggalText = 'Tanggal : ';
                }

                $sheet->setCellValue('A2', $tanggalText);

                // Row 3: Cabang
                $branchName = '';
                if ($collection->count() > 0 && $this->request->branch_id) {
                    $branchName = optional($collection->first()->branch)->branch_name ?? '';
                }
                $sheet->setCellValue('A3', 'Cabang : ' . $branchName);

                // Row 4: blank (already blank)

                // Row 5: Column headers
                $headers = [
                    'A5' => 'Kode',
                    'B5' => 'Produk',
                    'C5' => 'Kategori',
                    'D5' => 'Sub Kategori',
                    'E5' => 'Berat',
                    'F5' => 'Karat',
                    'G5' => 'Modal',
                    'H5' => 'Harga Jual',
                    'I5' => 'Cabang',
                    'J5' => 'Tgl Masuk',
                    'K5' => 'Aging',
                    'L5' => 'Status',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style row 5 headers: bold
                $sheet->getStyle('A5:L5')->getFont()->setBold(true);

                // Style Modal & Harga Jual columns: right-aligned + number format
                if ($collection->count() > 0) {
                    $dataStart = $this->headerRows + 1;
                    $dataEnd   = $this->headerRows + $collection->count();

                    $sheet->getStyle("G{$dataStart}:H{$dataEnd}")
                        ->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                    $sheet->getStyle("G{$dataStart}:H{$dataEnd}")
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
