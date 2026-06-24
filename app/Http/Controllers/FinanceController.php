<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\FinanceRequest;
use App\Models\Finance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FinanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        DB::enableQueryLog();

        $query = Finance::query();

        if ($request->has('note') && $request->note != "") {
            $query->where('note', 'like', '%' . $request->note . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->has('category_finance_id') && $request->category_finance_id != "") {
            $query->where('category_finance_id', $request->category_finance_id);
        }
        if ($request->has('type') && $request->type != "") {
            $query->where('type', $request->type);
        }
        if ($request->has('payment_method') && $request->payment_method != "") {
            $query->where('payment_method', $request->payment_method);
        }
        if ($request->has('start_date') && $request->start_date != "") {
            $query->where('created_at', '>=', $request->start_date . " 00:00:00");
        }
        if ($request->has('end_date') && $request->end_date != "") {
            $query->where('created_at', '<=', $request->end_date . " 23:59:59");
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $finances = $query->with(['branch', 'category', 'bankCabang'])->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($finances);
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
    public function store(FinanceRequest $request)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('attachment')) {

                // Upload new attachment
                $attachment = $request->file('attachment');

                $attachmentName = "finance_attachment_" . date('Y-m-d_H_i_s') . "." . $attachment->getClientOriginalExtension();

                $attachment->storeAs(
                    'attachments',
                    $attachmentName,
                    'public'
                );

                $validated['attachment'] = 'attachments/' . $attachmentName;
            }

            $category = Finance::create($validated);

            return ApiResponse::success($category, "Success create finance", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Finance $finance)
    {
        return ApiResponse::success($finance->load(['branch', 'category', 'bankCabang']), "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Finance $finance)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(FinanceRequest $request, Finance $finance)
    {
        $validated = $request->validated();

        try {

            if ($request->hasFile('attachment')) {

                // Delete old files
                if ($finance->attachment != null && Storage::disk('public')->exists($finance->attachment)) {
                    Storage::disk('public')->delete($finance->attachment);
                }

                // Upload new attachment
                $attachment = $request->file('attachment');

                $attachmentName = "finance_attachment_" . date('Y-m-d_H_i_s') . "." . $attachment->getClientOriginalExtension();

                $attachment->storeAs(
                    'attachments',
                    $attachmentName,
                    'public'
                );

                $validated['attachment'] = 'attachments/' . $attachmentName;
            }

            $finance->update($validated);

            return ApiResponse::success($finance, "Success update finance", 201);
        } catch (\Throwable $th) {
            ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Finance $finance)
    {
        try {
            $finance->delete();

            if ($finance->attachment != null && Storage::disk('public')->exists($finance->attachment)) {
                Storage::disk('public')->delete($finance->attachment);
            }

            return ApiResponse::success($finance, "Finance deleted", 200);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }
}
