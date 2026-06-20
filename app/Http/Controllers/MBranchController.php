<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MBranchRequest;
use App\Models\MBranch;
use Illuminate\Http\Request;

class MBranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MBranch::query();

        if ($request->has('branch_name') && $request->branch_name != "") {
            $query->where('branch_name', 'like', '%' . $request->branch_name . '%');
        }
        if ($request->has('branch_code') && $request->branch_code != "") {
            $query->where('branch_code', 'like', '%' . $request->branch_code . '%');
        }
        if ($request->has('address') && $request->address != "") {
            $query->where('address', 'like', '%' . $request->address . '%');
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $branches = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($branches);
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
    public function store(MBranchRequest $request)
    {
        $validated = $request->validated();

        try {
            $branch = MBranch::create($validated);

            return ApiResponse::success($branch, "Success create branch", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MBranch $branch)
    {
        return ApiResponse::success($branch, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MBranch $branch)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MBranchRequest $request, MBranch $branch)
    {
        $validated = $request->validated();

        try {
            $branch->update($validated);

            return ApiResponse::success($branch, "Success update branch", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MBranch $branch)
    {
        // try {
        //     $branch->delete();
        //     return ApiResponse::success($branch, "Branch deleted", 200);
        // } catch (\Throwable $th) {
        //     return ApiResponse::error($th->getMessage(), $th, 500);
        // }
        return ApiResponse::error('route not found', null, 404);
    }
}
