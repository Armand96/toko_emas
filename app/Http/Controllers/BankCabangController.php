<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\BankCabangRequest;
use App\Models\BankCabang;
use Illuminate\Http\Request;

class BankCabangController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = BankCabang::query();

        if ($request->has('nomor_rekening') && $request->nomor_rekening != "") {
            $query->where('nomor_rekening', 'like', '%' . $request->nomor_rekening . '%');
        }
        if ($request->has('nama_pemilik') && $request->nama_pemilik != "") {
            $query->where('nama_pemilik', 'like', '%' . $request->nama_pemilik . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('bank_id') && $request->bank_id != "") {
            $query->where('bank_id', $request->bank_id);
        }
        if ($request->has('is_active') && $request->is_active != "") {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $bankes = $query->with(['branch', 'bank'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($bankes);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(BankCabangRequest $request)
    {
        $validated = $request->validated();

        try {
            $bank = BankCabang::create($validated);

            return ApiResponse::success($bank, "Success create bank cabang", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(BankCabang $bankCabang)
    {
        return ApiResponse::success($bankCabang->load(['branch', 'bank']), "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(BankCabang $bankCabang)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(BankCabangRequest $request, BankCabang $bankCabang)
    {
        $validated = $request->validated();

        try {
            $bankCabang->update($validated);

            return ApiResponse::success($bankCabang, "Success update bank cabang", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BankCabang $bankCabang)
    {
        $bankCabang->delete();
        return ApiResponse::success($bankCabang, "Bank Cabang deleted", 200);
    }
}
