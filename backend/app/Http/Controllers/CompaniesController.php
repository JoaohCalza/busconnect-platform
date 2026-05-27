<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;

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

        $company->delete();

        return response()->json(['message' => 'Company deleted']);
    }

}