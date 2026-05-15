<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_method')->default('pickup')->after('payment_method'); // 'pickup' atau 'delivery'
            $table->integer('delivery_fee')->default(0)->after('delivery_method');
            $table->string('delivery_status')->nullable()->after('delivery_fee'); // 'menunggu_kurir', 'sedang_dikirim', dll
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_method', 'delivery_fee', 'delivery_status']);
        });
    }
};
