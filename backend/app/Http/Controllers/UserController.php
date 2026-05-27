<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index($company_id = null)
    {
      if ($company_id)
        $users = User::where('company_id', $company_id)->get();
      else
        $users = User::all();
      
      return response()->json($users);
    }

    public function show ($id)
    {
      $user = User::find($id);
      if (!$user) {
        return response()->json(['message' => 'User not found'], 404);
      }
      return response()->json($user);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|min:6',
            'birth_date'   => 'nullable|date',
            'account_type' => 'required|in:CLIENTE,EMPRESA_ADMIN,FUNCIONARIO,ADMIN',
            'company_id'   => 'nullable|exists:companies,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['message' => 'User not found'], 404);

        $validated = $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'email'        => 'sometimes|required|email|unique:users,email,' . $id,
            'password'     => 'sometimes|required|min:6',
            'birth_date'   => 'nullable|date',
            'cpf'          => 'nullable|string|max:11',   // ← adicionado
            'phone'        => 'nullable|string|max:20',   // ← adicionado
            'account_type' => 'sometimes|required|in:CLIENTE,EMPRESA_ADMIN,FUNCIONARIO,ADMIN',
            'company_id'   => 'nullable|exists:companies,id',
        ]);

        if (isset($validated['password']))
            $validated['password'] = Hash::make($validated['password']);

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user)
            return response()->json(['message' => 'User not found'], 404);

        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }

    public function profile(Request $request)
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }
    return response()->json($user);
}

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'cpf'   => 'nullable|string|max:11',
        ]);

        $user->update($validated);
        return response()->json($user);
    }
}
