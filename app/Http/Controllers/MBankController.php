<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MBankRequest;
use App\Models\MBank;
use Illuminate\Http\Request;

class MBankController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MBank::query();

        if ($request->has('bank_name') && $request->bank_name != "") {
            $query->where('bank_name', 'like', '%' . $request->bank_name . '%');
        }
        if ($request->has('no_rekening') && $request->no_rekening != "") {
            $query->where('no_rekening', 'like', '%' . $request->no_rekening . '%');
        }
        if ($request->has('pemilik') && $request->pemilik != "") {
            $query->where('pemilik', 'like', '%' . $request->pemilik . '%');
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $bankes = $query->paginate($perPage);

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
    public function store(MBankRequest $request)
    {
        $validated = $request->validated();

        try {
            $bank = MBank::create($validated);

            return ApiResponse::success($bank, "Success create bank", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MBank $bank)
    {
        return ApiResponse::success($bank, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MBank $bank)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MBankRequest $request, MBank $bank)
    {
        $validated = $request->validated();

        try {
            $bank->update($validated);

            return ApiResponse::success($bank, "Success update bank", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MBank $bank)
    {
        try {
            $bank->delete();
            return ApiResponse::success($bank, "Bank deleted", 200);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
