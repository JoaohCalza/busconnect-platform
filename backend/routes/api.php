<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompaniesController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\TripRequestController;
use App\Http\Controllers\TripController;

// ── Auth ──────────────────────────────────────────────────────────────────────
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout',   [AuthController::class, 'logout']);
Route::get('/auth/me',        [AuthController::class, 'me']);

// ── User / Profile ────────────────────────────────────────────────────────────
Route::get('/user/profile',  [UserController::class, 'profile']);
Route::put('/user/profile',  [UserController::class, 'updateProfile']);

Route::post('/users',                        [UserController::class, 'store']);
Route::get('/users/company/{company_id}',    [UserController::class, 'index']);
Route::get('/users/{id}',                    [UserController::class, 'show']);
Route::put('/users/{id}',                    [UserController::class, 'update']);
Route::delete('/users/{id}',                 [UserController::class, 'destroy']);

// ── Companies ─────────────────────────────────────────────────────────────────
Route::get('/companies/{id}',  [CompaniesController::class, 'show']);
Route::put('/companies/{id}',  [CompaniesController::class, 'update']);

// ── Vehicles ──────────────────────────────────────────────────────────────────
Route::get('/vehicles',                             [VehicleController::class, 'index']);   // ?company_id=X ou catálogo público
Route::get('/vehicles/{id}/unavailable-dates',      [VehicleController::class, 'unavailableDates']);
Route::get('/vehicles/{id}',                        [VehicleController::class, 'show']);
Route::post('/vehicles',        [VehicleController::class, 'store']);
Route::put('/vehicles/{id}',    [VehicleController::class, 'update']);
Route::delete('/vehicles/{id}', [VehicleController::class, 'destroy']);

// ── Drivers ───────────────────────────────────────────────────────────────────
Route::get('/drivers',         [DriverController::class, 'index']);     // ?company_id=X
Route::get('/drivers/{id}',    [DriverController::class, 'show']);
Route::post('/drivers',        [DriverController::class, 'store']);
Route::put('/drivers/{id}',    [DriverController::class, 'update']);
Route::delete('/drivers/{id}', [DriverController::class, 'destroy']);

// ── Trip Requests ─────────────────────────────────────────────────────────────
Route::get('/trip-requests',                       [TripRequestController::class, 'index']);       // ?client_id=X ou ?company_id=X
Route::get('/trip-requests/{id}',                  [TripRequestController::class, 'show']);
Route::post('/trip-requests',                      [TripRequestController::class, 'store']);
Route::put('/trip-requests/{id}/status',           [TripRequestController::class, 'updateStatus']);
Route::delete('/trip-requests/{id}',               [TripRequestController::class, 'destroy']);

// ── Trips ─────────────────────────────────────────────────────────────────────
Route::get('/trips',         [TripController::class, 'index']);          // ?company_id=X ou ?client_id=X
Route::get('/trips/{id}',    [TripController::class, 'show']);
Route::post('/trips',        [TripController::class, 'store']);
Route::put('/trips/{id}',    [TripController::class, 'update']);
Route::delete('/trips/{id}', [TripController::class, 'destroy']);

// ── Admin ─────────────────────────────────────────────────────────────────────
use App\Models\Notification;

Route::get('/admin/users', function () {
    return \App\Models\User::whereNotIn('account_type', ['ADMIN', 'EMPRESA_ADMIN'])
                ->with('company:id,name')
                ->get(['id', 'name', 'email', 'phone', 'account_type', 'company_id', 'created_at']);
});

Route::get('/admin/companies', function () {
    return \App\Models\Company::all();
});

Route::put('/admin/companies/{id}/approve', function ($id) {
    $company = \App\Models\Company::find($id);
    if (!$company) return response()->json(['message' => 'Company not found'], 404);

    $company->active = 3;
    $company->save();

    $user = \App\Models\User::where('company_id', $id)
                ->where('account_type', 'EMPRESA_ADMIN')
                ->first();

    if ($user) {
        Notification::create([
            'user_id' => $user->id,
            'type'    => 'company_approved',
            'message' => 'Sua empresa foi aprovada! Já pode acessar todas as funcionalidades.',
        ]);
    }

    return response()->json($company);
});

Route::put('/admin/companies/{id}/reject', function ($id) {
    $company = \App\Models\Company::find($id);
    if (!$company) return response()->json(['message' => 'Company not found'], 404);

    $company->active = 2;
    $company->save();

    $user = \App\Models\User::where('company_id', $id)
                ->where('account_type', 'EMPRESA_ADMIN')
                ->first();

    if ($user) {
        Notification::create([
            'user_id' => $user->id,
            'type'    => 'company_rejected',
            'message' => 'Sua solicitação de cadastro foi recusada.',
        ]);
    }

    return response()->json($company);
});

Route::delete('/admin/companies/{id}', function ($id) {
    $company = \App\Models\Company::find($id);
    if (!$company) return response()->json(['message' => 'Company not found'], 404);

    $company->active = 4;
    $company->save();

    $user = \App\Models\User::where('company_id', $id)
                ->where('account_type', 'EMPRESA_ADMIN')
                ->first();

    if ($user) {
        Notification::create([
            'user_id' => $user->id,
            'type'    => 'company_blocked',
            'message' => 'Sua empresa foi bloqueada pelo administrador.',
        ]);
    }

    return response()->json(['message' => 'Company blocked']);
});

// ── Notifications ─────────────────────────────────────────────────────────────
Route::get('/notifications', function (Request $request) {
    $userId = $request->query('user_id');
    return Notification::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();
});

Route::put('/notifications/{id}/read', function ($id) {
    $notification = Notification::find($id);
    if (!$notification) return response()->json(['message' => 'Not found'], 404);
    $notification->read = true;
    $notification->save();
    return response()->json($notification);
});
