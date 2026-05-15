<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Inertia\Inertia;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\WebhookController;
use App\Models\Branch;
use App\Http\Controllers\OwnerController;

Route::get('/', [LandingController::class, 'index'])->name('landing');
Route::post('/order/submit', [OrderController::class, 'store'])->name('order.submit');
Route::post('/checkout', [CheckoutController::class, 'process']);
Route::post('/api/midtrans-callback', [WebhookController::class, 'handler']);
Route::get('/Pesanan', fn() => Inertia::render('Status_Pesanan', ['branches' => Branch::where('is_active', true)->get()]))->name('pesanan');
Route::post('/api/cek-pesanan', [OrderController::class, 'cekPesanan']);
Route::get('/login', fn() => Inertia::render('Login'))->name('login');
Route::post('/login', [AuthController::class, 'Login']);

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/dashboard', [OrderController::class, 'dashboard'])->name('dashboard');
    // Product (Admin Cabang hanya bisa lihat dan update stok)
    Route::get('/admin/products', [ProductController::class, 'index'])->name('products');
    Route::patch('/admin/products/{id}/stock', [ProductController::class, 'updateStock'])->name('products.update_stock');
    
    // Orders
    Route::get('/admin/orders', [OrderController::class, 'orders'])->name('orders');
    Route::get('/admin/transaction', [OrderController::class, 'transaction'])->name('transaction');
    Route::get('/admin/ordermanagement', [OrderController::class, 'management'])->name('ordermanagement');
    Route::patch('/admin/ordermanagement/{id}/status', [OrderController::class, 'updateStatus'])->name('ordermanagement.status');

    // Courier Management
    Route::get('/admin/couriers', [\App\Http\Controllers\CourierController::class, 'index'])->name('admin.couriers');
    Route::post('/admin/couriers', [\App\Http\Controllers\CourierController::class, 'store'])->name('admin.couriers.store');
    Route::put('/admin/couriers/{id}', [\App\Http\Controllers\CourierController::class, 'update'])->name('admin.couriers.update');
    Route::delete('/admin/couriers/{id}', [\App\Http\Controllers\CourierController::class, 'destroy'])->name('admin.couriers.destroy');

    Route::post('/logout', [AuthController::class, 'Logout']);
});

// Courier Portal Routes
Route::middleware(['auth'])->prefix('courier')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\CourierPortalController::class, 'dashboard'])->name('courier.dashboard');
    Route::patch('/take/{id}', [\App\Http\Controllers\CourierPortalController::class, 'takeOrder'])->name('courier.take');
    Route::patch('/complete/{id}', [\App\Http\Controllers\CourierPortalController::class, 'completeOrder'])->name('courier.complete');
});

Route::middleware(['auth'])->prefix('owner')->group(function () {
    Route::get('/dashboard', [OwnerController::class, 'dashboard'])->name('owner.dashboard');
    
    // Manajemen Cabang
    Route::get('/branches', [OwnerController::class, 'branches'])->name('owner.branches');
    Route::post('/branches', [OwnerController::class, 'storeBranch'])->name('owner.branches.store');
    Route::put('/branches/{id}', [OwnerController::class, 'updateBranch'])->name('owner.branches.update');
    Route::delete('/branches/{id}', [OwnerController::class, 'destroyBranch'])->name('owner.branches.destroy');

    // Laporan & Analitik
    Route::get('/reports', [OwnerController::class, 'reports'])->name('owner.reports');

    // Manajemen Katalog Produk (Kewenangan penuh Owner)
    Route::get('/products', [ProductController::class, 'index'])->name('owner.products');
    Route::post('/products', [ProductController::class, 'store'])->name('owner.products.store');
    Route::put('/products/{id}', [ProductController::class, 'update'])->name('owner.products.update');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->name('owner.products.destroy');
});
