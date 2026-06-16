<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TripRequest;
use App\Models\Trip;
use App\Models\Vehicle;
use App\Models\Notification;
use App\Models\User;

class TripRequestController extends Controller
{
    // GET /trip-requests?client_id=X  ou  ?company_id=X
    public function index(Request $request)
    {
        $query = TripRequest::with([
            'client:id,name,email,phone',
            'company:id,name',
            'vehicle:id,brand,model,plate',
        ]);

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        } elseif ($request->has('company_id')) {
            $query->where('company_id', $request->company_id);
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    public function show($id)
    {
        $req = TripRequest::with([
            'client:id,name,email,phone',
            'company:id,name,phone,email',
            'vehicle:id,brand,model,plate,capacity',
            'trip',
        ])->find($id);

        if (!$req) {
            return response()->json(['message' => 'Trip request not found'], 404);
        }

        return response()->json($req);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id'      => 'required|exists:users,id',
            'company_id'     => 'required|exists:companies,id',
            'vehicle_id'     => 'nullable|exists:vehicles,id',
            'origin'         => 'required|string|max:255',
            'destination'    => 'required|string|max:255',
            'departure_date' => 'required|date',
            'departure_time' => 'required|date_format:H:i',
            'passengers'     => 'required|integer|min:1',
            'distance_km'    => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
        ]);

        // Verificar se o veículo já tem viagem confirmada na data solicitada
        if (!empty($validated['vehicle_id'])) {
            $date = $validated['departure_date'];
            $conflict = Trip::where('vehicle_id', $validated['vehicle_id'])
                ->whereNotIn('status', ['cancelled'])
                ->where(function ($q) use ($date) {
                    $q->where(function ($q2) use ($date) {
                        // viagem sem data de fim: só o start_date
                        $q2->whereNull('end_date')->whereDate('start_date', $date);
                    })->orWhere(function ($q2) use ($date) {
                        // viagem com intervalo: data dentro do range
                        $q2->whereNotNull('end_date')
                           ->whereDate('start_date', '<=', $date)
                           ->whereDate('end_date', '>=', $date);
                    });
                })->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'O veículo já possui uma viagem confirmada nessa data.',
                ], 422);
            }
        }

        $tripRequest = TripRequest::create($validated);
        // Notifica EMPRESA_ADMIN da empresa
        $empresaAdmin = User::where('company_id', $tripRequest->company_id)
            ->where('account_type', 'EMPRESA_ADMIN')
            ->first();

        if ($empresaAdmin) {
            Notification::create([
                'user_id' => $empresaAdmin->id,
                'type'    => 'trip_request_received',
                'message' => 'Nova solicitação de viagem recebida de ' . ($tripRequest->client->name ?? 'um cliente') . '.',
            ]);
        }

        return response()->json($tripRequest->load('company:id,name'), 201);
    }

        public function updateStatus(Request $request, $id)
    {
        $tripRequest = TripRequest::find($id);

        // Verificar existência PRIMEIRO
        if (!$tripRequest) {
            return response()->json(['message' => 'Trip request not found'], 404);
        }

        // Validar ANTES de usar $validated
        $validated = $request->validate([
            'status' => 'required|in:pending,accepted,rejected,cancelled',
        ]);

        $tripRequest->update($validated);

        // Notificação DEPOIS de tudo estar definido
        if (in_array($validated['status'], ['accepted', 'rejected'])) {
            Notification::create([
                'user_id' => $tripRequest->client_id,
                'type'    => 'trip_request_' . $validated['status'],
                'message' => $validated['status'] === 'accepted'
                    ? 'Sua solicitação de viagem foi aceita!'
                    : 'Sua solicitação de viagem foi recusada pela empresa.',
            ]);
        }

        // Se aceita, criar a viagem automaticamente
        if ($validated['status'] === 'accepted' && !$tripRequest->trip) {
            $vehicleId = $request->input('vehicle_id') ?? $tripRequest->vehicle_id;
            $driverId  = $request->input('driver_id');

            $price = null;
            $commission = null;
            if ($vehicleId && $tripRequest->distance_km) {
                $vehicle = Vehicle::find($vehicleId);
                if ($vehicle && $vehicle->price_per_km) {
                    $base       = (float) $vehicle->price_per_km * (float) $tripRequest->distance_km;
                    $commission = round($base * 0.10, 2);  // 10% Bus Connect
                    $price      = round($base + $commission, 2); // total pago pelo cliente
                }
            }

            Trip::create([
                'request_id' => $tripRequest->id,
                'company_id' => $tripRequest->company_id,
                'vehicle_id' => $vehicleId,
                'driver_id'  => $driverId,
                'client_id'  => $tripRequest->client_id,
                'start_date' => $tripRequest->departure_date,
                'price'      => $price,
                'commission' => $commission,
                'status'     => 'scheduled',
            ]);
        }

        return response()->json($tripRequest->fresh(['trip']));
    }

    public function destroy($id)
    {
        $tripRequest = TripRequest::find($id);
        if (!$tripRequest) {
            return response()->json(['message' => 'Trip request not found'], 404);
        }

        $tripRequest->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Trip request cancelled']);
    }
}
