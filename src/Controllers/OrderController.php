<?php

namespace App\Controllers;

use App\Config;
use App\Auth;
use App\Inertia;
use PDO;

class OrderController
{
    public function cekPesanan()
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?: $_POST;

        $nohp = $data['nohp'] ?? '';
        if (empty($nohp)) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Nomor HP harus diisi.']);
            exit;
        }

        $db = Config::db();
        $stmt = $db->prepare("SELECT * FROM orders WHERE nohp = ? ORDER BY created_at DESC");
        $stmt->execute([$nohp]);
        $orders = $stmt->fetchAll();

        if (empty($orders)) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Pesanan tidak ditemukan dengan nomor HP tersebut.']);
            exit;
        }

        // Sinkronisasi status dari Midtrans jika ada pesanan pending
        $this->syncPendingOrdersWithMidtrans($db, $orders);

        // Eager load branch, courier, dan items untuk pencarian status pesanan
        foreach ($orders as &$order) {
            $order['branch'] = $order['branch_id'] 
                ? $db->query("SELECT * FROM branches WHERE id = " . (int)$order['branch_id'])->fetch() 
                : null;

            $order['courier'] = $order['courier_id'] 
                ? $db->query("SELECT id, name, email, role FROM users WHERE id = " . (int)$order['courier_id'])->fetch() 
                : null;

            $this->loadOrderItemsAndPackages($db, $order);
        }

        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'data' => $orders]);
        exit;
    }

    private function syncPendingOrdersWithMidtrans($db, &$orders)
    {
        $serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? $_SERVER['MIDTRANS_SERVER_KEY'] ?? getenv('MIDTRANS_SERVER_KEY') ?: 'SB-Mid-server-ya6fFH8vsfyP8gET_HcYLN83';
        $isProduction = filter_var($_ENV['MIDTRANS_IS_PRODUCTION'] ?? $_SERVER['MIDTRANS_IS_PRODUCTION'] ?? getenv('MIDTRANS_IS_PRODUCTION') ?: false, FILTER_VALIDATE_BOOLEAN);
        $baseUrl = $isProduction ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';

        foreach ($orders as &$order) {
            if ($order['payment_status'] === 'pending' && !empty($order['snap_token'])) {
                // Batasi pengecekan hanya untuk pesanan yang berumur kurang dari 24 jam untuk optimasi performa
                $orderTime = strtotime($order['created_at']);
                if (time() - $orderTime > 86400) {
                    continue;
                }

                $url = $baseUrl . '/' . urlencode($order['id_pesanan']) . '/status';

                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPHEADER, [
                    'Accept: application/json',
                    'Content-Type: application/json',
                    'Authorization: Basic ' . base64_encode($serverKey . ':')
                ]);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_TIMEOUT, 2);
                $response = curl_exec($ch);
                $err = curl_error($ch);
                curl_close($ch);

                if ($err) {
                    continue;
                }

                $statusData = json_decode($response, true);
                if (isset($statusData['transaction_status'])) {
                    $transactionStatus = $statusData['transaction_status'];
                    $paymentType = $statusData['payment_type'] ?? '';
                    $transactionId = $statusData['transaction_id'] ?? '';

                    $newStatus = null;
                    if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
                        $newStatus = 'success';
                    } else if (in_array($transactionStatus, ['expire', 'cancel', 'deny'])) {
                        $newStatus = 'failed';
                    }

                    if ($newStatus !== null) {
                        $stmtUpdate = $db->prepare("
                            UPDATE orders 
                            SET payment_status = ?, 
                                payment_method = ?, 
                                midtrans_transaction_id = ?,
                                updated_at = NOW()
                            WHERE id_pesanan = ?
                        ");
                        $stmtUpdate->execute([$newStatus, $paymentType, $transactionId, $order['id_pesanan']]);

                        $order['payment_status'] = $newStatus;
                        $order['payment_method'] = $paymentType;
                        $order['midtrans_transaction_id'] = $transactionId;
                    }
                }
            }
        }
    }

    private function loadOrderItemsAndPackages($db, &$order)
    {
        $stmtItems = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
        $stmtItems->execute([$order['id']]);
        $order['items'] = $stmtItems->fetchAll();
        foreach ($order['items'] as &$item) {
            $item['product'] = $db->query("SELECT * FROM products WHERE id = " . (int)$item['product_id'])->fetch();
            if (!empty($item['isi_paket'])) {
                $ids = json_decode($item['isi_paket'], true);
                $item['isi_paket'] = [];
                if (is_array($ids) && !empty($ids)) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $stmtP = $db->prepare("SELECT id, nama, gambar, harga FROM products WHERE id IN ($placeholders)");
                    $stmtP->execute($ids);
                    $fetchedProducts = $stmtP->fetchAll();
                    
                    $prodMap = [];
                    foreach ($fetchedProducts as $fp) {
                        $prodMap[$fp['id']] = $fp;
                    }
                    
                    foreach ($ids as $id) {
                        if (isset($prodMap[$id])) {
                            $item['isi_paket'][] = $prodMap[$id];
                        }
                    }
                }
            } else {
                $item['isi_paket'] = [];
            }
        }
    }

    public function management()
    {
        Auth::requireRole(['staff', 'super_admin']);
        $user = Auth::user();
        $db = Config::db();

        $waktu = $_GET['waktu'] ?? 'semua';
        $search = $_GET['search'] ?? '';

        // Query Utama
        $sql = "SELECT * FROM orders WHERE 1=1";
        $params = [];

        if ($user['role'] === 'staff' && $user['branch_id']) {
            $sql .= " AND branch_id = ?";
            $params[] = $user['branch_id'];
        }

        // Filter Waktu
        if ($waktu === 'hari_ini') {
            $sql .= " AND DATE(created_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $sql .= " AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
        }

        if (!empty($search)) {
            $sql .= " AND (nama LIKE ? OR id_pesanan LIKE ? OR nohp LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        // Sinkronisasi status dari Midtrans jika ada pesanan pending
        $this->syncPendingOrdersWithMidtrans($db, $orders);

        // Eager load branch, items.product
        foreach ($orders as &$order) {
            $order['branch'] = $order['branch_id'] 
                ? $db->query("SELECT * FROM branches WHERE id = " . (int)$order['branch_id'])->fetch() 
                : null;

            $this->loadOrderItemsAndPackages($db, $order);
        }

        // Hitung Statistik
        $statsSql = "SELECT order_status, COUNT(*) as count FROM orders WHERE 1=1";
        $statsParams = [];
        if ($user['role'] === 'staff' && $user['branch_id']) {
            $statsSql .= " AND branch_id = ?";
            $statsParams[] = $user['branch_id'];
        }
        if ($waktu === 'hari_ini') {
            $statsSql .= " AND DATE(created_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $statsSql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $statsSql .= " AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
        }
        $statsSql .= " GROUP BY order_status";
        $stmtStats = $db->prepare($statsSql);
        $stmtStats->execute($statsParams);
        $statsRows = $stmtStats->fetchAll();

        $stats = [
            'pesanan_baru' => 0,
            'diproses' => 0,
            'selesai_hari_ini' => 0
        ];

        foreach ($statsRows as $row) {
            if ($row['order_status'] === 'Menunggu Konfirmasi') {
                $stats['pesanan_baru'] = $row['count'];
            } elseif ($row['order_status'] === 'Diproses') {
                $stats['diproses'] = $row['count'];
            } elseif ($row['order_status'] === 'Selesai') {
                $stats['selesai_hari_ini'] = $row['count'];
            }
        }

        return Inertia::render('admin/ordermanagement', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => ['waktu' => $waktu, 'search' => $search]
        ]);
    }

    public function updateStatus($id)
    {
        Auth::requireRole(['staff', 'super_admin']);
        $db = Config::db();

        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?: $_POST;
        $status = $data['status'] ?? '';

        if (!empty($status)) {
            $stmt = $db->prepare("UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$status, $id]);
            $_SESSION['flash_success'] = 'Status pesanan berhasil diperbarui.';
        }

        http_response_code(303);
        header('Location: ' . ($_SERVER['HTTP_REFERER'] ?? '/admin/ordermanagement'));
        exit;
    }

    public function transaction()
    {
        Auth::requireRole(['staff', 'super_admin']);
        $user = Auth::user();
        $db = Config::db();

        $waktu = $_GET['waktu'] ?? 'semua';
        $search = $_GET['search'] ?? '';

        $sql = "SELECT * FROM orders WHERE 1=1";
        $params = [];

        if ($user['role'] === 'staff' && $user['branch_id']) {
            $sql .= " AND branch_id = ?";
            $params[] = $user['branch_id'];
        }

        if ($waktu === 'hari_ini') {
            $sql .= " AND DATE(created_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $sql .= " AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
        }

        if (!empty($search)) {
            $sql .= " AND (nama LIKE ? OR id_pesanan LIKE ? OR nohp LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $transactions = $stmt->fetchAll();

        // Sinkronisasi status dari Midtrans jika ada pesanan pending
        $this->syncPendingOrdersWithMidtrans($db, $transactions);

        foreach ($transactions as &$tx) {
            $this->loadOrderItemsAndPackages($db, $tx);
        }

        // Hitung statistik transaksi
        $statsSql = "SELECT 
            SUM(CASE WHEN DATE(updated_at) = CURDATE() AND payment_status IN ('success', 'settlement', 'capture') THEN total ELSE 0 END) as pendapatan_hari_ini,
            COUNT(*) as jumlah_transaksi,
            SUM(CASE WHEN payment_status IN ('success', 'settlement', 'capture') THEN total ELSE 0 END) as jumlah_pendapatan,
            SUM(CASE WHEN payment_status IN ('success', 'settlement', 'capture') THEN 1 ELSE 0 END) as transaksi_selesai,
            SUM(CASE WHEN payment_status = 'failed' THEN 1 ELSE 0 END) as transaksi_dibatalkan
            FROM orders WHERE 1=1";
        
        $statsParams = [];
        if ($user['role'] === 'staff' && $user['branch_id']) {
            $statsSql .= " AND branch_id = ?";
            $statsParams[] = $user['branch_id'];
        }

        $stmtStats = $db->prepare($statsSql);
        $stmtStats->execute($statsParams);
        $statsRaw = $stmtStats->fetch();

        $stats = [
            'pendapatan_hari_ini' => (int)($statsRaw['pendapatan_hari_ini'] ?? 0),
            'jumlah_transaksi' => (int)($statsRaw['jumlah_transaksi'] ?? 0),
            'jumlah_pendapatan' => (int)($statsRaw['jumlah_pendapatan'] ?? 0),
            'transaksi_selesai' => (int)($statsRaw['transaksi_selesai'] ?? 0),
            'transaksi_dibatalkan' => (int)($statsRaw['transaksi_dibatalkan'] ?? 0),
        ];

        return Inertia::render('admin/transaction', [
            'transaction' => $transactions,
            'stats' => $stats,
            'filters' => ['waktu' => $waktu, 'search' => $search]
        ]);
    }

    public function orders()
    {
        Auth::requireRole(['staff', 'super_admin']);
        $user = Auth::user();
        $db = Config::db();

        $waktu = $_GET['waktu'] ?? 'semua';
        $search = $_GET['search'] ?? '';

        $sql = "SELECT * FROM orders WHERE 1=1";
        $params = [];

        if ($user['role'] === 'staff' && $user['branch_id']) {
            $sql .= " AND branch_id = ?";
            $params[] = $user['branch_id'];
        }

        if ($waktu === 'hari_ini') {
            $sql .= " AND DATE(created_at) = CURDATE()";
        } elseif ($waktu === 'minggu_ini') {
            $sql .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        } elseif ($waktu === 'bulan_ini') {
            $sql .= " AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
        }

        if (!empty($search)) {
            $sql .= " AND (nama LIKE ? OR id_pesanan LIKE ? OR nohp LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $sql .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();

        // Sinkronisasi status dari Midtrans jika ada pesanan pending
        $this->syncPendingOrdersWithMidtrans($db, $orders);

        foreach ($orders as &$order) {
            $order['branch'] = $order['branch_id'] 
                ? $db->query("SELECT * FROM branches WHERE id = " . (int)$order['branch_id'])->fetch() 
                : null;

            $this->loadOrderItemsAndPackages($db, $order);
        }

        // Stats
        $statsSql = "SELECT 
            SUM(CASE WHEN DATE(updated_at) = CURDATE() AND payment_status IN ('success', 'settlement', 'capture') THEN total ELSE 0 END) as pendapatan_hari_ini,
            SUM(CASE WHEN order_status = 'Diproses' THEN 1 ELSE 0 END) as diproses,
            COUNT(*) as total_pesanan
            FROM orders WHERE 1=1";
        
        $statsParams = [];
        if ($user['role'] === 'staff' && $user['branch_id']) {
            $statsSql .= " AND branch_id = ?";
            $statsParams[] = $user['branch_id'];
        }

        $stmtStats = $db->prepare($statsSql);
        $stmtStats->execute($statsParams);
        $statsRaw = $stmtStats->fetch();

        $stats = [
            'pendapatan_hari_ini' => (int)($statsRaw['pendapatan_hari_ini'] ?? 0),
            'diproses' => (int)($statsRaw['diproses'] ?? 0),
            'total_pesanan' => (int)($statsRaw['total_pesanan'] ?? 0),
        ];

        return Inertia::render('admin/orders', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => ['waktu' => $waktu, 'search' => $search]
        ]);
    }

    public function dashboard()
    {
        Auth::requireRole(['staff', 'super_admin']);
        $user = Auth::user();
        $db = Config::db();

        $statsParams = [];
        $branchFilter = '';
        if ($user['role'] === 'staff' && $user['branch_id']) {
            $branchFilter = " AND branch_id = ?";
            $statsParams[] = $user['branch_id'];
        }

        // Pendapatan hari ini
        $stmtToday = $db->prepare("
            SELECT SUM(total) FROM orders 
            WHERE DATE(updated_at) = CURDATE() 
              AND payment_status IN ('success', 'settlement', 'capture')
              $branchFilter
        ");
        $stmtToday->execute($statsParams);
        $pendapatan_hari_ini = (int)$stmtToday->fetchColumn();

        // Pendapatan kemarin
        $stmtYesterday = $db->prepare("
            SELECT SUM(total) FROM orders 
            WHERE DATE(updated_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
              AND payment_status IN ('success', 'settlement', 'capture')
              $branchFilter
        ");
        $stmtYesterday->execute($statsParams);
        $pendapatan_kemarin = (int)$stmtYesterday->fetchColumn();

        $persentase = 0;
        if ($pendapatan_kemarin > 0) {
            $persentase = (($pendapatan_hari_ini - $pendapatan_kemarin) / $pendapatan_kemarin) * 100;
        } else if ($pendapatan_hari_ini > 0) {
            $persentase = 100;
        }

        // Total orders & pending pickup
        $stmtTotal = $db->prepare("SELECT COUNT(*) FROM orders WHERE 1=1 $branchFilter");
        $stmtTotal->execute($statsParams);
        $total_orders = (int)$stmtTotal->fetchColumn();

        $stmtPending = $db->prepare("
            SELECT COUNT(*) FROM orders 
            WHERE order_status IN ('Diproses', 'Menunggu Konfirmasi')
              $branchFilter
        ");
        $stmtPending->execute($statsParams);
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
        $stmtRecent->execute($statsParams);
        $recent_orders = $stmtRecent->fetchAll();

        // Cabang-cabang jika super admin
        $branches = [];
        if ($user['role'] === 'super_admin') {
            $branches = $db->query("SELECT * FROM branches")->fetchAll();
        }

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent_orders' => $recent_orders,
            'branches' => $branches
        ]);
    }
}
