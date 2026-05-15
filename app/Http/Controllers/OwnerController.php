<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Branch;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OwnerController extends Controller
{
    public function dashboard(Request $request)
    {
        $admin = Auth::user();

        // Keamanan ekstra: Pastikan hanya super_admin yang bisa akses ini
        if (!$admin || $admin->role !== 'super_admin') {
            return redirect('/admin/dashboard');
        }

        // Karena Owner tidak dibatasi branch_id, query mengambil semua data 
        // secara default. Nanti bisa ditambahkan filter dari dropdown.
        $statsQuery = Order::query();

        // Contoh: Jika Owner memfilter berdasarkan 1 cabang dari UI
        if ($request->has('branch_id') && $request->branch_id != 'semua') {
            $statsQuery->where('branch_id', $request->branch_id);
        }

        // Ambil semua daftar cabang untuk ditampilkan di Dropdown Filter
        $branches = Branch::all();

        // Hitung Statistik
        $pendapatan_hari_ini = (clone $statsQuery)
            ->whereDate('updated_at', today())
            ->whereIn('payment_status', ['success', 'settlement', 'capture'])
            ->sum('total');

        $pendapatan_kemarin = (clone $statsQuery)
            ->whereDate('updated_at', today()->subDay())
            ->whereIn('payment_status', ['success', 'settlement', 'capture'])
            ->sum('total');

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

        // 5 Pesanan terbaru (global atau difilter per cabang)
        $recent_orders = (clone $statsQuery)->with('branch')->orderBy('created_at', 'desc')->take(5)->get();

        return Inertia::render('owner/dashboard', [
            'stats' => $stats,
            'recent_orders' => $recent_orders,
            'branches' => $branches,
            'filters' => $request->only(['branch_id']) // Untuk menyimpan status filter
        ]);
    }

    public function branches()
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'super_admin') {
            return redirect('/admin/dashboard');
        }

        $branches = Branch::with(['users' => function ($query) {
            // Ambil akun admin pertama yang terkait dengan cabang ini
            $query->where('role', 'staff')->limit(1);
        }])->get();

        return Inertia::render('owner/branches', [
            'branches' => $branches
        ]);
    }

    public function storeBranch(Request $request)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'super_admin') return abort(403);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:6',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
        ]);

        // 1. Buat cabangnya dulu
        $branch = Branch::create([
            'nama' => $validated['nama'],
            'alamat' => $validated['alamat'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);

        // 2. Buat akun admin untuk cabang tersebut
        User::create([
            'name' => 'Admin ' . $validated['nama'],
            'email' => $validated['admin_email'],
            'password' => Hash::make($validated['admin_password']),
            'role' => 'staff',
            'branch_id' => $branch->id,
        ]);

        return redirect()->back()->with('success', 'Cabang baru berhasil ditambahkan.');
    }

    public function updateBranch(Request $request, $id)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'super_admin') return abort(403);

        $branch = Branch::with('users')->findOrFail($id);
        $adminUser = $branch->users->first();
        $userId = $adminUser ? $adminUser->id : null;

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
            'admin_email' => 'required|email|unique:users,email,' . $userId,
            'admin_password' => 'nullable|string|min:6',
            'is_active' => 'boolean',
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
        ]);

        // 1. Update data cabang
        $branch->update([
            'nama' => $validated['nama'],
            'alamat' => $validated['alamat'],
            'is_active' => $request->has('is_active') ? $request->is_active : $branch->is_active,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
        ]);

        // 2. Update data admin cabang
        if ($adminUser) {
            $adminUser->name = 'Admin ' . $validated['nama'];
            $adminUser->email = $validated['admin_email'];
            if (!empty($validated['admin_password'])) {
                $adminUser->password = Hash::make($validated['admin_password']);
            }
            $adminUser->save();
        } else {
            // Jika cabang belum punya admin sama sekali
            User::create([
                'name' => 'Admin ' . $validated['nama'],
                'email' => $validated['admin_email'],
                'password' => Hash::make($validated['admin_password'] ?? 'dollin123'),
                'role' => 'staff',
                'branch_id' => $branch->id,
            ]);
        }

        return redirect()->back()->with('success', 'Data cabang berhasil diperbarui.');
    }

    public function destroyBranch($id)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'super_admin') return abort(403);

        $branch = Branch::findOrFail($id);

        // Cek apakah ada riwayat pesanan di cabang ini
        $hasOrders = Order::where('branch_id', $id)->exists();
        
        if ($hasOrders) {
            return redirect()->back()->withErrors(['message' => 'Gagal! Cabang ini sudah memiliki riwayat transaksi penjualan. Silakan gunakan fitur Nonaktifkan cabang agar riwayat keuangan tidak hilang.']);
        }

        // Hapus juga admin yang nyangkut di cabang ini
        User::where('branch_id', $id)->delete();

        $branch->delete();

        return redirect()->back()->with('success', 'Cabang berhasil dihapus secara permanen.');
    }

    public function reports(Request $request)
    {
        $admin = Auth::user();
        if (!$admin || $admin->role !== 'super_admin') {
            return redirect('/admin/dashboard');
        }

        $branchId = $request->input('branch_id', 'semua');
        $waktu = $request->input('waktu', 'bulan_ini');

        // Query Dasar Order yang sudah Selesai (atau berstatus sukses di payment)
        $orderQuery = Order::whereIn('payment_status', ['success', 'settlement', 'capture'])
            ->where('order_status', 'Selesai');

        if ($branchId !== 'semua') {
            $orderQuery->where('branch_id', $branchId);
        }

        // Filter Waktu
        if ($waktu === 'hari_ini') {
            $orderQuery->whereDate('updated_at', Carbon::today());
        } elseif ($waktu === 'minggu_ini') {
            $orderQuery->where('updated_at', '>=', Carbon::now()->subDays(7));
        } elseif ($waktu === 'bulan_ini') {
            $orderQuery->whereMonth('updated_at', Carbon::now()->month)
                ->whereYear('updated_at', Carbon::now()->year);
        }

        // 1. Dapatkan Total Pendapatan & Jumlah Pesanan
        $totalPendapatan = (clone $orderQuery)->sum('total');
        $totalPesanan = (clone $orderQuery)->count();

        // 2. Dapatkan Produk Terlaris
        // Bergabung dengan order_items dan products
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('products', 'order_items.product_id', '=', 'products.id')
            ->whereIn('orders.payment_status', ['success', 'settlement', 'capture'])
            ->where('orders.order_status', 'Selesai');

        if ($branchId !== 'semua') {
            $topProducts->where('orders.branch_id', $branchId);
        }

        if ($waktu === 'hari_ini') {
            $topProducts->whereDate('orders.updated_at', Carbon::today());
        } elseif ($waktu === 'minggu_ini') {
            $topProducts->where('orders.updated_at', '>=', Carbon::now()->subDays(7));
        } elseif ($waktu === 'bulan_ini') {
            $topProducts->whereMonth('orders.updated_at', Carbon::now()->month)
                ->whereYear('orders.updated_at', Carbon::now()->year);
        }

        $topProducts = $topProducts->select(
            'products.nama as product_name',
            'products.gambar as product_image',
            'order_items.tipe', // Mengetahui apakah dia custom paket
            DB::raw('SUM(order_items.qty) as total_sold'),
            DB::raw('SUM(order_items.harga * order_items.qty) as total_revenue')
        )
            ->groupBy('order_items.product_id', 'products.nama', 'products.gambar', 'order_items.tipe')
            ->orderBy('total_sold', 'DESC')
            ->take(5)
            ->get();

        // 3. Format Data untuk chart trend mingguan (Opsional tapi keren)
        $trendDates = [];
        $trendRevenues = [];
        if ($waktu === 'minggu_ini' || $waktu === 'bulan_ini') {
            $days = $waktu === 'minggu_ini' ? 7 : 30;
            for ($i = $days - 1; $i >= 0; $i--) {
                $dateStr = Carbon::today()->subDays($i)->format('Y-m-d');
                $dailyRev = (clone $orderQuery)->whereDate('updated_at', $dateStr)->sum('total');
                $trendDates[] = Carbon::today()->subDays($i)->format('d M');
                $trendRevenues[] = $dailyRev;
            }
        }

        // 4. Ambil Daftar Transaksi untuk Tabel
        $transactions = (clone $orderQuery)
            ->with(['branch' => function ($q) {
                $q->select('id', 'nama');
            }])
            ->orderBy('updated_at', 'DESC')
            ->get();

        return Inertia::render('owner/reports', [
            'branches' => Branch::all(),
            'filters' => [
                'branch_id' => $branchId,
                'waktu' => $waktu
            ],
            'transactions' => $transactions,
            'stats' => [
                'total_pendapatan' => $totalPendapatan,
                'total_pesanan' => $totalPesanan,
                'top_products' => $topProducts,
                'trend' => [
                    'labels' => $trendDates,
                    'data' => $trendRevenues
                ]
            ]
        ]);
    }
}
