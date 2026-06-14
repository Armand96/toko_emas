<?php

use App\Http\Controllers\BankCabangController;
use App\Http\Controllers\EnumController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MBankController;
use App\Http\Controllers\MBranchController;
use App\Http\Controllers\MCategoryController;
use App\Http\Controllers\MCustomerController;
use App\Http\Controllers\MProductController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\TSalesController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::apiResource('branches', MBranchController::class);
Route::apiResource('settings-store', StoreSettingController::class);
Route::apiResource('products', MProductController::class);
Route::apiResource('categories', MCategoryController::class);
Route::apiResource('banks', MBankController::class);
Route::apiResource('bankCabangs', BankCabangController::class);
Route::apiResource('customers', MCustomerController::class);
Route::apiResource('storeSettings', StoreSettingController::class);
Route::apiResource('users', UserController::class);

Route::get('pembelian/{pembelian}', [PembelianController::class, 'single']);
Route::get('pembelian', [PembelianController::class, 'index']);
Route::post('pembelian', [PembelianController::class, 'pembelian']);
Route::post('pembelian-image', [PembelianController::class, 'pembelianImage']);
Route::post('update-pembelian', [PembelianController::class, 'changeApproval']);

Route::get('inventory/{inventory}', [InventoryController::class, 'single']);
Route::get('inventory', [InventoryController::class, 'index']);

Route::get('sales/{sales}', [TSalesController::class, 'single']);
Route::get('sales', [TSalesController::class, 'index']);
Route::post('sales', [TSalesController::class, 'createTrx']);
Route::put('update-sales', [TSalesController::class, 'changeApproval']);

Route::prefix('enum')->group(function() {
    Route::get('pembelian-status', [EnumController::class, 'pembelianStatus']);
});
