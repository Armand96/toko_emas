<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('username') && $request->username != "") {
            $query->where('username', 'like', '%' . $request->username . '%');
        }
        if ($request->has('name') && $request->name != "") {
            $query->where('name', 'like', '%' . $request->name . '%');
        }
        if ($request->has('email') && $request->email != "") {
            $query->where('email', 'like', '%' . $request->email . '%');
        }
        if ($request->has('branch_id') && $request->branch_id != "") {
            $query->where('branch_id', $request->branch_id);
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $users = $query->paginate($perPage);

        return response()->json($users);
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
    public function store(UserRequest $request)
    {
        $validated = $request->validated();

        try {
            $validated['password'] = Hash::make($validated['password']);
            $user = User::create($validated);

            return ApiResponse::success($user, "Success create user", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return ApiResponse::success($user, "Success");
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        $validated = $request->validated();

        try {
            if (isset($validated['password']) && $validated['password'] != "") $validated['password'] = Hash::make($validated['password']);
            $user->update($validated);

            return ApiResponse::success($user, "Success update user", 201);
        } catch (\Throwable $th) {
            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        return ApiResponse::error('route not found', null, 404);
    }

    public function profile(Request $request)
    {
        return ApiResponse::success($request->user(), "OK", 200);
    }

    public function login(LoginRequest $request)
    {
        if (! Auth::attempt([
            'username' => $request->username,
            'password' => $request->password,
        ])) {
            return ApiResponse::error(
                'Invalid credentials',
                null,
                401
            );
        }

        $user = Auth::user();

        $user->token = $user
            ->createToken('react-app')
            ->plainTextToken;

        return ApiResponse::success([
            'user' => $user,
            // 'token' => $token,
        ], 'OK', 200);
    }

    public function logout(Request $request)
    {
        $request->user()
            ->tokens()
            ->delete();

        return ApiResponse::success(
            [],
            'Logged out from all devices',
            200
        );
    }
}
