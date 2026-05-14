import AdminNav from "../layouts/admin_nav";
import { Head, router } from "@inertiajs/react";
import {useState} from "react";
import dayjs from "dayjs";

function Transaction({ transaction ={}, stats=[], filters={} }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [filterWaktu, setFilterWaktu] = useState(filters.waktu || "semua");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
     const handleFilterChange = (e) => {
        const selectedWaktu = e.target.value;
        setFilterWaktu(selectedWaktu);
        
        // Tembak request ke backend Inertia secara diam-diam
        router.get(
            '/admin/transaction', // Pastikan route ini sesuai dengan route halaman transaksi kamu
            { waktu: selectedWaktu, search: searchQuery }, 
            { preserveState: true, replace: true }
        );
    };
    const filteredTransaction = transaction.filter((item) =>{
        if (!searchQuery) return true
        const cari = searchQuery.toLowerCase()
        return (
            item.id_pesanan.toLowerCase().includes(cari)
            || item.nama.toLowerCase().includes(cari)
        )
    });
    const indexOfLastItem = currentPage * itemsPerPage;    
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransaction.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTransaction.length / itemsPerPage);
    console.log(currentTransactions);
    console.log(transaction);   
    return (
        <>
            <Head>
                <title>Riwayat Transaksi</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            <style>{`
                body {
                    background-color: #fef6e7;
                    color: #322e25;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    -webkit-font-smoothing: antialiased;
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                    vertical-align: middle;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8f0e0; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dcd4c0; border-radius: 10px; }
            `}</style>

            <main className="pt-12 pb-12 px-6 md:px-12 max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary tracking-tight">Riwayat Transaksi</h1>
                        <p className="text-on-surface-variant font-medium">Kelola dan audit penjualan donat artisan Anda.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow-lg hover:scale-[0.98] transition-transform flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]" data-icon="download">download</span>
                            Ekspor CSV
                        </button>
                    </div>
                </header>

                {/* Quick Stats Bento Grid (Only 2 cards) */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-low p-8 rounded-lg space-y-4 shadow-sm border border-outline-variant/10">
                        <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant font-medium uppercase tracking-wider text-xs">Pendapatan Hari Ini</span>
                            <span className="material-symbols-outlined text-primary" data-icon="payments">payments</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold font-headline text-primary">Rp {Number(stats.jumlah_pendapatan || 0).toLocaleString('id-ID')}</span>
                          
                        </div>
                    </div>
                    <div className="bg-surface-container-low p-8 rounded-lg space-y-4 shadow-sm border border-outline-variant/10">
                        <div className="flex items-center justify-between">
                            <span className="text-on-tertiary-fixed-variant font-medium uppercase tracking-wider text-xs">Jumlah Transaksi Selesai</span>
                            <span className="material-symbols-outlined text-on-tertiary-fixed-variant" data-icon="receipt_long">receipt_long</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold font-headline text-on-tertiary-fixed-variant">{stats.transaksi_selesai}</span>
                      
                        </div>
                    </div>
                </section>

                {/* Filters & Table Section */}
                <section className="bg-surface-container-lowest rounded-lg shadow-[0_8px_40px_rgba(50,46,37,0.06)] overflow-hidden border border-outline-variant/5">
                    {/* Filter Bar */}
                    <div className="p-6 bg-surface-container/50 border-b border-outline-variant/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
                            <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-full text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Cari berdasarkan id pesanan..." type="text" />
                        </div>
                        {/* Dropdown Filter */}
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
                            {/* Ikon Panah Bawah */}
                            <span className="material-symbols-outlined text-gray-500 text-on-surface-variant pointer-events-none text-lg">
                          
                            </span>
                        </div>

                    </div>

                    {/* Table Container (Updated Columns) */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container/30">
                                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 font-headline">Detail Transaksi</th>
                                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 font-headline text-center">Metode Transaksi</th>
                                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 font-headline text-center">Tanggal & Waktu</th>
                                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 font-headline text-center">Status</th>
                                    <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 font-headline text-right">Jumlah Transaksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {/* Row 1 */}
                                {filteredTransaction.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-on-surface-variant">
                                            Tidak ada transaksi ditemukan
                                        </td>
                                    </tr>
                                ) : currentTransactions.map((item, index) => (
                                    <tr className="hover:bg-surface-container/10 transition-colors group" key ={index}>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-primary mb-0.5">{item.id_pesanan}</div>
                                            <div>{item.items.map((p, i) => (
                                                <span key={i} className="text-on-surface-variant text-sm"> {p.qty}x {p.product.nama} {i < item.items.length - 1 ? ', ' : ''}</span>
                                            ))}</div>
                                     
                                        </td>
                                        <td className="px-6 py-5 text-center"> 
                                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container rounded-full text-[12px] font-bold text-on-surface-variant border border-outline-variant/20">
                                              <span className="material-symbols-outlined text-[16px]" data-icon={item.payment_method == 'qris' ? 'qr_code' : item.payment_method == 'bank_transfer' ? 'account_balance' : 'money'}>{item.payment_method == 'qris' ? 'qr_code_2' : item.payment_method == 'bank_transfer' ? 'account_balance' : 'money'}</span> 
                                              {item.payment_method == 'qris' ? 'QRIS' : item.payment_method == 'bank_transfer' ? 'Bank Transfer' : 'Cash'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center"> 
                                            <span>{dayjs(item.created_at).format('DD MMM YYYY')}</span>
                                            <span className="block text-sm text-on-surface-variant">{dayjs(item.created_at).format('HH:mm')}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center"> 
                                            {item.payment_status === 'success' ? (
                                                <div className="inline-block px-4 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold">Berhasil</div>
                                            ) : item.payment_status === 'failed' ? (
                                                <div className="inline-block px-4 py-1.5 rounded-full bg-error/10 text-error text-xs font-bold">Gagal</div>
                                            ) : item.payment_status === 'pending' ? (
                                                <div className="inline-block px-4 py-1.5 rounded-full bg-outline-variant text-on-tertiary-container text-xs font-bold">Pending</div>
                                            ) : (
                                                <div className="inline-block px-4 py-1.5 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold">Pending</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 font-bold text-primary text-right">Rp {item.total.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-5 bg-surface-container/30 flex items-center justify-between border-t border-outline-variant/10">
                        <span className="text-sm font-medium text-on-surface-variant">
                            Menampilkan {currentTransactions.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredTransaction.length)} dari {filteredTransaction.length} transaksi
                        </span>
                        
                        <div className="flex items-center gap-2">
                            {/* Tombol Sebelumnya */}
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                disabled={currentPage === 1}
                                className="p-2 rounded-full hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
                            </button>
                            {/* Tombol Angka Halaman (Dibuat otomatis berapapun jumlah halamannya) */}
                            {[...Array(totalPages)].map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${
                                        currentPage === i + 1 
                                        ? "bg-primary text-on-primary shadow-sm" 
                                        : "hover:bg-primary/10 text-on-surface"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            {/* Tombol Selanjutnya */}
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-full hover:bg-primary/5 text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </section>

            </main>
        </>
    );
}

Transaction.layout = page => <AdminNav children={page} />;
export default Transaction;
