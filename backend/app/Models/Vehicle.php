<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id', 'plate', 'brand', 'model', 'year',
        'capacity', 'price', 'price_per_km', 'description', 'image', 'active',
    ];

    protected $casts = [
        'active'       => 'boolean',
        'year'         => 'integer',
        'capacity'     => 'integer',
        'price'        => 'decimal:2',
        'price_per_km' => 'decimal:2',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function trips()
    {
        return $this->hasMany(Trip::class);
    }

    public function tripRequests()
    {
        return $this->hasMany(TripRequest::class);
    }
}
