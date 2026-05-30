<?php

use App\Http\Controllers\MBranchController;
use App\Http\Controllers\MProductController;
use Illuminate\Support\Facades\Route;

Route::apiResource('branches', MBranchController::class);
Route::apiResource('products', MProductController::class);
