<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::query();

        if ($request->has('role_name') && $request->role_name != "") {
            $query->where('role_name', 'like', '%' . $request->role_name . '%');
        }

        $perPage = $request->input('per_page', 10); // Default to 10 items per page
        $roles = $query->orderBy('id', 'desc')->paginate($perPage);

        return response()->json($roles);
    }
}
