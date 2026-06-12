<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Helpers\PembelianStatus;
use Illuminate\Http\Request;

class EnumController extends Controller
{
    public function pembelianStatus()
    {
        return ApiResponse::success(array_map(
            fn($case) => $case->name,
            PembelianStatus::cases()
        ), "OK", 200);
    }
}
