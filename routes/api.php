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
use App\Http\Controllers\CustomerReportController;
use App\Http\Controllers\FinanceReportController;
use App\Http\Controllers\PembelianReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StockOpnameHeaderController;
use App\Http\Controllers\StoreSettingController;
use App\Http\Controllers\TransferItemController;
use App\Http\Controllers\TSalesController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;



Route::post('login', [UserController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () { // comment ini untuk lepas auth sementara
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
    Route::put('inventory/{inventory}', [InventoryController::class, 'update']);
    Route::get('inventory', [InventoryController::class, 'index']);

    Route::get('sales/{sales}', [TSalesController::class, 'single']);
    Route::get('sales', [TSalesController::class, 'index']);
    Route::post('sales', [TSalesController::class, 'createTrx']);
    Route::put('update-sales', [TSalesController::class, 'changeApproval']);

    Route::get('transfer-item/{transferItem}', [TransferItemController::class, 'single']);
    Route::get('transfer-item', [TransferItemController::class, 'index']);
    Route::post('transfer-item', [TransferItemController::class, 'createTrx']);
    Route::put('update-transfer-item', [TransferItemController::class, 'changeApproval']);

    Route::get('remove-item/{removeItem}', [RemoveItemController::class, 'single']);
    Route::get('remove-item', [RemoveItemController::class, 'index']);
    Route::post('remove-item', [RemoveItemController::class, 'createRemoveItem']);
    Route::put('update-remove-item', [RemoveItemController::class, 'changeApproval']);

    Route::get('stock-opname/{header}', [StockOpnameHeaderController::class, 'single']);
    Route::get('stock-opname', [StockOpnameHeaderController::class, 'index']);
    Route::post('stock-opname', [StockOpnameHeaderController::class, 'createOpname']);

    Route::get('roles', [RoleController::class, 'index']);

    Route::prefix('report')->group(function() {
        // CUSTOMER
        Route::get('customer-count', [CustomerReportController::class, 'customerCount']);
        Route::get('top-customer', [CustomerReportController::class, 'topCustomer']);
        Route::get('top-customer-detail', [CustomerReportController::class, 'topCustomerPagination']);
        Route::get('customer-transaction', [CustomerReportController::class, 'customerTransaction']);

        // FINANCE
        Route::get('total-count', [FinanceReportController::class, 'totalCount']);
        Route::get('total-group-by-cabang', [FinanceReportController::class, 'totalGroupedCabang']);
        Route::get('finance-summary', [FinanceReportController::class, 'financeSummary']);
        Route::get('finance-detail', [FinanceReportController::class, 'financeDetail']);

        // PEMBELIAN
        Route::get('pembelian-total-item', [PembelianReportController::class, 'totalItem']);
        Route::get('pembelian-by-category', [PembelianReportController::class, 'pembelianKategoriReport']);
        Route::get('pembelian-by-karat', [PembelianReportController::class, 'pembelianKaratReport']);
        Route::get('pembelian-detail', [PembelianReportController::class, 'pembelianDetail']);
    });

    Route::get('profile', [UserController::class, 'profile']);
    Route::get('logout', [UserController::class, 'logout']);
}); // comment ini untuk lepas auth sementara

Route::prefix('enum')->group(function () {
    Route::get('pembelian-status', [EnumController::class, 'pembelianStatus']);
});
