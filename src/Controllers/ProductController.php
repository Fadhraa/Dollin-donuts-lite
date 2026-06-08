<?php

namespace App\Controllers;

use App\Config;
use App\Auth;
use App\Inertia;
use PDO;
use Exception;

class ProductController
{
    public function index()
    {
        Auth::requireRole(['staff', 'super_admin']);
        $user = Auth::user();
        $db = Config::db();

        if ($user['role'] === 'super_admin') {
            // Owner memanajemen seluruh katalog produk
            $stmt = $db->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll();

            foreach ($products as &$product) {
                // Get package items
                if ($product['tipe'] === 'paket') {
                    $stmtItems = $db->prepare("
                        SELECT p.* FROM products p
                        INNER JOIN package_items pi ON p.id = pi.product_id
                        WHERE pi.package_id = ?
                    ");
                    $stmtItems->execute([$product['id']]);
                    $packageItems = $stmtItems->fetchAll();
                    $product['package_items'] = $packageItems;
                    $product['packageItems'] = $packageItems;
                } else {
                    $product['package_items'] = [];
                    $product['packageItems'] = [];
                }
                $product['is_active'] = (bool)$product['is_active'];
                $product['is_favorite'] = (bool)$product['is_favorite'];
                $product['is_new'] = (bool)$product['is_new'];
            }

            // Ambil produk satuan untuk modal pilihan paket
            $stmtSatuan = $db->query("SELECT * FROM products WHERE tipe = 'satuan'");
            $satuanProducts = $stmtSatuan->fetchAll();
            foreach ($satuanProducts as &$sp) {
                $sp['is_active'] = (bool)$sp['is_active'];
                $sp['is_favorite'] = (bool)$sp['is_favorite'];
                $sp['is_new'] = (bool)$sp['is_new'];
            }

            return Inertia::render('owner/products', [
                'satuanProducts' => $satuanProducts,
                'products' => $products
            ]);
        } else {
            // Admin cabang hanya melihat produk dan mengelola stok cabangnya
            $branchId = $user['branch_id'];
            $stmt = $db->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll();

            foreach ($products as &$product) {
                $stmtStock = $db->prepare("SELECT * FROM branch_stocks WHERE product_id = ? AND branch_id = ?");
                $stmtStock->execute([$product['id'], $branchId]);
                $product['stocks'] = $stmtStock->fetchAll();

                $product['is_active'] = (bool)$product['is_active'];
                $product['is_favorite'] = (bool)$product['is_favorite'];
                $product['is_new'] = (bool)$product['is_new'];
            }

            return Inertia::render('admin/products', [
                'products' => $products
            ]);
        }
    }

    public function updateStock($id)
    {
        Auth::requireRole('staff');
        $user = Auth::user();
        $db = Config::db();

        $stock = $_POST['stock'] ?? '';
        if ($stock === '' || !is_numeric($stock) || $stock < 0) {
            $_SESSION['flash_error'] = 'Stok tidak valid.';
            http_response_code(303);
            header('Location: /admin/products');
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO branch_stocks (product_id, branch_id, stock, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE stock = ?, updated_at = NOW()
        ");
        $stmt->execute([$id, $user['branch_id'], $stock, $stock]);

        $_SESSION['flash_success'] = 'Stok berhasil diperbarui!';
        http_response_code(303);
        header('Location: /admin/products');
        exit;
    }

    public function store()
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $nama = $_POST['nama'] ?? '';
        $harga = $_POST['harga'] ?? 0;
        $stok = $_POST['stok'] ?? 0;
        $deskripsi = $_POST['deskripsi'] ?? '';
        $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;
        $is_favorite = isset($_POST['is_favorite']) ? (int)$_POST['is_favorite'] : 0;
        $is_new = isset($_POST['is_new']) ? (int)$_POST['is_new'] : 0;
        $tipe = $_POST['tipe'] ?? 'satuan';
        $kategori = $_POST['kategori'] ?? 'donuts';
        $jumlah_pilihan = !empty($_POST['jumlah_pilihan']) ? (int)$_POST['jumlah_pilihan'] : null;
        $package_items = $_POST['package_items'] ?? [];

        // Upload gambar ke Cloudinary
        $linkGambar = null;
        if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
            $linkGambar = $this->uploadImage($_FILES['gambar']);
        }

        if (empty($linkGambar)) {
            $linkGambar = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1170&auto=format&fit=crop';
        }

        // Generator kode produk otomatis
        $prefix = ($tipe === 'paket') ? 'PKT' : 'PRD';
        $kodeOtomatis = $prefix . '-' . strtoupper(bin2hex(random_bytes(3)));

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                INSERT INTO products (
                    kode_produk, nama, harga, stok, deskripsi, is_active, is_favorite, is_new,
                    tipe, kategori, gambar, jumlah_pilihan, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
                )
            ");
            $stmt->execute([
                $kodeOtomatis, $nama, $harga, $stok, $deskripsi, $is_active, $is_favorite, $is_new,
                $tipe, $kategori, $linkGambar, $jumlah_pilihan
            ]);

            $productId = $db->lastInsertId();

            // Simpan pivot package_items jika paket
            if ($tipe === 'paket' && !empty($package_items)) {
                $stmtPivot = $db->prepare("INSERT INTO package_items (package_id, product_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
                foreach ($package_items as $itemId) {
                    $stmtPivot->execute([$productId, $itemId]);
                }
            }

            $db->commit();
            $_SESSION['flash_success'] = 'Produk berhasil ditambahkan!';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal menyimpan produk: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/products');
        exit;
    }

    public function update($id)
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $nama = $_POST['nama'] ?? '';
        $harga = $_POST['harga'] ?? 0;
        $stok = $_POST['stok'] ?? 0;
        $deskripsi = $_POST['deskripsi'] ?? '';
        $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;
        $is_favorite = isset($_POST['is_favorite']) ? (int)$_POST['is_favorite'] : 0;
        $is_new = isset($_POST['is_new']) ? (int)$_POST['is_new'] : 0;
        $tipe = $_POST['tipe'] ?? 'satuan';
        $kategori = $_POST['kategori'] ?? 'donuts';
        $jumlah_pilihan = !empty($_POST['jumlah_pilihan']) ? (int)$_POST['jumlah_pilihan'] : null;
        $package_items = $_POST['package_items'] ?? [];

        // Dapatkan data produk lama
        $stmtOld = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldProduct = $stmtOld->fetch();
        if (!$oldProduct) {
            $_SESSION['flash_error'] = 'Produk tidak ditemukan.';
            http_response_code(303);
            header('Location: /owner/products');
            exit;
        }

        $linkGambar = $oldProduct['gambar'];
        if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
            $uploaded = $this->uploadImage($_FILES['gambar']);
            if ($uploaded) {
                $linkGambar = $uploaded;
            }
        }

        // Regenerate prefix kode produk jika tipe berubah
        $prefix = ($tipe === 'paket') ? 'PKT' : 'PRD';
        if ($tipe === 'satuan') {
            $kategoriPrefixes = [
                'donuts' => 'DNT',
                'mochi' => 'MCH',
                'minuman' => 'MNM',
                'pastry' => 'PST',
            ];
            $prefix = $kategoriPrefixes[$kategori] ?? 'PRD';
        }
        $potonganKode = explode('-', $oldProduct['kode_produk']);
        $kodeAcakSejarah = $potonganKode[1] ?? strtoupper(bin2hex(random_bytes(3)));
        $kodeProdukBaru = $prefix . '-' . $kodeAcakSejarah;

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("
                UPDATE products 
                SET kode_produk = ?, nama = ?, harga = ?, stok = ?, deskripsi = ?, 
                    is_active = ?, is_favorite = ?, is_new = ?, tipe = ?, kategori = ?, 
                    gambar = ?, jumlah_pilihan = ?, updated_at = NOW() 
                WHERE id = ?
            ");
            $stmt->execute([
                $kodeProdukBaru, $nama, $harga, $stok, $deskripsi, $is_active, $is_favorite, $is_new,
                $tipe, $kategori, $linkGambar, $jumlah_pilihan, $id
            ]);

            // Sync pivot table package_items
            $db->exec("DELETE FROM package_items WHERE package_id = " . (int)$id);
            if ($tipe === 'paket' && !empty($package_items)) {
                $stmtPivot = $db->prepare("INSERT INTO package_items (package_id, product_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())");
                foreach ($package_items as $itemId) {
                    $stmtPivot->execute([$id, $itemId]);
                }
            }

            $db->commit();
            $_SESSION['flash_success'] = 'Produk berhasil diperbarui!';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal memperbarui produk: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/products');
        exit;
    }

    public function destroy($id)
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $db->beginTransaction();
        try {
            $db->exec("DELETE FROM package_items WHERE package_id = " . (int)$id);
            $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $db->commit();
            $_SESSION['flash_success'] = 'Produk berhasil dihapus!';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal menghapus produk: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/products');
        exit;
    }

    private function uploadImage($file)
    {
        $cloudinaryUrl = $_ENV['CLOUDINARY_URL'] ?? $_SERVER['CLOUDINARY_URL'] ?? getenv('CLOUDINARY_URL') ?: '';
        if (!preg_match('/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/', $cloudinaryUrl, $matches)) {
            return null;
        }
        $apiKey = $matches[1];
        $apiSecret = $matches[2];
        $cloudName = $matches[3];

        $filePath = $file['tmp_name'];
        $timestamp = time();

        $params = [
            'timestamp' => $timestamp,
            'folder' => 'dollin_donuts'
        ];
        ksort($params);

        $signStr = "";
        foreach ($params as $k => $v) {
            $signStr .= "$k=$v&";
        }
        $signStr = rtrim($signStr, '&') . $apiSecret;
        $signature = sha1($signStr);

        $ch = curl_init("https://api.cloudinary.com/v1_1/$cloudName/image/upload");
        curl_setopt($ch, CURLOPT_POST, true);

        $postData = [
            'file' => new \CURLFile($filePath, $file['type'], $file['name']),
            'api_key' => $apiKey,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'folder' => 'dollin_donuts'
        ];

        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return null;
        }

        $res = json_decode($response, true);
        return $res['secure_url'] ?? null;
    }
}
