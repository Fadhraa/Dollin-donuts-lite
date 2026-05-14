<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class OrderController extends Controller
{
    // Filter Data

    // controller order
    public function store(Request $request)
    {
        // 1. Validasi input
        $request->validate([
            'id_pesanan' => 'required|unique:orders',
            'nama' => 'required',
            'cart' => 'required|array'
        ]);
        // 2. Simpan Data Induk
        $order = Order::create([
            'id_pesanan' => $request->id_pesanan,
            'nama' => $request->nama,
            'nohp' => $request->nohp,
            'alamat' => $request->alamat,
            'total' => $request->total,
        ]);
        // 3. Simpan Detail Item (Looping dari Cart)
        foreach ($request->cart as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'qty' => $item['qty'],
                'harga' => $item['harga'],
                'tipe' => $item['type'],
                'isi_paket' => $item['type'] === 'paket' ? $item['contents'] : null,
            ]);
        }
        return redirect()->route('main')->with('success', 'Pesanan berhasil dibuat!');
    }

    public function cekPesanan(Request $request)
    {
        $request->validate([
            'nohp' => 'required|string'
        ]);

        $orders = Order::with('branch')
            ->where('nohp', $request->nohp)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($orders->isEmpty()) {
            return response()->json(['status' => 'error', 'message' => 'Pesanan tidak ditemukan dengan nomor HP tersebut.'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $orders], 200);
    }

    public function management(Request $request)
    {
        // Ambil data admin yang sedang login
        $admin = Auth::user();

        // 1. Tarik data pesanan 
        $query = Order::with(['branch', 'items.product'])
            ->orderBy('created_at', 'desc');

        // Jika admin memiliki branch_id (bukan super admin pusat), filter datanya!
        if ($admin && $admin->branch_id) {
            $query->where('branch_id', $admin->branch_id);
        }

        // --- MASUKKAN FILTER WAKTU UNTUK TABEL ---
        if ($request->has('waktu') && $request->waktu != 'semua') {
            if ($request->waktu == 'hari_ini') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($request->waktu == 'minggu_ini') {
                $query->whereBetween('created_at', [Carbon::now()->subDays(7), Carbon::now()]);
            } elseif ($request->waktu == 'bulan_ini') {
                $query->whereMonth('created_at', Carbon::now()->month)
                      ->whereYear('created_at', Carbon::now()->year);
            }
        }

        $orders = $query->get();

        // 2. Hitung statistik pesanan (Jangan lupa difilter juga agar angkanya akurat per cabang)
        $statsQuery = Order::query();
        if ($admin && $admin->branch_id) {
            $statsQuery->where('branch_id', $admin->branch_id);
        }

        // --- MASUKKAN FILTER WAKTU UNTUK STATISTIK ---
        if ($request->has('waktu') && $request->waktu != 'semua') {
            if ($request->waktu == 'hari_ini') {
                $statsQuery->whereDate('created_at', Carbon::today());
            } elseif ($request->waktu == 'minggu_ini') {
                $statsQuery->whereBetween('created_at', [Carbon::now()->subDays(7), Carbon::now()]);
            } elseif ($request->waktu == 'bulan_ini') {
                $statsQuery->whereMonth('created_at', Carbon::now()->month)
                      ->whereYear('created_at', Carbon::now()->year);
            }
        }

        $stats = [
            'pesanan_baru' => (clone $statsQuery)->where('order_status', 'Menunggu Konfirmasi')->count(),
            'diproses' => (clone $statsQuery)->where('order_status', 'Diproses')->count(),
            'selesai_hari_ini' => (clone $statsQuery)->where('order_status', 'Selesai')->count(),
        ];

        return \Inertia\Inertia::render('admin/ordermanagement', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => $request->only(['waktu', 'search'])
        ]);
    }


    public function updateStatus(Request $request, $id)
    {
        // 1. Pastikan data yang dikirim ada isinya
        $request->validate([
            'status' => 'required|string'
        ]);

        // 2. Cari pesanan berdasarkan ID, lalu ubah statusnya
        $order = Order::findOrFail($id);
        $order->order_status = $request->status;
        $order->save();

        // 3. Kembalikan respons ke halaman (Inertia akan mereload data secara otomatis tanpa refresh)
        return redirect()->back()->with('success', 'Status pesanan berhasil diperbarui');
    }

    public function transaction(Request $request)
    {
        $admin = Auth::user();
        $query = Order::with('items.product')->orderBy('created_at', 'desc');
        if ($admin && $admin->branch_id) {
            $query->where('branch_id', $admin->branch_id);
        }
        // Filter  Waktu
        if ($request->has('waktu') && $request->waktu != 'semua') {
            if ($request->waktu == 'hari_ini') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($request->waktu == 'minggu_ini') {
                $query->whereBetween('created_at', [Carbon::now()->subDays(7), Carbon::now()]);
            } elseif ($request->waktu == 'bulan_ini') {
                $query->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year);
            }
        }


        $transaction = $query->get();

        $statsQuery = Order::query();
        if ($admin && $admin->branch_id) {
            $statsQuery->where('branch_id', $admin->branch_id);
        }
        $stats = [
            'pendapatan_hari_ini' => (clone $statsQuery)->whereIn('payment_status', ['success', 'settlement', 'capture'])
                ->whereDate('updated_at', today())
                ->sum('total'),
            'jumlah_transaksi' => (clone $statsQuery)->count(),
            'jumlah_pendapatan' => (clone $statsQuery)->whereIn('payment_status', ['success', 'settlement', 'capture'])->sum('total'),
            'transaksi_selesai' => (clone $statsQuery)->where('payment_status', 'success')->count(),
            'transaksi_dibatalkan' => (clone $statsQuery)->where('payment_status', 'failed')->count(),
        ];

        return \Inertia\Inertia::render('admin/transaction', [
            'transaction' => $transaction,
            'stats' => $stats,
            'filters' => $request->only(['waktu', 'search'])
        ]);
    }

    public function orders(Request $request)
    {
        $admin = Auth::user();

        $query = Order::with(['branch', 'items.product'])
            ->orderBy('created_at', 'desc');

        if ($admin && $admin->branch_id) {
            $query->where('branch_id', $admin->branch_id);
        }
        if ($request->has('waktu') && $request->waktu != 'semua') {
            if ($request->waktu == 'hari_ini') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($request->waktu == 'minggu_ini') {
                $query->whereBetween('created_at', [Carbon::now()->subDays(7), Carbon::now()]);
            } elseif ($request->waktu == 'bulan_ini') {
                $query->whereMonth('created_at', Carbon::now()->month)
                    ->whereYear('created_at', Carbon::now()->year);
            }
        }
        $orders = $query->get();

        $statsQuery = Order::query();
        if ($admin && $admin->branch_id) {
            $statsQuery->where('branch_id', $admin->branch_id);
        }

        $stats = [
            'pendapatan_hari_ini' => (clone $statsQuery)->whereDate('updated_at', today())->whereIn('payment_status', ['success', 'settlement'])->sum('total'),
            'diproses' => (clone $statsQuery)->where('order_status', 'Diproses')->count(),
            'total_pesanan' => (clone $statsQuery)->count(),
        ];

        return \Inertia\Inertia::render('admin/orders', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => $request->only(['waktu', 'search'])
        ]);
    }

    public function dashboard()
    {
        $admin = Auth::user();

        $statsQuery = Order::query();
        if ($admin && $admin->branch_id) {
            $statsQuery->where('branch_id', $admin->branch_id);
        }

        $pendapatan_hari_ini = (clone $statsQuery)->whereDate('updated_at', today())->whereIn('payment_status', ['success', 'settlement', 'capture'])->sum('total');
        $pendapatan_kemarin = (clone $statsQuery)->whereDate('updated_at', today()->subDay())->whereIn('payment_status', ['success', 'settlement', 'capture'])->sum('total');

        $persentase = 0;
        if ($pendapatan_kemarin > 0) {
            $persentase = (($pendapatan_hari_ini - $pendapatan_kemarin) / $pendapatan_kemarin) * 100;
        } else if ($pendapatan_hari_ini > 0) {
            $persentase = 100;
        }

        $stats = [
            'pendapatan_hari_ini' => $pendapatan_hari_ini,
            'persentase_pendapatan' => round($persentase, 1),
            'total_orders' => (clone $statsQuery)->count(),
            'pending_pickup' => (clone $statsQuery)->whereIn('order_status', ['Diproses', 'Menunggu Konfirmasi'])->count(),
        ];

        $recent_orders = (clone $statsQuery)->orderBy('created_at', 'desc')->take(5)->get();

        return \Inertia\Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent_orders' => $recent_orders
        ]);
    }
}
