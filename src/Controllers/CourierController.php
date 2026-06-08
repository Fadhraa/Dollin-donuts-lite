<?php

namespace App\Controllers;

use App\Config;
use App\Auth;
use App\Inertia;
use PDO;
use Exception;

class CourierController
{
    // ====================================================
    // MANAJEMEN KURIR (Oleh Staff Admin Cabang)
    // ====================================================

    public function index()
    {
        Auth::requireRole('staff');
        $admin = Auth::user();
        $db = Config::db();

        $stmt = $db->prepare("SELECT id, name, email, role, branch_id FROM users WHERE branch_id = ? AND role = 'courier'");
        $stmt->execute([$admin['branch_id']]);
        $couriers = $stmt->fetchAll();

        return Inertia::render('admin/couriers', [
            'couriers' => $couriers
        ]);
    }

    public function store()
    {
        Auth::requireRole('staff');
        $admin = Auth::user();
        $db = Config::db();

        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            $_SESSION['flash_error'] = 'Nama, email, dan password wajib diisi.';
            http_response_code(303);
            header('Location: /admin/couriers');
            exit;
        }

        // Cek Email Unik
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmtCheck->execute([$email]);
        if ($stmtCheck->fetchColumn() > 0) {
            $_SESSION['flash_error'] = 'Gagal: Email sudah digunakan.';
            http_response_code(303);
            header('Location: /admin/couriers');
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (name, email, password, role, branch_id, created_at, updated_at) VALUES (?, ?, ?, 'courier', ?, NOW(), NOW())");
        $stmt->execute([$name, $email, $hashedPassword, $admin['branch_id']]);

        $_SESSION['flash_success'] = 'Kurir berhasil ditambahkan.';
        http_response_code(303);
        header('Location: /admin/couriers');
        exit;
    }

    public function update($id)
    {
        Auth::requireRole('staff');
        $admin = Auth::user();
        $db = Config::db();

        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        // Cek Keberadaan Kurir dan pastikan milik cabang yang sama
        $stmtCheckCourier = $db->prepare("SELECT * FROM users WHERE id = ? AND branch_id = ? AND role = 'courier'");
        $stmtCheckCourier->execute([$id, $admin['branch_id']]);
        if (!$stmtCheckCourier->fetch()) {
            $_SESSION['flash_error'] = 'Kurir tidak ditemukan.';
            http_response_code(303);
            header('Location: /admin/couriers');
            exit;
        }

        // Cek Email Unik (kecuali punya kurir ini sendiri)
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND id != ?");
        $stmtCheck->execute([$email, $id]);
        if ($stmtCheck->fetchColumn() > 0) {
            $_SESSION['flash_error'] = 'Gagal: Email sudah digunakan oleh user lain.';
            http_response_code(303);
            header('Location: /admin/couriers');
            exit;
        }

        $sql = "UPDATE users SET name = ?, email = ?";
        $params = [$name, $email];
        if (!empty($password)) {
            $sql .= ", password = ?";
            $params[] = password_hash($password, PASSWORD_DEFAULT);
        }
        $sql .= ", updated_at = NOW() WHERE id = ?";
        $params[] = $id;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        $_SESSION['flash_success'] = 'Data kurir berhasil diperbarui.';
        http_response_code(303);
        header('Location: /admin/couriers');
        exit;
    }

    public function destroy($id)
    {
        Auth::requireRole('staff');
        $admin = Auth::user();
        $db = Config::db();

        $stmt = $db->prepare("DELETE FROM users WHERE id = ? AND branch_id = ? AND role = 'courier'");
        $stmt->execute([$id, $admin['branch_id']]);

        $_SESSION['flash_success'] = 'Kurir berhasil dihapus.';
        http_response_code(303);
        header('Location: /admin/couriers');
        exit;
    }

    // ====================================================
    // PORTAL KURIR (Oleh Kurir Sendiri)
    // ====================================================

    public function dashboard()
    {
        Auth::requireRole('courier');
        $courier = Auth::user();
        $db = Config::db();

        // 1. Pesanan yang siap diambil kurir (dari cabang yang sama, tipe delivery)
        $stmtAvailable = $db->prepare("
            SELECT * FROM orders 
            WHERE branch_id = ? 
              AND delivery_method = 'delivery' 
              AND order_status = 'Siap Diantar' 
              AND courier_id IS NULL 
            ORDER BY created_at ASC
        ");
        $stmtAvailable->execute([$courier['branch_id']]);
        $availableOrders = $stmtAvailable->fetchAll();

        // Eager load items & branch
        $this->eagerLoadRelations($availableOrders, $db);

        // 2. Pesanan yang sedang diantar kurir ini
        $stmtActive = $db->prepare("
            SELECT * FROM orders 
            WHERE courier_id = ? 
              AND order_status = 'Sedang Dikirim' 
            ORDER BY created_at ASC
        ");
        $stmtActive->execute([$courier['id']]);
        $activeOrders = $stmtActive->fetchAll();

        $this->eagerLoadRelations($activeOrders, $db);

        // 3. Pesanan yang diselesaikan kurir ini hari ini
        $stmtCompleted = $db->prepare("
            SELECT COUNT(*) FROM orders 
            WHERE courier_id = ? 
              AND order_status = 'Selesai' 
              AND DATE(updated_at) = CURDATE()
        ");
        $stmtCompleted->execute([$courier['id']]);
        $completedToday = (int)$stmtCompleted->fetchColumn();

        return Inertia::render('courier/dashboard', [
            'availableOrders' => $availableOrders,
            'activeOrders' => $activeOrders,
            'completedToday' => $completedToday
        ]);
    }

    public function takeOrder($id)
    {
        Auth::requireRole('courier');
        $courier = Auth::user();
        $db = Config::db();

        $stmt = $db->prepare("
            UPDATE orders 
            SET courier_id = ?, 
                order_status = 'Sedang Dikirim', 
                delivery_status = 'sedang_dikirim',
                updated_at = NOW() 
            WHERE id = ? AND branch_id = ? AND courier_id IS NULL
        ");
        $stmt->execute([$courier['id'], $id, $courier['branch_id']]);

        $_SESSION['flash_success'] = 'Pesanan berhasil diambil.';
        http_response_code(303);
        header('Location: /courier/dashboard');
        exit;
    }

    public function completeOrder($id)
    {
        Auth::requireRole('courier');
        $courier = Auth::user();
        $db = Config::db();

        $stmt = $db->prepare("
            UPDATE orders 
            SET order_status = 'Selesai', 
                delivery_status = 'selesai',
                updated_at = NOW() 
            WHERE id = ? AND courier_id = ? AND order_status = 'Sedang Dikirim'
        ");
        $stmt->execute([$id, $courier['id']]);

        $_SESSION['flash_success'] = 'Pesanan berhasil diselesaikan.';
        http_response_code(303);
        header('Location: /courier/dashboard');
        exit;
    }

    private function eagerLoadRelations(&$orders, $db)
    {
        foreach ($orders as &$order) {
            $order['branch'] = $order['branch_id'] 
                ? $db->query("SELECT * FROM branches WHERE id = " . (int)$order['branch_id'])->fetch() 
                : null;

            $stmtItems = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
            $stmtItems->execute([$order['id']]);
            $order['items'] = $stmtItems->fetchAll();
            foreach ($order['items'] as &$item) {
                $item['product'] = $db->query("SELECT * FROM products WHERE id = " . (int)$item['product_id'])->fetch();
                if ($item['isi_paket']) {
                    $item['isi_paket'] = json_decode($item['isi_paket'], true);
                }
            }
        }
    }
}
