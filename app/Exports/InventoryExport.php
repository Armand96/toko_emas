<?php

namespace App\Exports;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class InventoryExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Request $request;

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

    public function headings(): array
    {
        return [
            'Kode Inventori',
            'Produk',
            'Kategori',
            'Sub Kategori',
            'Cabang',
            'Karat',
            'Berat (gr)',
            'Modal',
            'Harga Jual',
            'Status',
            'Aging (hari)',
            'Tanggal Masuk',
        ];
    }

    public function map($inventory): array
    {
        return [
            $inventory->inventory_code,
            optional($inventory->product)->product_name,
            optional($inventory->category)->category_name,
            optional($inventory->subCategory)->category_name,
            optional($inventory->branch)->branch_name,
            $inventory->karat,
            $inventory->berat,
            $inventory->modal,
            $inventory->jual,
            $inventory->status,
            $inventory->aging_days,
            $inventory->created_at?->format('Y-m-d'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
