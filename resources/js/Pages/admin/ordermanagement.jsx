import AdminNav from "../layouts/admin_nav";
import { Head, router } from "@inertiajs/react";
import { useState } from "react";

function OrderManagement({ orders = [], stats = {}, filters = {} }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [filterWaktu, setFilterWaktu] = useState(filters.waktu || "semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
                                {currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-on-surface-variant">
                                            Belum ada pesanan masuk.
                                        </td>
                                    </tr>
                                ) : (
                                    currentOrders.map((order) => {
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
                    {/* Pagination */}
                    <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant/10 gap-4">
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
                </div>
            </main>
        </>
    );
}

OrderManagement.layout = page => <AdminNav children={page} />;
export default OrderManagement;
