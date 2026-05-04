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

Route::get('/', [LandingController::class, 'index'])->name('landing');
Route::post('/order/submit', [OrderController::class, 'store'])->name('order.submit');
Route::post('/checkout', [CheckoutController::class, 'process']);
Route::post('/api/midtrans-callback', [WebhookController::class, 'handler']);
Route::get('/Pesanan', fn() => Inertia::render('Status_Pesanan', ['branches' => Branch::all()]))->name('pesanan');
Route::post('/api/cek-pesanan', [OrderController::class, 'cekPesanan']);
Route::get('/login', fn() => Inertia::render('Login'))->name('login');
Route::post('/login', [AuthController::class, 'Login']);

Route::middleware(['auth'])->group(function () {
    Route::get('/admin/dashboard', [OrderController::class, 'dashboard'])->name('dashboard');
    // Product
    Route::get('/admin/products', [ProductController::class, 'index'])->name('products');
    Route::post('/admin/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/admin/products/{id}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/admin/products/{id}', [ProductController::class, 'destroy'])->name('products.destroy');
    // Orders
    Route::get('/admin/orders', [OrderController::class, 'orders'])->name('orders');
    Route::get('/admin/transaction', [OrderController::class, 'transaction'])->name('transaction');
    Route::get('/admin/ordermanagement', [OrderController::class, 'management'])->name('ordermanagement');
    Route::patch('/admin/ordermanagement/{id}/status', [OrderController::class, 'updateStatus'])->name('ordermanagement.status');

    Route::post('/logout', [AuthController::class, 'Logout']);
});
