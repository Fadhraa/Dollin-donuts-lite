<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Models\Branch;
use Inertia\Inertia;


class LandingController extends Controller
{
    public function index()
    {
        // Ambil produk BESERTA stok di semua cabang
        $products = Product::with(['stocks', 'packageItems'])->where('is_active', true)->get();

        // Ambil juga daftar cabang agar user bisa pilih di frontend
        $branches = Branch::where('is_active', true)->get();

        return Inertia::render('Main', [
            'products' => $products,
            'branches' => $branches
        ]);
    }
}
