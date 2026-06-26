<?php

namespace App\Exports;

use App\Models\MCustomer;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CustomerExport implements FromCollection, WithHeadings, WithMapping, WithStyles
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = MCustomer::query()->select(['id', 'customer_name', 'phone_number', 'created_at'])
            ->withCount('sales')
            ->withSum('sales', 'grand_total')
            ->withMax('sales', 'created_at');

        if ($this->request->has('start_date') && $this->request->start_date != '') {
            $query->where('created_at', '>=', $this->request->start_date . ' 00:00:00');
        }
        if ($this->request->has('end_date') && $this->request->end_date != '') {
            $query->where('created_at', '<=', $this->request->end_date . ' 23:59:59');
        }

        return $query->orderByDesc('sales_sum_grand_total')->get();
    }

    public function headings(): array
    {
        return [
            'Nama Customer',
            'No. HP',
            'Jumlah Transaksi',
            'Total Belanja',
            'Transaksi Terakhir',
            'Tanggal Daftar',
        ];
    }

    public function map($customer): array
    {
        return [
            $customer->customer_name,
            $customer->phone_number,
            $customer->sales_count,
            $customer->sales_sum_grand_total ?? 0,
            $customer->sales_max_created_at
                ? \Carbon\Carbon::parse($customer->sales_max_created_at)->format('Y-m-d')
                : '-',
            $customer->created_at?->format('Y-m-d'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
