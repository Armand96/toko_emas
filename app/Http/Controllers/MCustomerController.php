<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\MCustomerRequest;
use App\Models\MCustomer;
use Illuminate\Http\Request;

class MCustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = MCustomer::query();

        if ($request->has('customer_name') && $request->customer_name != "") {
            $query->where('customer_name', 'like', '%' . $request->customer_name . '%');
        }
        if ($request->has('address') && $request->address != "") {
            $query->where('address', 'like', '%' . $request->address . '%');
        }
        if ($request->has('phone_number') && $request->phone_number != "") {
            $query->where('phone_number', 'like', '%' . $request->phone_number . '%');
        }
        if ($request->has('is_active') && $request->is_active != "") {
            $query->where('is_active', $request->is_active);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $customeres = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($customeres);
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
    public function store(MCustomerRequest $request)
    {
        $validated = $request->validated();

        try {

            $product = MCustomer::create($validated);

            return ApiResponse::success($product, "Success create new customer", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MCustomer $customer)
    {
        return ApiResponse::success($customer, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(MCustomer $customer)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(MCustomerRequest $request, MCustomer $customer)
    {
        $validated = $request->validated();

        try {

            $customer->update($validated);

            return ApiResponse::success($customer, "Success update customer", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(MCustomer $customer)
    {
        return ApiResponse::error('route not found', null, 404);
    }
}
