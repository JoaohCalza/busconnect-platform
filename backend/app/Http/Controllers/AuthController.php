<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])
            ->orWhere('name', $validated['email'])
            ->first();

        $passwordValid = false;
        try {
            $passwordValid = $user && Hash::check($validated['password'], $user->password);
        } catch (\RuntimeException $e) {
            // senha não está em bcrypt — credencial inválida
        }

        if (!$passwordValid) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = Str::random(60);
        $user->api_token = $token;
        $user->save();

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 200);
    }

    public function register(Request $request)
    {
        try {
            $rules = [
                'name'         => 'required|string|max:255',
                'email'        => 'required|email|unique:users,email',
                'password'     => 'required|min:6',
                'account_type' => 'required|in:CLIENTE,EMPRESA_ADMIN,FUNCIONARIO,ADMIN',
                'birth_date'   => 'nullable|date',
            ];

            if ($request->account_type === 'EMPRESA_ADMIN') {
                $rules['company_name'] = 'required|string|max:255';
                $rules['cnpj'] = 'required|string|unique:companies,cnpj';
            } else {
                $rules['company_id'] = 'nullable|integer|exists:companies,id';
            }

            $validated = $request->validate($rules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erro de validação',
                'errors' => $e->errors(),
            ], 422);
        }

        $validated['password'] = Hash::make($validated['password']);

        if ($request->account_type === 'EMPRESA_ADMIN') {
            $company = Company::create([
                'name' => $request->company_name,
                'cnpj' => $request->cnpj,
            ]);
            $validated['company_id'] = $company->id;
        }

        $token = Str::random(60);
        $validated['api_token'] = $token;

        $user = User::create($validated);

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 201);
    }

    private function formatUser(User $user): array
    {
        $typeMap = [
            'ADMIN' => 'admin',
            'EMPRESA_ADMIN' => 'company_admin',
            'FUNCIONARIO' => 'company_user',
            'CLIENTE' => 'cliente',
        ];

        $userArray = $user->toArray();
        $userArray['type'] = $typeMap[$user->account_type] ?? strtolower($user->account_type);
        $userArray['company_id'] = $user->company_id;

        return $userArray;
    }

    public function logout(Request $request)
    {
        return response()->json(['message' => 'Logged out successfully'], 200);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        return response()->json($this->formatUser($user));
    }
}
