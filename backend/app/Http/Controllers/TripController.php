<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Trip;
use App\Models\Notification;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = Trip::with([
            'vehicle:id,brand,model,plate',
            'driver:id,name',
            'client:id,name,email',
            'company:id,name',
            'request:id,origin,destination,departure_date,departure_time,passengers',
        ]);

        if ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function show($id)
    {
        $trip = Trip::with([
            'vehicle:id,brand,model,plate,capacity',
            'driver:id,name,phone,cnh_category',
            'client:id,name,email,phone',
            'company:id,name,phone,email',
            'request:id,origin,destination,departure_date,departure_time,passengers,notes',
        ])->find($id);

        if (!$trip) {
            return response()->json(['message' => 'Trip not found'], 404);
        }

        return response()->json($trip);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'request_id'   => 'nullable|exists:trip_requests,id',
            'company_id'   => 'required|exists:companies,id',
            'vehicle_id'   => 'nullable|exists:vehicles,id',
            'driver_id'    => 'nullable|exists:drivers,id',
            'client_id'    => 'nullable|exists:users,id',
            'start_date'   => 'required|date',
            'end_date'     => 'nullable|date|after_or_equal:start_date',
            'price'        => 'nullable|numeric|min:0',
            'observations' => 'nullable|string',
            'status'       => 'in:scheduled,in_progress,completed,cancelled',
        ]);

        $trip = Trip::create($validated);
        if ($trip->client_id) {
            Notification::create([
                'user_id' => $trip->client_id,
                'type'    => 'trip_created',
                'message' => 'Sua viagem foi confirmada e está agendada.',
            ]);
        }

        return response()->json($trip->load(['vehicle:id,brand,model,plate', 'driver:id,name']), 201);
    }

    public function update(Request $request, $id)
    {
        $trip = Trip::find($id);
        if (!$trip) {
            return response()->json(['message' => 'Trip not found'], 404);
        }

        $validated = $request->validate([
            'vehicle_id'   => 'sometimes|exists:vehicles,id',
            'driver_id'    => 'sometimes|exists:drivers,id',
            'start_date'   => 'sometimes|date',
            'end_date'     => 'nullable|date',
            'price'        => 'nullable|numeric|min:0',
            'observations' => 'nullable|string',
            'status'       => 'sometimes|in:scheduled,in_progress,completed,cancelled',
        ]);

        $trip->update($validated);

        return response()->json($trip->fresh(['vehicle:id,brand,model,plate', 'driver:id,name']));
    }

    public function destroy($id)
    {
        $trip = Trip::find($id);
        if (!$trip) {
            return response()->json(['message' => 'Trip not found'], 404);
        }

        $trip->update(['status' => 'cancelled']);
        if ($trip->client_id) {
            Notification::create([
                'user_id' => $trip->client_id,
                'type'    => 'trip_cancelled',
                'message' => 'Uma viagem sua foi cancelada.',
            ]);
        }
        return response()->json(['message' => 'Trip cancelled']);
    }
}
