import AdminNav from "../layouts/admin_nav";
import { Head, router } from "@inertiajs/react";

function OrderManagement({ orders = [], stats = {} }) {
    console.log(orders)
    // Fungsi untuk memperbarui status pesanan ke database
    const handleStatusChange = (orderId, newStatus) => {
        router.patch(`/admin/ordermanagement/${orderId}/status`, {
            status: newStatus
        }, {
            preserveScroll: true,
            onSuccess: () => {
                // Tampilkan notifikasi (opsional, bisa diimplementasikan nanti)
            }
        });
    };

    return (
        <>
            <Head>
                <title>Dollin Donuts Admin - Pengelolaan Pesanan</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <style>{`
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                body {
                    background-color: #fef6e7;
                    color: #322e25;
                    font-family: 'Be Vietnam Pro', sans-serif;
                }
                .header-anchor {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                }
            `}</style>

            <main className="pt-12 pb-12 px-6 md:px-10 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight header-anchor mb-2">Pengelolaan Pesanan</h1>
                        <p className="text-on-surface-variant font-medium max-w-2xl leading-relaxed">Sistem pemantauan untuk memproses pesanan donat artisanal. Pastikan setiap glasir sempurna dan setiap pengiriman segar.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-surface-container-high text-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-surface-variant transition-all active:scale-95">
                            <span className="material-symbols-outlined">filter_list</span> Filter
                        </button>
                        <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                            <span className="material-symbols-outlined">download</span> Ekspor Laporan
                        </button>
                    </div>
                </header>

                {/* Quick Stats Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-surface-container-low p-8 rounded-lg flex items-center justify-between shadow-sm border border-outline-variant/10">
                        <div>
                            <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest mb-1">Total Menunggu</p>
                            <h3 className="text-4xl font-extrabold text-primary header-anchor">{stats.pesanan_baru || 0}</h3>
                        </div>
                        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
                        </div>
                    </div>
                    <div className="bg-secondary-container p-8 rounded-lg flex items-center justify-between shadow-sm border border-outline-variant/10">
                        <div>
                            <p className="text-on-secondary-container text-sm font-semibold uppercase tracking-widest mb-1">Dalam Proses</p>
                            <h3 className="text-4xl font-extrabold text-on-secondary-container header-anchor">{stats.diproses || 0}</h3>
                        </div>
                        <div className="w-16 h-16 bg-on-secondary-container rounded-full flex items-center justify-center text-on-secondary">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>outdoor_grill</span>
                        </div>
                    </div>
                    <div className="bg-tertiary-container p-8 rounded-lg flex items-center justify-between shadow-sm border border-outline-variant/10">
                        <div>
                            <p className="text-on-tertiary-container text-sm font-semibold uppercase tracking-widest mb-1">Selesai Hari Ini</p>
                            <h3 className="text-4xl font-extrabold text-on-tertiary-container header-anchor">{stats.selesai_hari_ini || 0}</h3>
                        </div>
                        <div className="w-16 h-16 bg-on-tertiary-container rounded-full flex items-center justify-center text-on-tertiary">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                    </div>
                </div>

                {/* Order Table Container */}
                <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden border border-outline-variant/10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low">
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">ID Pesanan</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Pelanggan</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Alamat</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Item Dipesan</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Tanggal Pesanan</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Total Harga</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-on-surface-variant">
                                            Belum ada pesanan masuk.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        // Buat inisial nama

                                        const initials = order.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                        
                                        // Ekstrak item (maks 2 yang ditampilkan lengkap)
                                        const displayItems = order.items.slice(0, 2);
                                        const remainingItems = order.items.length - 2;
                                    
                                     
                                        // Warna select beda-beda tergantung status
                                        let selectColorClass = 'bg-surface-variant text-on-surface-variant border-none focus:ring-outline';
                                        if (order.order_status === 'Dikonfirmasi') selectColorClass = 'bg-primary-container text-on-primary-container border-none focus:ring-primary';
                                        if (order.order_status === 'Diproses') selectColorClass = 'bg-secondary-container text-on-secondary-container border-none focus:ring-secondary';
                                        if (order.order_status === 'Selesai') selectColorClass = 'bg-tertiary-container text-on-tertiary-container border-none focus:ring-tertiary';

                                        return (
                                            <tr key={order.id} className="hover:bg-surface-bright transition-colors group">
                                                <td className="px-6 py-6 font-bold text-primary">{order.id_pesanan}</td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                                                            {initials}
                                                        </div>
                                                        <span className="font-semibold text-on-surface">{order.nama}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="text-sm font-medium text-on-surface-variant max-w-[150px] truncate" title={order.alamat || '-'}>
                                                        {order.alamat || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col gap-1 max-w-xs">
                                                        {displayItems.map((item, idx) => (
                                                            <span key={idx} className="inline-flex items-center gap-2 text-sm bg-surface-container-high px-1 py-1 pr-4 rounded-full text-on-surface-variant font-medium">
                                                                
                                                                {/* Menampilkan Gambar Produk */}
                                                                {item.product?.gambar ? (
                                                                    <img 
                                                                        src={item.product.gambar} 
                                                                        alt={item.product.nama} 
                                                                        className="w-7 h-7 rounded-full object-cover shadow-sm bg-white border border-outline-variant/30" 
                                                                    />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-[10px]">🍩</div>
                                                                )}
                                                                <b className="text-primary ml-1">{item.qty}x</b> 
                                                                {item.product?.nama || (item.tipe === 'paket' ? 'Paket Custom' : 'Produk')}
                                                            </span>
                                                        ))}
                                                        {remainingItems > 0 && (
                                                            <span className="text-xs text-primary font-bold ml-2 mt-1">+ {remainingItems} item lainnya</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-sm text-on-surface-variant">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="px-6 py-6 font-bold text-on-surface">
                                                    Rp {Number(order.total).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-6">
                                                    <select 
                                                        value={order.order_status} 
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className={`text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-colors ${selectColorClass}`}
                                                    >
                                                        <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                                        <option value="Dikonfirmasi">Dikonfirmasi</option>
                                                        <option value="Diproses">Diproses</option>
                                                        <option value="Selesai">Selesai</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <button className="p-2 text-stone-400 hover:text-primary transition-colors" title="Lihat Detail Pesanan">
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Table Pagination/Footer */}
                    <div className="px-6 py-5 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
                        <span className="text-xs font-medium text-on-surface-variant">Menampilkan {orders.length} pesanan artisan</span>
                        {/* Pagination placeholder, can be implemented with Inertia later */}
                    </div>
                </div>
            </main>
        </>
    );
}

OrderManagement.layout = page => <AdminNav children={page} />;
export default OrderManagement;
