<?php

namespace App\Controllers;

use App\Config;
use App\Inertia;
use PDO;

class LandingController
{
    public function index()
    {
        $db = Config::db();

        // 1. Ambil semua cabang yang aktif
        $stmtBranch = $db->query("SELECT * FROM branches WHERE is_active = 1");
        $branches = $stmtBranch->fetchAll();

        // 2. Ambil semua produk yang aktif
        $stmtProduct = $db->query("SELECT * FROM products WHERE is_active = 1");
        $products = $stmtProduct->fetchAll();

        // 3. Pasangkan stok per cabang dan isi paket untuk masing-masing produk
        foreach ($products as &$product) {
            // Ambil data stok cabang
            $stmtStock = $db->prepare("SELECT * FROM branch_stocks WHERE product_id = ?");
            $stmtStock->execute([$product['id']]);
            $product['stocks'] = $stmtStock->fetchAll();

            // Jika tipe produk adalah paket, ambil item donat yang tersedia di dalam paket tersebut
            if ($product['tipe'] === 'paket') {
                $stmtPackage = $db->prepare("
                    SELECT p.* FROM products p
                    INNER JOIN package_items pi ON p.id = pi.product_id
                    WHERE pi.package_id = ? AND p.is_active = 1
                ");
                $stmtPackage->execute([$product['id']]);
                $packageItems = $stmtPackage->fetchAll();
                
                // Set keduanya (camelCase dan snake_case) untuk kompatibilitas frontend
                $product['package_items'] = $packageItems;
                $product['packageItems'] = $packageItems;
            } else {
                $product['package_items'] = [];
                $product['packageItems'] = [];
            }

            // Cast boolean fields agar bertipe boolean di JS (penting!)
            $product['is_active'] = (bool)$product['is_active'];
            $product['is_favorite'] = (bool)$product['is_favorite'];
            $product['is_new'] = (bool)$product['is_new'];
        }

        // Pastikan cabang juga ter-cast is_active-nya
        foreach ($branches as &$branch) {
            $branch['is_active'] = (bool)$branch['is_active'];
        }

        return Inertia::render('Main', [
            'products' => $products,
            'branches' => $branches
        ]);
    }
}
