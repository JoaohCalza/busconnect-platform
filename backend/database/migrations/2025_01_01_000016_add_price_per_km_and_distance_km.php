<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->decimal('price_per_km', 10, 2)->nullable()->after('capacity');
        });

        Schema::table('trip_requests', function (Blueprint $table) {
            $table->decimal('distance_km', 10, 2)->nullable()->after('passengers');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('price_per_km');
        });

        Schema::table('trip_requests', function (Blueprint $table) {
            $table->dropColumn('distance_km');
        });
    }
};
