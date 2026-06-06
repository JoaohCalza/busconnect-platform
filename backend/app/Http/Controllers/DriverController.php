<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Driver;

class DriverController extends Controller
{
    public function index(Request $request)
    {
        $companyId = $request->query('company_id');
        if (!$companyId) {
            return response()->json(['message' => 'company_id is required'], 422);
        }

        return response()->json(
            Driver::where('company_id', $companyId)->get()
        );
    }

    public function show($id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }
        return response()->json($driver);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id'   => 'required|exists:companies,id',
            'name'         => 'required|string|max:255',
            'cpf'          => 'required|string|unique:drivers,cpf',
            'cnh'          => 'required|string',
            'cnh_category' => 'required|string|max:5',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'active'       => 'boolean',
        ]);

        $driver = Driver::create($validated);

        return response()->json($driver, 201);
    }

    public function update(Request $request, $id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|string|max:255',
            'cpf'          => 'sometimes|string|unique:drivers,cpf,' . $id,
            'cnh'          => 'sometimes|string',
            'cnh_category' => 'sometimes|string|max:5',
            'phone'        => 'nullable|string|max:20',
            'email'        => 'nullable|email|max:255',
            'active'       => 'boolean',
        ]);

        $driver->update($validated);

        return response()->json($driver);
    }

    public function destroy($id)
    {
        $driver = Driver::find($id);
        if (!$driver) {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $driver->update(['active' => false]);

        return response()->json(['message' => 'Driver deactivated']);
    }
}
