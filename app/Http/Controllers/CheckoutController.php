<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Midtrans\Config;
use Midtrans\Snap;
use Illuminate\Support\Facades\DB; // Gunakan DB Facade

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $data = $request->all();
        DB::beginTransaction();
        try {

            $orderId = DB::table('orders')->insertGetId([
                'id_pesanan' => $data['id_pesanan'],
                'nama'       => $data['nama'],
                'nohp'       => $data['nohp'],
                'alamat'     => $data['alamat'] ?? 'Ambil di Toko',
                'total'      => $data['total'],
                'payment_status'     => 'pending',
                'order_status'   => 'Menunggu Konfirmasi',
                'branch_id'  => $data['branch_id'] ?? null,
                'payment_method' => $data['payment_method'] ?? null,
                'delivery_method' => $data['delivery_method'] ?? 'pickup',
                'delivery_fee' => $data['delivery_fee'] ?? 0,
                'delivery_status' => ($data['delivery_method'] ?? 'pickup') === 'delivery' ? 'menunggu_kurir' : null,
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);


            foreach ($data['cart'] as $item) {
                DB::table('order_items')->insert([
                    'order_id'   => $orderId,
                    'product_id' => $item['id'],
                    'qty'        => $item['qty'],
                    'harga'      => $item['harga'],
                    'tipe'       => $item['type'],
                    // Jika berisi paket (ada array contents), ubah menjadi JSON String
                    'isi_paket'  => !empty($item['contents']) ? json_encode($item['contents']) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit(); // Selesai simpan ke DB

        } catch (\Exception $e) {
            DB::rollBack(); // Batalkan semua simpanan DB jika terjadi error
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menyimpan pesanan ke database: ' . $e->getMessage()
            ], 500);
        }

        // 2. Konfigurasi Midtrans
        Config::$serverKey = env('MIDTRANS_SERVER_KEY');
        Config::$isProduction = false;
        Config::$isSanitized = true;
        Config::$is3ds = true;

        // 3. Persiapkan Parameter Transaksi
        $params = [
            'transaction_details' => [
                'order_id'     => $data['id_pesanan'],
                'gross_amount' => (int) $data['total'],
            ],
            'customer_details' => [
                'first_name' => $data['nama'],
                'phone'      => $data['nohp'],
                'address'    => $data['alamat'],
            ]
        ];

        // 3.5 Bypas/Langsung lompat ke metode pembayaran yang dipilih
        if (isset($data['payment_method'])) {
            if ($data['payment_method'] === 'qris') {
                $params['enabled_payments'] = ['gopay', 'qris'];
            } else if ($data['payment_method'] === 'bca_va') {
                $params['enabled_payments'] = ['bca_va'];
            } else if ($data['payment_method'] === 'mandiri_va') {
                $params['enabled_payments'] = ['echannel']; // echannel = Mandiri Bill/VA di Midtrans
            } else if ($data['payment_method'] === 'bni_va') {
                $params['enabled_payments'] = ['bni_va'];
            } else if ($data['payment_method'] === 'bri_va') {
                $params['enabled_payments'] = ['bri_va'];
            } else if ($data['payment_method'] === 'other_va') {
                $params['enabled_payments'] = ['other_va'];
            }
        }

        try {
            // 4. Dapatkan Snap Token dari Midtrans
            $snapToken = Snap::getSnapToken($params);

            // Simpan snap_token ke pesanan yang baru dibuat
            DB::table('orders')->where('id_pesanan', $data['id_pesanan'])->update([
                'snap_token' => $snapToken
            ]);

            return response()->json([
                'status'     => 'success',
                'snap_token' => $snapToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal terhubung ke Midtrans: ' . $e->getMessage()
            ], 500);
        }
    }
}
