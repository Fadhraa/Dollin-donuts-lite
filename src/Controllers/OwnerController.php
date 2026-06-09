<?php

namespace App\Controllers;

use App\Config;
use App\Auth;
use App\Inertia;
use PDO;
use Exception;

class OwnerController
{
    public function dashboard()
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $branchId = $_GET['branch_id'] ?? 'semua';
        $branchFilter = '';
        $params = [];
        if ($branchId !== 'semua') {
            $branchFilter = " AND branch_id = ?";
            $params[] = $branchId;
        }

        // Pendapatan hari ini
        $stmtToday = $db->prepare("
            SELECT SUM(total) FROM orders 
            WHERE DATE(updated_at) = CURDATE() 
              AND payment_status IN ('success', 'settlement', 'capture')
              $branchFilter
        ");
        $stmtToday->execute($params);
        $pendapatan_hari_ini = (int)$stmtToday->fetchColumn();

        // Pendapatan kemarin
        $stmtYesterday = $db->prepare("
            SELECT SUM(total) FROM orders 
            WHERE DATE(updated_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
              AND payment_status IN ('success', 'settlement', 'capture')
              $branchFilter
        ");
        $stmtYesterday->execute($params);
        $pendapatan_kemarin = (int)$stmtYesterday->fetchColumn();

        $persentase = 0;
        if ($pendapatan_kemarin > 0) {
            $persentase = (($pendapatan_hari_ini - $pendapatan_kemarin) / $pendapatan_kemarin) * 100;
        } else if ($pendapatan_hari_ini > 0) {
            $persentase = 100;
        }

        // Total orders & pending pickup
        $stmtTotal = $db->prepare("SELECT COUNT(*) FROM orders WHERE 1=1 $branchFilter");
        $stmtTotal->execute($params);
        $total_orders = (int)$stmtTotal->fetchColumn();

        $stmtPending = $db->prepare("
            SELECT COUNT(*) FROM orders 
            WHERE order_status IN ('Diproses', 'Menunggu Konfirmasi')
              $branchFilter
        ");
        $stmtPending->execute($params);
        $pending_pickup = (int)$stmtPending->fetchColumn();

        $stats = [
            'pendapatan_hari_ini' => $pendapatan_hari_ini,
            'persentase_pendapatan' => round($persentase, 1),
            'total_orders' => $total_orders,
            'pending_pickup' => $pending_pickup,
        ];

        // 5 Pesanan terbaru
        $stmtRecent = $db->prepare("
            SELECT * FROM orders 
            WHERE 1=1 $branchFilter
            ORDER BY created_at DESC LIMIT 5
        ");
        $stmtRecent->execute($params);
        $recent_orders = $stmtRecent->fetchAll();

        foreach ($recent_orders as &$ro) {
            $ro['branch'] = $ro['branch_id'] 
                ? $db->query("SELECT * FROM branches WHERE id = " . (int)$ro['branch_id'])->fetch() 
                : null;
        }

        $branches = $db->query("SELECT * FROM branches")->fetchAll();

        return Inertia::render('owner/dashboard', [
            'stats' => $stats,
            'recent_orders' => $recent_orders,
            'branches' => $branches,
            'filters' => ['branch_id' => $branchId]
        ]);
    }

    public function branches()
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $branches = $db->query("SELECT * FROM branches")->fetchAll();
        foreach ($branches as &$branch) {
            $stmtUser = $db->prepare("SELECT * FROM users WHERE branch_id = ? AND role = 'staff' LIMIT 1");
            $stmtUser->execute([$branch['id']]);
            $user = $stmtUser->fetch();
            $branch['users'] = $user ? [$user] : [];
            $branch['is_active'] = (bool)$branch['is_active'];
        }

        return Inertia::render('owner/branches', [
            'branches' => $branches
        ]);
    }

    public function storeBranch()
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $nama = $_POST['nama'] ?? '';
        $alamat = $_POST['alamat'] ?? '';
        $admin_email = $_POST['admin_email'] ?? '';
        $admin_password = $_POST['admin_password'] ?? '';
        $nohp = $_POST['nohp'] ?? '';
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;

        // Validasi Email Unik
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmtCheck->execute([$admin_email]);
        if ($stmtCheck->fetchColumn() > 0) {
            $_SESSION['flash_error'] = 'Gagal: Email admin sudah terdaftar.';
            http_response_code(303);
            header('Location: /owner/branches');
            exit;
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("INSERT INTO branches (nama, alamat, nohp, is_active, latitude, longitude, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, NOW(), NOW())");
            $stmt->execute([$nama, $alamat, $nohp, $latitude, $longitude]);
            $branchId = $db->lastInsertId();

            $hashedPassword = password_hash($admin_password, PASSWORD_DEFAULT);
            $stmtUser = $db->prepare("INSERT INTO users (name, email, password, role, branch_id, created_at, updated_at) VALUES (?, ?, ?, 'staff', ?, NOW(), NOW())");
            $stmtUser->execute(['Admin ' . $nama, $admin_email, $hashedPassword, $branchId]);

            $db->commit();
            $_SESSION['flash_success'] = 'Cabang baru berhasil ditambahkan.';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal menyimpan cabang: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/branches');
        exit;
    }

    public function updateBranch($id)
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $nama = $_POST['nama'] ?? '';
        $alamat = $_POST['alamat'] ?? '';
        $admin_email = $_POST['admin_email'] ?? '';
        $admin_password = $_POST['admin_password'] ?? '';
        $nohp = $_POST['nohp'] ?? '';
        $is_active = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;
        $latitude = $_POST['latitude'] ?? null;
        $longitude = $_POST['longitude'] ?? null;

        // Dapatkan user admin lama
        $stmtOldAdmin = $db->prepare("SELECT * FROM users WHERE branch_id = ? AND role = 'staff' LIMIT 1");
        $stmtOldAdmin->execute([$id]);
        $oldAdmin = $stmtOldAdmin->fetch();
        $userId = $oldAdmin ? $oldAdmin['id'] : 0;

        // Validasi Email Unik (kecuali punya admin cabang ini sendiri)
        $stmtCheck = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ? AND id != ?");
        $stmtCheck->execute([$admin_email, $userId]);
        if ($stmtCheck->fetchColumn() > 0) {
            $_SESSION['flash_error'] = 'Gagal: Email admin sudah digunakan oleh user lain.';
            http_response_code(303);
            header('Location: /owner/branches');
            exit;
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("UPDATE branches SET nama = ?, alamat = ?, nohp = ?, is_active = ?, latitude = ?, longitude = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$nama, $alamat, $nohp, $is_active, $latitude, $longitude, $id]);

            if ($oldAdmin) {
                $sqlUser = "UPDATE users SET name = ?, email = ?";
                $userParams = ['Admin ' . $nama, $admin_email];
                if (!empty($admin_password)) {
                    $sqlUser .= ", password = ?";
                    $userParams[] = password_hash($admin_password, PASSWORD_DEFAULT);
                }
                $sqlUser .= ", updated_at = NOW() WHERE id = ?";
                $userParams[] = $userId;

                $stmtUser = $db->prepare($sqlUser);
                $stmtUser->execute($userParams);
            } else {
                $hashedPassword = password_hash($admin_password ?: 'dollin123', PASSWORD_DEFAULT);
                $stmtUser = $db->prepare("INSERT INTO users (name, email, password, role, branch_id, created_at, updated_at) VALUES (?, ?, ?, 'staff', ?, NOW(), NOW())");
                $stmtUser->execute(['Admin ' . $nama, $admin_email, $hashedPassword, $id]);
            }

            $db->commit();
            $_SESSION['flash_success'] = 'Data cabang berhasil diperbarui.';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal memperbarui cabang: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/branches');
        exit;
    }

    public function destroyBranch($id)
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        // Cek riwayat transaksi
        $stmtOrders = $db->prepare("SELECT COUNT(*) FROM orders WHERE branch_id = ?");
        $stmtOrders->execute([$id]);
        if ($stmtOrders->fetchColumn() > 0) {
            $_SESSION['flash_error'] = 'Gagal! Cabang ini memiliki riwayat penjualan. Silakan gunakan fitur Nonaktifkan cabang agar riwayat tidak hilang.';
            http_response_code(303);
            header('Location: /owner/branches');
            exit;
        }

        $db->beginTransaction();
        try {
            $db->exec("DELETE FROM users WHERE branch_id = " . (int)$id);
            $db->exec("DELETE FROM branches WHERE id = " . (int)$id);
            $db->commit();
            $_SESSION['flash_success'] = 'Cabang berhasil dihapus secara permanen.';
        } catch (Exception $e) {
            $db->rollBack();
            $_SESSION['flash_error'] = 'Gagal menghapus cabang: ' . $e->getMessage();
        }

        http_response_code(303);
        header('Location: /owner/branches');
        exit;
    }

    public function reports()
    {
        Auth::requireRole('super_admin');
        $db = Config::db();

        $branchId = $_GET['branch_id'] ?? 'semua';
        $waktu = $_GET['waktu'] ?? 'bulan_ini';

        // Query Utama
        $sqlBase = "WHERE payment_status IN ('success', 'settlement', 'capture') AND order_status = 'Selesai'";
        $params = [];

        if ($branchId !== 'semua') {
            $sqlBase .= " AND branch_id = ?";
            $params[] = $branchId;
        }

        if ($waktu === 'hari_ini') {
            $sqlBase .= " AND DATE(updated_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $sqlBase .= " AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $sqlBase .= " AND MONTH(updated_at) = MONTH(NOW()) AND YEAR(updated_at) = YEAR(NOW())";
        }

        // 1. Total pendapatan & total pesanan
        $stmtTotal = $db->prepare("SELECT SUM(total) FROM orders $sqlBase");
        $stmtTotal->execute($params);
        $totalPendapatan = (int)$stmtTotal->fetchColumn();

        $stmtCount = $db->prepare("SELECT COUNT(*) FROM orders $sqlBase");
        $stmtCount->execute($params);
        $totalPesanan = (int)$stmtCount->fetchColumn();

        // 2. Produk Terlaris
        $sqlTop = "
            SELECT p.nama as product_name, p.gambar as product_image, oi.tipe,
                   SUM(oi.qty) as total_sold, SUM(oi.harga * oi.qty) as total_revenue
            FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.payment_status IN ('success', 'settlement', 'capture') AND o.order_status = 'Selesai'
        ";
        
        $topParams = [];
        if ($branchId !== 'semua') {
            $sqlTop .= " AND o.branch_id = ?";
            $topParams[] = $branchId;
        }
        if ($waktu === 'hari_ini') {
            $sqlTop .= " AND DATE(o.updated_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $sqlTop .= " AND o.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $sqlTop .= " AND MONTH(o.updated_at) = MONTH(NOW()) AND YEAR(o.updated_at) = YEAR(NOW())";
        }

        $sqlTop .= " GROUP BY oi.product_id, p.nama, p.gambar, oi.tipe ORDER BY total_sold DESC LIMIT 5";
        $stmtTop = $db->prepare($sqlTop);
        $stmtTop->execute($topParams);
        $topProducts = $stmtTop->fetchAll();

        // Cast top products to numeric types
        foreach ($topProducts as &$tp) {
            $tp['total_sold'] = (int)$tp['total_sold'];
            $tp['total_revenue'] = (int)$tp['total_revenue'];
        }

        // 3. Trend Harian (untuk chart)
        $trendDates = [];
        $trendRevenues = [];
        $days = ($waktu === 'minggu_ini') ? 7 : 30;

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dateLabel = date('d M', strtotime("-$i days"));

            $sqlTrend = "
                SELECT SUM(total) FROM orders 
                WHERE DATE(updated_at) = ? 
                  AND payment_status IN ('success', 'settlement', 'capture')
                  AND order_status = 'Selesai'
            ";
            $trendParams = [$date];
            if ($branchId !== 'semua') {
                $sqlTrend .= " AND branch_id = ?";
                $trendParams[] = $branchId;
            }

            $stmtTrend = $db->prepare($sqlTrend);
            $stmtTrend->execute($trendParams);
            $dailyRev = (int)$stmtTrend->fetchColumn();

            $trendDates[] = $dateLabel;
            $trendRevenues[] = $dailyRev;
        }

        // 4. Daftar Transaksi
        $stmtTx = $db->prepare("
            SELECT * FROM orders 
            $sqlBase 
            ORDER BY updated_at DESC
        ");
        $stmtTx->execute($params);
        $transactions = $stmtTx->fetchAll();

        foreach ($transactions as &$tx) {
            $tx['branch'] = $tx['branch_id'] 
                ? $db->query("SELECT id, nama FROM branches WHERE id = " . (int)$tx['branch_id'])->fetch() 
                : null;
        }

        return Inertia::render('owner/reports', [
            'branches' => $db->query("SELECT * FROM branches")->fetchAll(),
            'filters' => ['branch_id' => $branchId, 'waktu' => $waktu],
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
