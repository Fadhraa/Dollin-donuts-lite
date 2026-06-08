import AdminNav from "../layouts/admin_nav";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import dayjs from "dayjs";

function Orders({ orders = [], stats = [], filters = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [filterWaktu, setFilterWaktu] = useState(filters.waktu || "semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
            '/admin/orders', 
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
    const indexOfFirstItem =  indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    console.log(currentOrders)
    return (
        <>
            <Head>
                <title>Manajemen Pesanan</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <style>{`
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                body { background-color: #fef6e7; font-family: 'Be Vietnam Pro', sans-serif;}
                h1, h2, h3, .brand-logo { font-family: 'Plus Jakarta Sans', sans-serif; }
            `}</style>

            <main className="flex-grow px-8 py-10 max-w-[1920px] mx-auto w-full text-on-surface">
                {/* Dashboard Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold text-primary mb-8 tracking-tight brand-logo">Manajemen Pesanan</h1>
                    
                    {/* Revenue Summary Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-surface-container-low p-6 rounded-lg shadow-sm border border-outline-variant/10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-on-surface-variant mb-1">Pendapatan Hari Ini</p>
                                <p className="text-3xl font-bold text-primary">Rp {Number(stats.pendapatan_hari_ini || 0).toLocaleString('id-ID')}</p>
                            </div>
                            <div className="h-12 w-12 bg-primary-container rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-primary-container">payments</span>
                            </div>
                        </div>
                        <div className="bg-surface-container-low p-6 rounded-lg shadow-sm border border-outline-variant/10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-on-surface-variant mb-1">Pesanan Diproses</p>
                                <p className="text-3xl font-bold text-primary">{stats.diproses || 0}</p>
                            </div>
                            <div className="h-12 w-12 bg-secondary-container rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-secondary-container">shopping_bag</span>
                            </div>
                        </div>
                        <div className="bg-surface-container-low p-6 rounded-lg shadow-sm border border-outline-variant/10 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-on-surface-variant mb-1">Pesanan</p>
                                <p className="text-3xl font-bold text-primary">{stats.total_pesanan || 0}</p>
                            </div>
                            <div className="h-12 w-12 bg-tertiary-container rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-tertiary-container">local_shipping</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Table Container */}
                <div className="bg-surface shadow-[0_4px_30px_rgba(50,46,37,0.04)] rounded-lg overflow-hidden border border-outline-variant/10">
                    <div className="overflow-x-auto">
                        <div className="bg-surface-container-high flex justify-between items-center p-4">
                            {/* search bar */}
                            <div className="relative flex-1 max-w-md">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
                                <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 bg-surface-container-low border border-outline-variant/10 focus:border-outline-variant/50  rounded-full text-on-surface placeholder:text-outline-variant focus:ring-0  transition-all transition-shadow duration-200"
                                placeholder="Cari berdasarkan id pesanan..." 
                                type="text" />
                            </div>
                            {/* Filter Waktu */}
                            <div className="relative">
                                <select 
                                    value={filterWaktu}
                                    onChange={handleFilterChange}
                                    className="appearance-none bg-surface-container text-sm text-on-surface font-bold px-4 py-2 pr-10 rounded-full border border-outline-variant/20 focus:border-primary focus:ring-0 cursor-pointer outline-none transition-all"
                                >
                                    <option value="semua">Semua Waktu</option>
                                    <option value="hari_ini">Hari Ini</option>
                                    <option value="minggu_ini">7 Hari Terakhir</option>
                                    <option value="bulan_ini">Bulan Ini</option>
                                </select>
                           
                            </div>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-high/50 text-on-surface-variant font-medium text-sm">
                                    <th className="px-8 py-5">Detail Pesanan</th>
                                    <th className="px-6 py-5">Item Dibeli</th>
                                    <th className="px-6 py-5">Tanggal & Waktu</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Total Tagihan</th>
                                    <th className="px-8 py-5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-8 py-10 text-center text-on-surface-variant">
                                            Belum ada pesanan masuk.
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrders.map((order, index) => {
                                        const initials = order.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                                        
                                        return (
                                            <tr key={index} className="hover:bg-surface-container-low transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="font-bold text-primary text-base brand-logo">
                                                            {/* Menambahkan qty di depan nama produk pertama */}
                                                            {order.items.length > 0 ? `${order.items[0].qty}x ${order.items[0].product.nama}` : 'Pesanan'}
                                                            
                                                            {/* Menampilkan sisa macam produk lainnya (jika ada) */}
                                                            {order.items.length > 1 ? ` +${order.items.length - 1} macam lainnya` : ''}
                                                        </p>
                                                        <p className="text-xs text-on-surface-variant font-mono mb-1.5">#{order.id_pesanan}</p>
                                                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${order.delivery_method === 'delivery' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {order.delivery_method === 'delivery' ? 'Pesan Antar' : 'Ambil di Toko'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex -space-x-3 py-1 pr-2">
                                                        {order.items.slice(0, 2).map((item, idx) => (
                                                            <div key={idx} className="relative inline-block">
                                                                {item.product.gambar ? (
                                                                    <img className="inline-block h-10 w-10 rounded-full ring-2 ring-surface object-cover bg-white" alt={item.product.nama} src={`${item.product.gambar}`} />
                                                                ) : (
                                                                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest ring-2 ring-surface text-lg">🍩</div>
                                                                )}
                                                                
                                                                {/* Menambahkan Badge Qty Kecil di Atas Gambar */}
                                                                {item.qty > 1 && (
                                                                    <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-surface z-10">
                                                                        {item.qty}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {order.items.length > 2 && (
                                                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest ring-2 ring-surface text-[10px] font-bold text-on-surface-variant z-0">
                                                                +{order.items.length - 2}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="text-sm">
                                                        <p className="font-medium">{dayjs(order.created_at).format('MMM DD, YYYY')}</p>
                                                        <p className="text-on-surface-variant text-xs">{dayjs(order.created_at).format('hh:mm A')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        order.order_status === 'Selesai' ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary/10' :
                                                        order.order_status === 'Sedang Dikirim' ? 'bg-orange-100 text-orange-700 border border-orange-500/20' :
                                                        order.order_status === 'Siap Diantar' ? 'bg-blue-100 text-blue-700 border border-blue-500/20' :
                                                        order.order_status === 'Diproses' ? 'bg-primary-container text-on-primary-container border border-primary/10' :
                                                        'bg-secondary-container text-on-secondary-container border border-secondary/10'
                                                    }`}>
                                                        {order.order_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="font-bold text-primary">Rp {order.total.toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {order.order_status === 'Selesai' && (
                                                            <button 
                                                                onClick={() => handleContactCustomer(order)}
                                                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 hover:text-emerald-700 rounded-xl transition-all duration-200 inline-flex items-center gap-1.5 shadow-sm border border-emerald-500/20"
                                                                title="Hubungi Pelanggan via WhatsApp"
                                                            >
                                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.76.45 3.41 1.25 4.86L2 22l5.31-1.39C8.71 21.4 10.3 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm4.33 13.06c-.19.54-.95 1.02-1.42 1.08-.39.05-.88.1-2.58-.58-2.17-.87-3.56-3.04-3.67-3.18-.11-.15-.89-1.16-.89-2.22 0-1.06.55-1.58.75-1.79.2-.21.43-.26.57-.26.14 0 .28 0 .4.01.12.01.29-.05.45.34.17.4.58 1.39.63 1.49.05.1.08.22.01.35-.07.13-.15.22-.29.39-.14.17-.3.38-.43.51-.15.15-.31.32-.13.63.18.31.78 1.29 1.68 2.09.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.63-.73.8-1 .17-.27.34-.23.57-.14.23.09 1.47.69 1.72.82.25.13.42.19.48.3.06.11.06.66-.13 1.2z" />
                                                                </svg>
                                                                <span className="text-xs font-bold font-sans">Hubungi</span>
                                                            </button>
                                                        )}
                                                        <button className="p-2 hover:bg-primary-container/20 rounded-full text-primary transition-all" title="Lihat Detail Pesanan">
                                                            <span className="material-symbols-outlined">visibility</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                   {/* Pagination */}
                    <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/10 gap-4">
                        <p className="text-sm text-on-surface-variant">
                            Menampilkan <span className="font-semibold">{filteredOrders.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrders.length)}</span> dari <span className="font-semibold">{filteredOrders.length}</span> hasil
                        </p>
                        
                        {totalPages > 0 && (
                            <div className="flex items-center gap-2">
                                {/* Tombol Mundur (<) */}
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${currentPage === 1 ? 'bg-surface-container border-transparent text-outline-variant cursor-not-allowed' : 'bg-surface border-outline-variant/20 hover:bg-primary-container/10 text-on-surface-variant'}`}>
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                
                                {/* Looping Tombol Angka (1, 2, 3...) */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button 
                                        key={number}
                                        onClick={() => setCurrentPage(number)}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all font-medium ${currentPage === number ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'bg-surface border border-outline-variant/20 hover:bg-primary-container/10'}`}>
                                        {number}
                                    </button>
                                ))}
                                
                                {/* Tombol Maju (>) */}
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${currentPage === totalPages ? 'bg-surface-container border-transparent text-outline-variant cursor-not-allowed' : 'bg-surface border-outline-variant/20 hover:bg-primary-container/10 text-on-surface-variant'}`}>
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

Orders.layout = page => <AdminNav children={page} />;
export default Orders;

