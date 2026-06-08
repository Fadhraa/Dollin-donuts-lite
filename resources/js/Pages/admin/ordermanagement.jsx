import AdminNav from "../layouts/admin_nav";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";

function OrderManagement({ orders = [], stats = {}, filters = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [filterWaktu, setFilterWaktu] = useState(filters.waktu || "semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [selectedOrder, setSelectedOrder] = useState(null);

    const formatPhoneNumber = (phone) => {
        if (!phone) return "";
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            cleaned = "62" + cleaned.slice(1);
        }
        return cleaned;
    };

    const handleContactCustomer = (order) => {
        const phone = formatPhoneNumber(order.nohp);
        if (!phone) {
            alert("Nomor HP pelanggan tidak ditemukan atau tidak valid.");
            return;
        }
        const message = order.delivery_method === 'delivery'
            ? `Halo *${order.nama}*, pesanan Anda dengan ID *${order.id_pesanan}* di Dollin Donuts telah selesai dan siap diantar. Terima kasih!`
            : `Halo *${order.nama}*, pesanan Anda dengan ID *${order.id_pesanan}* di Dollin Donuts telah selesai dan siap diambil di toko. Terima kasih!`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleFilterChange = (e) => {
        const selectedWaktu = e.target.value;
        setFilterWaktu(selectedWaktu);
        router.get(
            '/admin/ordermanagement', 
            { waktu: selectedWaktu, search: searchQuery }, 
            { preserveState: true, replace: true }
        );
    };

    const filteredOrders = orders.filter((item) =>{
        if (!searchQuery) return true
        const cari = searchQuery.toLowerCase()
        return (
            item.id_pesanan.toLowerCase().includes(cari)
            || item.nama.toLowerCase().includes(cari)
        )
    });

    const indexOfLastItem = currentPage * itemsPerPage;    
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

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
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 min-w-[250px]">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
                            <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant/10 focus:border-outline-variant/50 rounded-xl text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-0 transition-all shadow-sm" placeholder="Cari pesanan..." type="text" />
                        </div>
                        <div className="relative">
                            <select 
                                value={filterWaktu}
                                onChange={handleFilterChange}
                                className="appearance-none w-full bg-surface-container-high text-primary px-6 py-3 pr-10 rounded-xl font-bold border border-transparent focus:border-outline-variant/50 focus:outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                            >
                                <option value="semua">Semua Waktu</option>
                                <option value="hari_ini">Hari Ini</option>
                                <option value="minggu_ini">7 Hari Terakhir</option>
                                <option value="bulan_ini">Bulan Ini</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                expand_more
                            </span>
                        </div>
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

                {/* Order Grid Container */}
                {currentOrders.length === 0 ? (
                    <div className="bg-surface-container-lowest p-10 rounded-2xl text-center text-on-surface-variant border border-outline-variant/10 shadow-sm mb-12">
                        Belum ada pesanan masuk.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {currentOrders.map((order) => {
                            const initials = order.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                            const displayItems = order.items.slice(0, 2);
                            const remainingItems = order.items.length - 2;

                            // Warna select beda-beda tergantung status
                            let selectColorClass = 'bg-surface-variant text-on-surface-variant border-none focus:ring-outline';
                            if (order.order_status === 'Dikonfirmasi') selectColorClass = 'bg-primary-container text-on-primary-container border-none focus:ring-primary';
                            if (order.order_status === 'Diproses') selectColorClass = 'bg-secondary-container text-on-secondary-container border-none focus:ring-secondary';
                            if (order.order_status === 'Siap Diantar') selectColorClass = 'bg-blue-100 text-blue-700 border-none focus:ring-blue-500';
                            if (order.order_status === 'Sedang Dikirim') selectColorClass = 'bg-orange-100 text-orange-700 border-none focus:ring-orange-500';
                            if (order.order_status === 'Selesai') selectColorClass = 'bg-tertiary-container text-on-tertiary-container border-none focus:ring-tertiary';

                            return (
                                <div key={order.id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                                    <div>
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2 mb-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-primary text-lg tracking-tight">{order.id_pesanan}</span>
                                                <span className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                                                    {new Date(order.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${order.delivery_method === 'delivery' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {order.delivery_method === 'delivery' ? 'Pesan Antar' : 'Ambil di Toko'}
                                            </span>
                                        </div>

                                        <hr className="border-outline-variant/10 mb-4" />

                                        {/* Customer Info */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                                                {initials}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-on-surface text-sm">{order.nama}</span>
                                                <span className="text-xs text-on-surface-variant font-medium">{order.nohp}</span>
                                            </div>
                                        </div>

                                        {/* Address (If Delivery) */}
                                        {order.delivery_method === 'delivery' && (
                                            <div className="flex items-start gap-2 mb-4 bg-surface-container-low/50 p-2.5 rounded-lg border border-outline-variant/5">
                                                <span className="material-symbols-outlined text-orange-600 text-base mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                                <p className="text-xs font-medium text-on-surface-variant leading-relaxed line-clamp-2" title={order.alamat || '-'}>
                                                    {order.alamat || '-'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Items Ordered */}
                                        <div className="mb-4">
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-outline mb-2">Item Dipesan</p>
                                            <div className="flex flex-col gap-1.5">
                                                {displayItems.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-surface-container-low px-2 py-1.5 rounded-xl border border-outline-variant/10">
                                                        {item.product?.gambar ? (
                                                            <img 
                                                                src={item.product.gambar} 
                                                                alt={item.product.nama} 
                                                                className="w-7 h-7 rounded-lg object-cover shadow-sm bg-white border border-outline-variant/30 flex-shrink-0" 
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-lg bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-[10px] flex-shrink-0">🍩</div>
                                                        )}
                                                        <span className="text-xs font-medium text-on-surface-variant truncate">
                                                            <b className="text-primary font-bold">{item.qty}x</b> {item.product?.nama || (item.tipe === 'paket' ? 'Paket Custom' : 'Produk')}
                                                        </span>
                                                    </div>
                                                ))}
                                                {remainingItems > 0 && (
                                                    <span className="text-xs text-primary font-bold ml-2 mt-0.5">+ {remainingItems} item lainnya</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 pt-4 border-t border-outline-variant/10 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Total Tagihan</span>
                                                <span className="text-lg font-black text-primary mt-0.5">
                                                    Rp {Number(order.total).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <select 
                                                value={order.order_status} 
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`text-xs font-bold px-4 py-2.5 rounded-full cursor-pointer transition-colors ${selectColorClass}`}
                                            >
                                                <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
                                                <option value="Dikonfirmasi">Dikonfirmasi</option>
                                                <option value="Diproses">Diproses</option>
                                                {order.delivery_method === 'delivery' && <option value="Siap Diantar">Siap Diantar</option>}
                                                {order.delivery_method === 'delivery' && <option value="Sedang Dikirim">Sedang Dikirim (Kurir)</option>}
                                                <option value="Selesai">Selesai</option>
                                            </select>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 w-full mt-1">
                                            {order.order_status === 'Selesai' && (
                                                <button 
                                                    onClick={() => handleContactCustomer(order)}
                                                    className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm border border-emerald-500/20 text-xs font-bold font-sans"
                                                    title="Hubungi Pelanggan via WhatsApp"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.76.45 3.41 1.25 4.86L2 22l5.31-1.39C8.71 21.4 10.3 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.33 13.06c-.19.54-.95 1.02-1.42 1.08-.39.05-.88.1-2.58-.58-2.17-.87-3.56-3.04-3.67-3.18-.11-.15-.89-1.16-.89-2.22 0-1.06.55-1.58.75-1.79.2-.21.43-.26.57-.26.14 0 .28 0 .4.01.12.01.29-.05.45.34.17.4.58 1.39.63 1.49.05.1.08.22.01.35-.07.13-.15.22-.29.39-.14.17-.3.38-.43.51-.15.15-.31.32-.13.63.18.31.78 1.29 1.68 2.09.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.63-.73.8-1 .17-.27.34-.23.57-.14.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.66-.13 1.2z" />
                                                    </svg>
                                                    Hubungi
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => setSelectedOrder(order)}
                                                className="flex-1 py-2.5 text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200/50 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 text-xs font-bold" 
                                                title="Lihat Detail Pesanan"
                                            >
                                                <span className="material-symbols-outlined text-base">visibility</span>
                                                Detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between border border-outline-variant/10 rounded-2xl shadow-sm gap-4">
                    <p className="text-sm text-on-surface-variant">
                        Menampilkan <span className="font-semibold">{filteredOrders.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)}</span> dari <span className="font-semibold">{filteredOrders.length}</span> hasil
                    </p>
                    
                    {totalPages > 0 && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${currentPage === 1 ? 'bg-surface-container border-transparent text-outline-variant cursor-not-allowed' : 'bg-surface border-outline-variant/20 hover:bg-primary-container/10 text-on-surface-variant'}`}>
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                <button 
                                    key={number}
                                    onClick={() => setCurrentPage(number)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all font-medium ${currentPage === number ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface border border-outline-variant/20 hover:bg-primary-container/10'}`}>
                                    {number}
                                </button>
                            ))}
                            
                            <button 
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${currentPage === totalPages ? 'bg-surface-container border-transparent text-outline-variant cursor-not-allowed' : 'bg-surface border-outline-variant/20 hover:bg-primary-container/10 text-on-surface-variant'}`}>
                                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Detail Pesanan */}
                                {selectedOrder && (
                                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                                        <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl border border-outline-variant/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                                            {/* Header */}
                                            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                                                <div>
                                                    <h2 className="text-xl font-extrabold text-primary header-anchor flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary">receipt_long</span>
                                                        Detail {selectedOrder.id_pesanan}
                                                    </h2>
                                                    <p className="text-[11px] text-on-surface-variant font-semibold mt-1">
                                                        Dipesan pada: {new Date(selectedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedOrder(null)} 
                                                    className="p-2 hover:bg-black/5 rounded-full transition-colors text-on-surface-variant flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                            </div>

                                            {/* Content (Scrollable) */}
                                            <div className="p-6 overflow-y-auto space-y-6">
                                                {/* Status Section */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-outline block mb-2">Status Pesanan</span>
                                                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                                                            selectedOrder.order_status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                                                            selectedOrder.order_status === 'Diproses' ? 'bg-secondary-container text-on-secondary-container' :
                                                            selectedOrder.order_status === 'Menunggu Konfirmasi' ? 'bg-surface-variant text-on-surface-variant' :
                                                            'bg-primary-container text-on-primary-container'
                                                        }`}>
                                                            {selectedOrder.order_status}
                                                        </span>
                                                    </div>
                                                    <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                                                        <span className="text-[10px] uppercase font-black tracking-wider text-outline block mb-2">Status Pembayaran</span>
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`inline-block w-fit text-xs font-bold px-3 py-1 rounded-full ${
                                                                selectedOrder.payment_status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                                selectedOrder.payment_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {selectedOrder.payment_status === 'success' ? 'Lunas' : selectedOrder.payment_status === 'pending' ? 'Menunggu Pembayaran' : 'Gagal / Dibatalkan'}
                                                            </span>
                                                            {selectedOrder.payment_method && (
                                                                <span className="text-[10px] font-bold text-on-surface-variant">
                                                                    Metode: <span className="uppercase text-primary">{selectedOrder.payment_method.replace('_va', ' VA')}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Customer Info */}
                                                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-outline mb-2">Informasi Pelanggan</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-on-surface-variant block text-xs font-medium">Nama Pelanggan</span>
                                                            <span className="font-bold text-on-surface">{selectedOrder.nama}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-on-surface-variant block text-xs font-medium">No. Telepon / WhatsApp</span>
                                                            <span className="font-bold text-on-surface">{selectedOrder.nohp}</span>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <span className="text-on-surface-variant block text-xs font-medium">Metode Pengiriman</span>
                                                            <span className="font-bold text-on-surface">{selectedOrder.delivery_method === 'delivery' ? 'Pesan Antar (Delivery)' : 'Ambil Sendiri (Pickup)'}</span>
                                                        </div>
                                                        {selectedOrder.delivery_method === 'delivery' && (
                                                            <div className="md:col-span-2">
                                                                <span className="text-on-surface-variant block text-xs font-medium">Alamat Pengantaran</span>
                                                                <p className="font-bold text-on-surface leading-relaxed text-xs">{selectedOrder.alamat}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Item List */}
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-outline">Daftar Item Dipesan</h3>
                                                    <div className="space-y-3">
                                                        {selectedOrder.items.map((item, index) => {
                                                            const subTotalItem = item.harga * item.qty;
                                                            
                                                            // Group isi paket untuk merender bento list
                                                            const packageCounts = {};
                                                            if (item.tipe === 'paket' && Array.isArray(item.isi_paket)) {
                                                                item.isi_paket.forEach(p => {
                                                                    if (p && p.id) {
                                                                        packageCounts[p.id] = {
                                                                            nama: p.nama,
                                                                            gambar: p.gambar,
                                                                            count: (packageCounts[p.id]?.count || 0) + 1
                                                                        };
                                                                    }
                                                                });
                                                            }
                                                            const groupedPackageItems = Object.values(packageCounts);

                                                            return (
                                                                <div key={index} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                                                                    <div className="flex gap-4 items-start justify-between">
                                                                        <div className="flex gap-3 items-center">
                                                                            <img 
                                                                                src={item.product?.gambar || '🍩'} 
                                                                                alt={item.product?.nama} 
                                                                                className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white border border-outline-variant/30 flex-shrink-0"
                                                                            />
                                                                            <div>
                                                                                <h4 className="font-bold text-primary text-sm leading-snug">{item.product?.nama || 'Produk'}</h4>
                                                                                <span className="text-xs text-on-surface-variant font-medium">
                                                                                    {item.qty}x @ Rp {Number(item.harga).toLocaleString('id-ID')}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-extrabold text-primary text-sm whitespace-nowrap">
                                                                            Rp {subTotalItem.toLocaleString('id-ID')}
                                                                        </span>
                                                                    </div>

                                                                    {/* Rendering isi paket custom jika tipe paket */}
                                                                    {item.tipe === 'paket' && groupedPackageItems.length > 0 && (
                                                                        <div className="mt-4 pt-3 border-t border-outline-variant/10">
                                                                            <span className="text-[10px] font-black text-outline uppercase tracking-wider block mb-2">Pilihan Isi Box:</span>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                {groupedPackageItems.map((gItem, idx) => (
                                                                                    <div key={idx} className="flex items-center gap-2 bg-white/60 dark:bg-surface-container-highest/20 p-2 rounded-xl border border-outline-variant/5">
                                                                                        <img 
                                                                                            src={gItem.gambar} 
                                                                                            alt={gItem.nama} 
                                                                                            className="w-8 h-8 rounded-lg object-cover shadow-sm bg-white border border-outline-variant/30 flex-shrink-0"
                                                                                        />
                                                                                        <span className="text-xs font-semibold text-on-surface-variant truncate">
                                                                                            <b className="text-primary font-bold">{gItem.count}x</b> {gItem.nama}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Rincian Harga Tagihan */}
                                                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10">
                                                    <h3 className="text-xs font-black uppercase tracking-wider text-outline mb-3">Rincian Pembayaran</h3>
                                                    <div className="space-y-2 text-xs font-medium text-on-surface-variant">
                                                        <div className="flex justify-between items-center">
                                                            <span>Total Item</span>
                                                            <span className="text-on-surface font-bold">
                                                                Rp {selectedOrder.items.reduce((acc, item) => acc + (item.harga * item.qty), 0).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Biaya Admin (1%)</span>
                                                            <span className="text-on-surface font-bold">
                                                                Rp {(selectedOrder.items.reduce((acc, item) => acc + (item.harga * item.qty), 0) * 0.01).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Ongkos Kirim</span>
                                                            <span className="text-on-surface font-bold">
                                                                {Number(selectedOrder.delivery_fee) > 0 ? `Rp ${Number(selectedOrder.delivery_fee).toLocaleString('id-ID')}` : 'Gratis'}
                                                            </span>
                                                        </div>
                                                        <hr className="border-outline-variant/10 my-2" />
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="font-bold text-primary">Total Tagihan</span>
                                                            <span className="font-black text-primary text-base">
                                                                Rp {Number(selectedOrder.total).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3">
                                                <button 
                                                    onClick={() => setSelectedOrder(null)} 
                                                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-200/50 text-stone-600 hover:text-stone-800 rounded-xl transition-all font-bold text-xs"
                                                >
                                                    Tutup
                                                </button>
                                                <button 
                                                    onClick={() => handleContactCustomer(selectedOrder)}
                                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-500/10"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.76.45 3.41 1.25 4.86L2 22l5.31-1.39C8.71 21.4 10.3 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.33 13.06c-.19.54-.95 1.02-1.42 1.08-.39.05-.88.1-2.58-.58-2.17-.87-3.56-3.04-3.67-3.18-.11-.15-.89-1.16-.89-2.22 0-1.06.55-1.58.75-1.79.2-.21.43-.26.57-.26.14 0 .28 0 .4.01.12.01.29-.05.45.34.17.4.58 1.39.63 1.49.05.1.08.22.01.35-.07.13-.15.22-.29.39-.14.17-.3.38-.43.51-.15.15-.31.32-.13.63.18.31.78 1.29 1.68 2.09.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.63-.73.8-1 .17-.27.34-.23.57-.14.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.66-.13 1.2z" />
                                                    </svg>
                                                    Hubungi via WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </main>
                        </>
                    );
                }

OrderManagement.layout = page => <AdminNav children={page} />;
export default OrderManagement;
