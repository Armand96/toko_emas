<?php

use App\Http\Controllers\BankCabangController;
use App\Http\Controllers\EnumController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MBankController;
use App\Http\Controllers\MBranchController;
use App\Http\Controllers\MCategoryController;
use App\Http\Controllers\MCategoryFinanceController;
use App\Http\Controllers\MCustomerController;
use App\Http\Controllers\MProductController;
use App\Http\Controllers\MSupplierController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\RemoveItemController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\TSalesController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;



Route::post('login', [UserController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::apiResource('branches', MBranchController::class);
    Route::apiResource('settings-store', StoreSettingController::class);
    Route::apiResource('products', MProductController::class);
    Route::apiResource('categories', MCategoryController::class);
    Route::apiResource('banks', MBankController::class);
    Route::apiResource('bankCabangs', BankCabangController::class);
    Route::apiResource('customers', MCustomerController::class);
    Route::apiResource('storeSettings', StoreSettingController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('suppliers', MSupplierController::class);
    Route::apiResource('categoryFinance', MCategoryFinanceController::class);
    Route::apiResource('finances', FinanceController::class);

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

    Route::get('remove-item/{removeItem}', [RemoveItemController::class, 'single']);
    Route::get('remove-item', [RemoveItemController::class, 'index']);
    Route::post('remove-item', [RemoveItemController::class, 'createRemoveItem']);
    Route::put('update-remove-item', [RemoveItemController::class, 'changeApproval']);

    Route::get('logout', [UserController::class, 'logout']);
});

Route::prefix('enum')->group(function () {
    Route::get('pembelian-status', [EnumController::class, 'pembelianStatus']);
});
