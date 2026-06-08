<?php

namespace App\Controllers;

use App\Config;
use App\Auth;
use PDO;
use Exception;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap;

class CheckoutController
{
    public function process()
    {
        // Ambil data JSON dari Axios request
        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?: $_POST;

        if (empty($data['id_pesanan']) || empty($data['nama']) || empty($data['cart'])) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'error',
                'message' => 'Data checkout tidak lengkap.'
            ]);
            exit;
        }

        $db = Config::db();
        $db->beginTransaction();

        try {
            // 1. Simpan data induk pesanan
            $stmtOrder = $db->prepare("
                INSERT INTO orders (
                    id_pesanan, nama, nohp, alamat, total, payment_status, order_status,
                    branch_id, payment_method, delivery_method, delivery_fee, delivery_status,
                    latitude, longitude, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, 'pending', 'Menunggu Konfirmasi',
                    ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
                )
            ");

            $alamat = $data['alamat'] ?? 'Ambil di Toko';
            $branchId = !empty($data['branch_id']) ? $data['branch_id'] : null;
            $paymentMethod = $data['payment_method'] ?? null;
            $deliveryMethod = $data['delivery_method'] ?? 'pickup';
            $deliveryFee = $data['delivery_fee'] ?? 0;
            $deliveryStatus = ($deliveryMethod === 'delivery') ? 'menunggu_kurir' : null;
            $latitude = $data['latitude'] ?? null;
            $longitude = $data['longitude'] ?? null;

            $stmtOrder->execute([
                $data['id_pesanan'],
                $data['nama'],
                $data['nohp'],
                $alamat,
                $data['total'],
                $branchId,
                $paymentMethod,
                $deliveryMethod,
                $deliveryFee,
                $deliveryStatus,
                $latitude,
                $longitude
            ]);

            $orderId = $db->lastInsertId();

            // 2. Simpan item-item pesanan
            $stmtItem = $db->prepare("
                INSERT INTO order_items (
                    order_id, product_id, qty, harga, tipe, isi_paket, created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, NOW(), NOW()
                )
            ");

            foreach ($data['cart'] as $item) {
                $isiPaket = !empty($item['contents']) ? json_encode($item['contents']) : null;
                $stmtItem->execute([
                    $orderId,
                    $item['id'],
                    $item['qty'],
                    $item['harga'],
                    $item['type'],
                    $isiPaket
                ]);
            }

            $db->commit();

        } catch (Exception $e) {
            $db->rollBack();
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'status'  => 'error',
                'message' => 'Gagal menyimpan pesanan ke database: ' . $e->getMessage()
            ]);
            exit;
        }

        MidtransConfig::$serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? $_SERVER['MIDTRANS_SERVER_KEY'] ?? getenv('MIDTRANS_SERVER_KEY') ?: 'SB-Mid-server-ya6fFH8vsfyP8gET_HcYLN83';
        MidtransConfig::$isProduction = filter_var($_ENV['MIDTRANS_IS_PRODUCTION'] ?? $_SERVER['MIDTRANS_IS_PRODUCTION'] ?? getenv('MIDTRANS_IS_PRODUCTION') ?: false, FILTER_VALIDATE_BOOLEAN);
        MidtransConfig::$isSanitized = filter_var($_ENV['MIDTRANS_IS_SANITIZED'] ?? $_SERVER['MIDTRANS_IS_SANITIZED'] ?? getenv('MIDTRANS_IS_SANITIZED') ?: true, FILTER_VALIDATE_BOOLEAN);
        MidtransConfig::$is3ds = filter_var($_ENV['MIDTRANS_IS_3DS'] ?? $_SERVER['MIDTRANS_IS_3DS'] ?? getenv('MIDTRANS_IS_3DS') ?: true, FILTER_VALIDATE_BOOLEAN);

        // 4. Siapkan parameter Midtrans
        $params = [
            'transaction_details' => [
                'order_id'     => $data['id_pesanan'],
                'gross_amount' => (int) $data['total'],
            ],
            'customer_details' => [
                'first_name' => $data['nama'],
                'phone'      => $data['nohp'],
                'address'    => $alamat,
            ]
        ];

        // 5. Bypass metode pembayaran terpilih ke Midtrans
        if ($paymentMethod) {
            if ($paymentMethod === 'qris') {
                $params['enabled_payments'] = ['gopay', 'qris'];
            } else if ($paymentMethod === 'bca_va') {
                $params['enabled_payments'] = ['bca_va'];
            } else if ($paymentMethod === 'mandiri_va') {
                $params['enabled_payments'] = ['echannel'];
            } else if ($paymentMethod === 'bni_va') {
                $params['enabled_payments'] = ['bni_va'];
            } else if ($paymentMethod === 'bri_va') {
                $params['enabled_payments'] = ['bri_va'];
            } else if ($paymentMethod === 'other_va') {
                $params['enabled_payments'] = ['other_va'];
            }
        }

        try {
            // Dapatkan Snap Token dari Midtrans
            $snapToken = Snap::getSnapToken($params);

            // Simpan snap_token ke database
            $stmtUpdateToken = $db->prepare("UPDATE orders SET snap_token = ? WHERE id_pesanan = ?");
            $stmtUpdateToken->execute([$snapToken, $data['id_pesanan']]);

            header('Content-Type: application/json');
            echo json_encode([
                'status'     => 'success',
                'snap_token' => $snapToken
            ]);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                'status'  => 'error',
                'message' => 'Gagal terhubung ke Midtrans: ' . $e->getMessage()
            ]);
            exit;
        }
    }
}
