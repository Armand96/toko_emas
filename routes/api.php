<?php

use App\Http\Controllers\MBranchController;
use App\Http\Controllers\MCategoryController;
use App\Http\Controllers\MProductController;
use App\Http\Controllers\StoreSettingController;
use Illuminate\Support\Facades\Route;

Route::apiResource('branches', MBranchController::class);
Route::apiResource('settings-store', StoreSettingController::class);
Route::apiResource('products', MProductController::class);
Route::apiResource('categories', MCategoryController::class);
