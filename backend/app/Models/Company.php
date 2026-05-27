<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'cnpj',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'zip_code',
        'active',
    ];

    protected $casts = [
        'active' => 'integer',
    ];
}