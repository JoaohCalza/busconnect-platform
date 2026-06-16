<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id', 'company_id', 'vehicle_id', 'driver_id', 'client_id',
        'start_date', 'end_date', 'price', 'commission', 'observations', 'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'price'      => 'decimal:2',
        'commission' => 'decimal:2',
    ];

    public function request()
    {
        return $this->belongsTo(TripRequest::class, 'request_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }
}
