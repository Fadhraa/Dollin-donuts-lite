<?php

namespace App\Controllers;

use App\Config;
use PDO;

class WebhookController
{
    public function handler()
    {
        // Baca data JSON notifikasi dari Midtrans
        $input = file_get_contents('php://input');
        $data = json_decode($input, true) ?: $_POST;

        if (empty($data)) {
            http_response_code(400);
            echo "Empty request payload.";
            exit;
        }

        $serverKey = $_ENV['MIDTRANS_SERVER_KEY'] ?? $_SERVER['MIDTRANS_SERVER_KEY'] ?? getenv('MIDTRANS_SERVER_KEY') ?: 'SB-Mid-server-ya6fFH8vsfyP8gET_HcYLN83';
        $orderId = $data['order_id'] ?? '';
        $statusCode = $data['status_code'] ?? '';
        $grossAmount = $data['gross_amount'] ?? '';
        $signatureKey = $data['signature_key'] ?? '';
        $transactionStatus = $data['transaction_status'] ?? '';
        $paymentType = $data['payment_type'] ?? '';
        $transactionId = $data['transaction_id'] ?? '';

        // Verifikasi Signature Key dari Midtrans
        $mySignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        if ($mySignature !== $signatureKey) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['message' => 'Invalid Signature. Akses Ditolak!']);
            exit;
        }

        $db = Config::db();

        // Update status pembayaran di database
        if ($transactionStatus === 'capture' || $transactionStatus === 'settlement') {
            $stmt = $db->prepare("
                UPDATE orders 
                SET payment_status = 'success', 
                    payment_method = ?, 
                    midtrans_transaction_id = ?,
                    updated_at = NOW()
                WHERE id_pesanan = ?
            ");
            $stmt->execute([$paymentType, $transactionId, $orderId]);
        } else if (in_array($transactionStatus, ['expire', 'cancel', 'deny'])) {
            $stmt = $db->prepare("
                UPDATE orders 
                SET payment_status = 'failed', 
                    payment_method = ?, 
                    midtrans_transaction_id = ?,
                    updated_at = NOW()
                WHERE id_pesanan = ?
            ");
            $stmt->execute([$paymentType, $transactionId, $orderId]);
        }

        header('Content-Type: application/json');
        echo json_encode(['message' => 'Notifikasi berhasil diproses oleh PHP Native.']);
        exit;
    }
}
