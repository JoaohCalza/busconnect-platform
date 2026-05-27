<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompaniesController;

// Auth routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::get('/auth/me', [AuthController::class, 'me']);

Route::get('/user/profile', [UserController::class, 'profile']);
Route::put('/user/profile', [UserController::class, 'updateProfile']);

// Company routes
Route::get('/companies/{id}', [CompaniesController::class, 'show']);
Route::put('/companies/{id}', [CompaniesController::class, 'update']);

// User routes
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/company/{company_id}', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);
Route::delete('/users/{id}', [UserController::class, 'destroy']);

// Admin routes
Route::get('/admin/users', function () {
    return \App\Models\User::where('account_type', '!=', 'EMPRESA_ADMIN')
                ->where('account_type', '!=', 'ADMIN')->get();
});

Route::get('/admin/companies', function () {
    return \App\Models\Company::all();
});

Route::put('/admin/companies/{id}/approve', function ($id) {
    $company = \App\Models\Company::find($id);
    if (!$company) {
        return response()->json(['message' => 'Company not found'], 404);
    }
    $company->active = 3;
    $company->save();
    return response()->json($company);
});

Route::put('/admin/companies/{id}/reject', function ($id) {
    $company = \App\Models\Company::find($id);
    if (!$company) {
        return response()->json(['message' => 'Company not found'], 404);
    }
    $company->active = 2;
    $company->save();
    return response()->json($company);
});
