<?php

use App\Http\Controllers\MBankController;
use App\Http\Controllers\MBranchController;
use App\Http\Controllers\MCategoryController;
use App\Http\Controllers\MCustomerController;
use App\Http\Controllers\MProductController;
use App\Http\Controllers\StoreSettingController;
use Illuminate\Support\Facades\Route;

Route::apiResource('branches', MBranchController::class);
Route::apiResource('settings-store', StoreSettingController::class);
Route::apiResource('products', MProductController::class);
Route::apiResource('categories', MCategoryController::class);
Route::apiResource('banks', MBankController::class);
Route::apiResource('customers', MCustomerController::class);
Route::apiResource('storeSettings', StoreSettingController::class);
