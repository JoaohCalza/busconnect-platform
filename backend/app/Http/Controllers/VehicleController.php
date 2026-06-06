<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\Trip;

class VehicleController extends Controller
{
    // GET /vehicles?company_id=X  — lista por empresa
    // GET /vehicles/available      — catálogo público (cliente)
    public function index(Request $request)
    {
        $query = Vehicle::with('company:id,name,city,state,phone,email');

        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        } else {
            // catálogo público: apenas veículos de empresas aprovadas e ativos
            $query->where('active', true)
                  ->whereHas('company', fn($q) => $q->where('active', 3));
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $vehicle = Vehicle::with('company:id,name,city,state,phone,email')->find($id);
        if (!$vehicle) {
            return response()->json(['message' => 'Vehicle not found'], 404);
        }
        return response()->json($vehicle);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id'  => 'required|exists:companies,id',
            'plate'       => 'required|string|unique:vehicles,plate',
            'brand'       => 'required|string|max:100',
            'model'       => 'required|string|max:100',
            'year'        => 'required|integer|min:1990|max:2030',
            'capacity'    => 'required|integer|min:1',
            'price'         => 'nullable|numeric|min:0',
            'price_per_km'  => 'nullable|numeric|min:0',
            'description'   => 'nullable|string',
            'image'         => 'nullable|string',
            'active'        => 'boolean',
        ]);

        $vehicle = Vehicle::create($validated);

        return response()->json($vehicle->load('company:id,name'), 201);
    }

    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) {
            return response()->json(['message' => 'Vehicle not found'], 404);
        }

        $validated = $request->validate([
            'plate'       => 'sometimes|string|unique:vehicles,plate,' . $id,
            'brand'       => 'sometimes|string|max:100',
            'model'       => 'sometimes|string|max:100',
            'year'        => 'sometimes|integer|min:1990|max:2030',
            'capacity'    => 'sometimes|integer|min:1',
            'price'        => 'nullable|numeric|min:0',
            'price_per_km' => 'nullable|numeric|min:0',
            'description'  => 'nullable|string',
            'image'        => 'nullable|string',
            'active'       => 'boolean',
        ]);

        $vehicle->update($validated);

        return response()->json($vehicle);
    }

    public function destroy($id)
    {
        $vehicle = Vehicle::find($id);
        if (!$vehicle) {
            return response()->json(['message' => 'Vehicle not found'], 404);
        }

        $vehicle->update(['active' => false]);

        return response()->json(['message' => 'Vehicle deactivated']);
    }

    // GET /vehicles/{id}/unavailable-dates
    public function unavailableDates($id)
    {
        $trips = Trip::where('vehicle_id', $id)
            ->whereNotIn('status', ['cancelled'])
            ->get(['start_date', 'end_date', 'status']);

        return response()->json($trips);
    }
}
