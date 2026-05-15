<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use App\Models\BranchStock;
use Illuminate\Support\Facades\Auth;



use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->role === 'super_admin') {
            // Owner memanajemen seluruh katalog produk
            $products = Product::with('packageItems')->orderBy('created_at', 'desc')->get();
            return inertia('owner/products', [
                'satuanProducts' => Product::where('tipe', 'satuan')->get(),
                'products' => $products
            ]);
        } else {
            // Admin cabang hanya melihat produk dan mengelola stok cabangnya
            $branchId = $user->branch_id;
            $products = Product::with(['stocks' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            }])->orderBy('created_at', 'desc')->get();
            
            return inertia('admin/products', [
                'products' => $products
            ]);
        }
    }

    public function updateStock(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'staff' || !$user->branch_id) {
            return abort(403);
        }

        $request->validate([
            'stock' => 'required|numeric|min:0'
        ]);

        BranchStock::updateOrCreate(
            ['product_id' => $id, 'branch_id' => $user->branch_id],
            ['stock' => $request->stock]
        );

        return redirect()->back()->with('success', 'Stok berhasil diperbarui!');
    }

    public function store(Request $request)
    {
        if (Auth::user()->role !== 'super_admin') return abort(403);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|numeric|min:0',
            'deskripsi' => 'nullable|string',
            'is_active' => 'boolean',
            'is_favorite' => 'boolean',
            'is_new' => 'boolean',
            'tipe' => 'required|in:satuan,paket',
            'kategori' => 'required|in:donuts,mochi,pastry,beverage',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'jumlah_pilihan' => 'nullable|required_if:tipe,paket|numeric|min:1',
            'package_items' => 'nullable|array',
            'package_items.*' => 'exists:products,id',
        ]);

        $linkGambar = null;
        if ($request->hasFile('gambar')) {
            $path = $request->file('gambar')->store('dollin_donuts', 'cloudinary');
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('cloudinary');
            $linkGambar = collect(explode('?', $disk->url($path)))->first();
        }
        $prefix = $validated['tipe'] === 'paket' ? 'PKT' : 'PRD'; // Sederhanakan generator untuk contoh ini
        $kodeOtomatis = $prefix . '-' . strtoupper(\Illuminate\Support\Str::random(5));

        $product = Product::create([
            'kode_produk' => $kodeOtomatis,
            'nama' => $validated['nama'],
            'harga' => $validated['harga'],
            'stok' => $validated['stok'], // Tetap diisi sebagai backup atau total awal
            'deskripsi' => $validated['deskripsi'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_favorite' => $validated['is_favorite'] ?? false,
            'is_new' => $validated['is_new'] ?? false,
            'tipe' => $validated['tipe'],
            'kategori' => $validated['kategori'],
            'jumlah_pilihan' => $validated['jumlah_pilihan'] ?? null,
            'gambar' => $linkGambar ?? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1170&auto=format&fit=crop',
        ]);
        if (Auth::user()->branch_id) {
            BranchStock::updateOrCreate(
                ['product_id' => $product->id, 'branch_id' => Auth::user()->branch_id],
                ['stock' => $validated['stok']]
            );
        }

        // Menyihir Pivot Table: Jika itu paket dan ada varian yg dicentang, gabungkan!
        if ($validated['tipe'] === 'paket' && !empty($validated['package_items'])) {
            $product->packageItems()->attach($validated['package_items']);
        }

        return redirect()->route('products')->with('success', 'Produk berhasil ditambahkan!');
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role !== 'super_admin') return abort(403);

        $product = Product::findOrFail($id);
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'harga' => 'required|numeric|min:0',
            'stok' => 'required|numeric|min:0',
            'deskripsi' => 'nullable|string',
            'is_active' => 'boolean',
            'is_favorite' => 'boolean',
            'is_new' => 'boolean',
            'tipe' => 'required|in:satuan,paket',
            'kategori' => 'required|in:donuts,mochi,pastry,beverage',
            'gambar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'jumlah_pilihan' => 'nullable|required_if:tipe,paket|numeric|min:1',
            'package_items' => 'nullable|array',
            'package_items.*' => 'exists:products,id',
        ]);

        $updateData = [
            'nama' => $validated['nama'],
            'harga' => $validated['harga'],
            'stok' => $validated['stok'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'is_favorite' => $validated['is_favorite'] ?? false,
            'is_new' => $validated['is_new'] ?? false,
            'tipe' => $validated['tipe'],
            'kategori' => $validated['kategori'],
            'jumlah_pilihan' => $validated['jumlah_pilihan'] ?? null,
        ];
        $prefix = 'PRD';
        if ($validated['tipe'] === 'paket') {
            $prefix = 'PKT';
        } else {
            // Tipe Satuan
            $kategoriPrefixes = [
                'donuts' => 'DNT',
                'mochi' => 'MCH',
                'minuman' => 'MNM',
                'pastry' => 'PST',
            ];
            $prefix = $kategoriPrefixes[$validated['kategori'] ?? 'donuts'] ?? 'PRD';
        }
        $potonganKode = explode('-', $product->kode_produk);
        $kodeAcakSejarah = isset($potonganKode[1]) ? $potonganKode[1] : strtoupper(\Illuminate\Support\Str::random(5));
        $updateData['kode_produk'] = $prefix . '-' . $kodeAcakSejarah;

        // Jika mengunggah gambar baru
        if ($request->hasFile('gambar')) {
            $path = $request->file('gambar')->store('dollin_donuts', 'cloudinary');
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('cloudinary');
            $updateData['gambar'] = collect(explode('?', $disk->url($path)))->first();
        }


        $product->update($updateData);
        if (Auth::user()->branch_id) {
            BranchStock::updateOrCreate(
                ['product_id' => $product->id, 'branch_id' => Auth::user()->branch_id],
                ['stock' => $validated['stok']]
            );
        }
        // Menyihir Pivot Table khusus jika ini paket
        if ($validated['tipe'] === 'paket') {
            if (!empty($validated['package_items'])) {
                $product->packageItems()->sync($validated['package_items']);
            } else {
                $product->packageItems()->detach();
            }
        } else {
            // Jika dulunya paket, lalu diubah jadi satuan, hapus semua relasinya
            $product->packageItems()->detach();
        }

        return redirect()->route('products')->with('success', 'Produk berhasil diperbarui!');
    }
    public function destroy($id)
    {
        if (Auth::user()->role !== 'super_admin') return abort(403);

        $product = Product::findOrFail($id);

        // Opsional: Jika ada relasi paket, hapus dulu relasinya
        $product->packageItems()->detach();

        // Eksekusi hapus!
        $product->delete();

        return redirect()->back()->with('success', 'Produk berhasil dilenyapkan!');
    }
}
