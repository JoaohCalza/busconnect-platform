<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\User;
use App\Models\Notification;

class CompaniesController extends Controller
{
    public function index()
    {
        return Company::all();
    }

    public function show($id)
    {
        $company = Company::find($id);
        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }
        return response()->json($company);
    }

    public function store (Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cnpj' => 'nullable|string|max:255'
    ]);

        $company = Company::create($validated);

        return response()->json($company, 201);
    }

    public function update(Request $request, $id)
    {
        $company = Company::find($id);
        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'cnpj'     => 'nullable|string|max:255',
            'email'    => 'nullable|email|max:255',
            'phone'    => 'nullable|string|max:255',
            'address'  => 'nullable|string|max:255',
            'city'     => 'nullable|string|max:255',
            'state'    => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:255'
        ]);

        $company->update($validated);

        return response()->json($company);
    }

    public function destroy($id)
    {
        $company = Company::find($id);
        if (!$company) {
            return response()->json(['message' => 'Company not found'], 404);
        }

        // active = 4 significa "bloqueada/excluída"
        $company->update(['active' => 4]);

        // Notifica o admin da empresa
        $admin = User::where('company_id', $id)
            ->where('account_type', 'EMPRESA_ADMIN')
            ->first();

        if ($admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type'    => 'company_blocked',
                'message' => 'Sua empresa foi bloqueada pelo administrador. Entre em contato para mais informações.',
            ]);
        }

        return response()->json(['message' => 'Company blocked']);
    }

}