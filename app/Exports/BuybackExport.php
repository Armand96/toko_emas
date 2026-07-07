<?php

namespace App\Exports;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class BuybackExport implements WithMultipleSheets
{
    protected Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function sheets(): array
    {
        return [
            new BuybackSummarySheet($this->request),
            new BuybackDetailSheet($this->request),
        ];
    }
}
