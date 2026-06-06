<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TripRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id', 'company_id', 'vehicle_id', 'origin', 'destination',
        'departure_date', 'departure_time', 'passengers', 'distance_km', 'notes', 'status',
    ];

    protected $casts = [
        'departure_date' => 'date',
        'passengers'     => 'integer',
        'distance_km'    => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function trip()
    {
        return $this->hasOne(Trip::class, 'request_id');
    }
}
