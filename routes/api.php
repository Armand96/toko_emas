<?php

use App\Http\Controllers\MBranchController;
use Illuminate\Support\Facades\Route;

Route::apiResource('branches', MBranchController::class);
