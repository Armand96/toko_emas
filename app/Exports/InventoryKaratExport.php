<?php

namespace App\Exports;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryKaratExport implements FromCollection, WithEvents, WithMapping, WithStyles
{
    protected Request $request;

    protected int $headerRows = 4; // title, cabang, blank, column headers

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Inventory::query();

        if ($this->request->branch_id) {
            $query->where('branch_id', $this->request->branch_id);
        }
        if ($this->request->category_id) {
            $query->where('category_id', $this->request->category_id);
        }
        if ($this->request->status) {
            $query->where('status', $this->request->status);
        }
        if ($this->request->aging && in_array($this->request->status, ['SOLD', 'LOST'])) {
            $aging = 'DATEDIFF(NOW(), created_at)';
            switch ($this->request->aging) {
                case '0-30':
                    $query->whereRaw("$aging <= 30");
                    break;
                case '31-90':
                    $query->whereRaw("$aging BETWEEN 31 AND 90");
                    break;
                case '91-180':
                    $query->whereRaw("$aging BETWEEN 91 AND 180");
                    break;
                case '>180':
                    $query->whereRaw("$aging > 180");
                    break;
            }
        }
        if ($this->request->search) {
            $search = $this->request->search;
            $query->where(function ($q) use ($search) {
                $q->where('inventory_code', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($p) use ($search) {
                        $p->where('product_name', 'like', "%{$search}%");
                    });
            });
        }

        return $query
            ->selectRaw('
                karat,
                COUNT(*) as total_item,
                SUM(berat) as total_berat
            ')
            ->where('status', 'AVAILABLE')
            ->groupBy('karat')
            ->orderByDesc('karat')
            ->get();
    }

    public function map($row): array
    {
        return [
            $row->karat ? $row->karat.' K' : '-',
            $row->total_item,
            number_format($row->total_berat, 2, '.', '').' gr',
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

                // Shift data rows down to make room for header rows
                if ($collection->count() > 0) {
                    $sheet->insertNewRowBefore(1, $this->headerRows);
                }

                // Row 1: Title
                $sheet->setCellValue('A1', 'REPORT RINGKASAN INVENTORY PER KARAT');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(12);

                // Row 2: Cabang
                $branchName = '';
                if ($this->request->branch_id && $collection->count() > 0) {
                    $branchName = $this->request->branch_id;
                }
                $sheet->setCellValue('A2', 'Cabang : '.$branchName);

                // Row 3: blank

                // Row 4: Column headers
                $headers = [
                    'A4' => 'Karat',
                    'B4' => 'Total Item',
                    'C4' => 'Total Berat (gr)',
                ];

                foreach ($headers as $cell => $value) {
                    $sheet->setCellValue($cell, $value);
                }

                // Style header row bold
                $sheet->getStyle('A4:C4')->getFont()->setBold(true);

                // Auto-size columns
                foreach (range('A', 'C') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            },
        ];
    }
}
