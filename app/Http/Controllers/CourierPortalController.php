<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourierPortalController extends Controller
{
    public function dashboard()
    {
        $courier = Auth::user();
        if (!$courier || $courier->role !== 'courier') return abort(403);

        // Pesanan yang siap diambil kurir (dari cabang yang sama, tipe delivery)
        $availableOrders = Order::with(['items.product', 'branch'])
            ->where('branch_id', $courier->branch_id)
            ->where('delivery_method', 'delivery')
            ->where('order_status', 'Siap Diantar')
            ->whereNull('courier_id')
            ->orderBy('created_at', 'asc')
            ->get();

        // Pesanan yang sedang diantar kurir ini
        $activeOrders = Order::with(['items.product', 'branch'])
            ->where('courier_id', $courier->id)
            ->where('order_status', 'Sedang Dikirim')
            ->orderBy('created_at', 'asc')
            ->get();

        // Pesanan yang diselesaikan kurir ini hari ini
        $completedToday = Order::where('courier_id', $courier->id)
            ->where('order_status', 'Selesai')
            ->whereDate('updated_at', today())
            ->count();

        return Inertia::render('courier/dashboard', [
            'availableOrders' => $availableOrders,
            'activeOrders' => $activeOrders,
            'completedToday' => $completedToday
        ]);
    }

    public function takeOrder($id)
    {
        $courier = Auth::user();
        $order = Order::where('id', $id)
            ->where('branch_id', $courier->branch_id)
            ->whereNull('courier_id')
            ->firstOrFail();

        $order->courier_id = $courier->id;
        $order->order_status = 'Sedang Dikirim';
        $order->delivery_status = 'sedang_dikirim';
        $order->save();

        return redirect()->back()->with('success', 'Pesanan berhasil diambil.');
    }

    public function completeOrder($id)
    {
        $courier = Auth::user();
        $order = Order::where('id', $id)
            ->where('courier_id', $courier->id)
            ->where('order_status', 'Sedang Dikirim')
            ->firstOrFail();

        $order->order_status = 'Selesai';
        $order->delivery_status = 'selesai';
        $order->save();

        return redirect()->back()->with('success', 'Pesanan berhasil diselesaikan.');
    }
}
