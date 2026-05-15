import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import OwnerNav from "../layouts/owner_nav";
import * as XLSX from 'xlsx';

function Reports({ auth, branches = [], filters = {}, stats = {}, transactions = [] }) {
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || "semua");
    const [timeFilter, setTimeFilter] = useState(filters.waktu || "bulan_ini");

    const handleFilterChange = (type, value) => {
        let newBranch = branchFilter;
        let newTime = timeFilter;

        if (type === 'branch') {
            newBranch = value;
            setBranchFilter(value);
        } else {
            newTime = value;
            setTimeFilter(value);
        }

        router.get(
            '/owner/reports', 
            { branch_id: newBranch, waktu: newTime }, 
            { preserveState: true, replace: true }
        );
    };

    const exportToExcel = () => {
        if (!transactions || transactions.length === 0) {
            alert('Tidak ada data transaksi untuk diekspor!');
            return;
        }

        const dataForExcel = transactions.map((t, index) => ({
            'No': index + 1,
            'ID Pesanan': t.id_pesanan,
            'Cabang': t.branch?.nama || 'Pusat',
            'Nama Pelanggan': t.nama,
            'No HP': t.nohp,
            'Alamat': t.alamat,
            'Status Pembayaran': t.payment_status,
            'Metode': t.payment_method,
            'Waktu Transaksi': new Date(t.created_at).toLocaleString('id-ID'),
            'Total Pendapatan (Rp)': Number(t.total)
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        
        // Atur lebar kolom agar rapi di Excel
        const wscols = [
            {wch: 5},  // No
            {wch: 15}, // ID Pesanan
            {wch: 20}, // Cabang
            {wch: 25}, // Nama Pelanggan
            {wch: 15}, // No HP
            {wch: 30}, // Alamat
            {wch: 15}, // Status
            {wch: 15}, // Metode
            {wch: 20}, // Waktu
            {wch: 20}  // Total
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi Selesai");

        XLSX.writeFile(workbook, `Laporan_Transaksi_Dollin_Donuts.xlsx`);
    };

    return (
        <>
            <Head title="Laporan Global - Owner" />
            <div className="relative bg-background text-on-background antialiased selection:bg-primary-container min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    {/* Header & Filter */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-on-surface mb-1 tracking-wide">Laporan Analitik</h1>
                            <p className="text-base text-on-surface">Pantau pendapatan dan performa produk terbaik</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Filter Cabang */}
                            <div className="relative min-w-[200px]">
                                <select 
                                    value={branchFilter}
                                    onChange={(e) => handleFilterChange('branch', e.target.value)}
                                    className="appearance-none w-full bg-surface-container-high text-primary px-6 py-3 pr-10 rounded-xl font-bold border border-transparent focus:border-outline-variant/50 focus:outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                                >
                                    <option value="semua">Semua Cabang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.nama}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                    expand_more
                                </span>
                            </div>

                            {/* Filter Waktu */}
                            <div className="relative min-w-[200px]">
                                <select 
                                    value={timeFilter}
                                    onChange={(e) => handleFilterChange('time', e.target.value)}
                                    className="appearance-none w-full bg-surface-container-high text-primary px-6 py-3 pr-10 rounded-xl font-bold border border-transparent focus:border-outline-variant/50 focus:outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                                >
                                    <option value="hari_ini">Hari Ini</option>
                                    <option value="minggu_ini">7 Hari Terakhir</option>
                                    <option value="bulan_ini">Bulan Ini</option>
                                    <option value="semua">Keseluruhan Waktu</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                                    calendar_today
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Ringkasan Statistik */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Card Pendapatan */}
                        <div className="bg-primary-container p-8 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/10">
                            <div>
                                <p className="text-on-primary-container/80 text-sm font-bold uppercase tracking-widest mb-1">Total Pendapatan Bersih</p>
                                <h3 className="text-4xl md:text-5xl font-extrabold text-on-primary-container">
                                    Rp {Number(stats.total_pendapatan || 0).toLocaleString('id-ID')}
                                </h3>
                            </div>
                            <div className="w-16 h-16 bg-on-primary-container/10 rounded-full flex items-center justify-center text-on-primary-container hidden sm:flex shrink-0">
                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            </div>
                        </div>

                        {/* Card Pesanan */}
                        <div className="bg-surface-container-low p-8 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/10">
                            <div>
                                <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest mb-1">Total Pesanan Selesai</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-4xl md:text-5xl font-extrabold text-primary">
                                        {Number(stats.total_pesanan || 0).toLocaleString('id-ID')}
                                    </h3>
                                    <span className="text-xl text-on-surface-variant font-bold">Transaksi</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary hidden sm:flex shrink-0">
                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                            </div>
                        </div>
                    </div>

                    {/* Produk Terlaris */}
                    <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
                            <h2 className="text-2xl font-bold text-on-surface">5 Produk Terlaris</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {stats.top_products && stats.top_products.length > 0 ? (
                                stats.top_products.map((product, index) => (
                                    <div key={index} className="flex items-center bg-surface-container-lowest hover:bg-primary/5 border border-outline-variant/10 p-4 rounded-xl transition-colors group">
                                        
                                        {/* Rank Number */}
                                        <div className="w-10 text-center font-black text-2xl text-outline-variant group-hover:text-primary transition-colors">
                                            #{index + 1}
                                        </div>

                                        {/* Product Image */}
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container ml-4 border border-outline-variant/20 flex-shrink-0">
                                            {product.product_image ? (
                                                <img src={product.product_image} alt={product.product_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                                    {product.tipe === 'paket' ? '📦' : '🍩'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="ml-4 flex-1">
                                            <h3 className="text-lg font-bold text-on-surface">
                                                {product.product_name || (product.tipe === 'paket' ? 'Paket Donat Custom' : 'Produk Tidak Dikenal')}
                                            </h3>
                                            <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-[16px]">sell</span>
                                                Terjual {product.total_sold} buah
                                            </p>
                                        </div>

                                        {/* Revenue Contributed */}
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Menyumbang</p>
                                            <p className="text-xl font-extrabold text-primary">Rp {Number(product.total_revenue).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30">
                                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">monitoring</span>
                                    <p className="text-on-surface-variant font-medium">Belum ada data penjualan yang selesai untuk filter yang dipilih.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabel Transaksi */}
                    <div className="mt-8 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary text-3xl">list_alt</span>
                                <h2 className="text-2xl font-bold text-on-surface">Data Transaksi Selesai</h2>
                            </div>
                            <button 
                                onClick={exportToExcel}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:-translate-y-0.5"
                            >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Export ke Excel (XLSX)
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-surface-container/50 text-xs uppercase tracking-wider text-on-surface-variant font-bold border-b border-outline-variant/20">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">ID Pesanan</th>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Cabang</th>
                                        <th className="px-4 py-3">Pelanggan</th>
                                        <th className="px-4 py-3">Metode</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/10">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="text-center py-8 text-on-surface-variant text-sm">Belum ada transaksi di rentang waktu ini.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((t, i) => (
                                            <tr key={t.id} className="hover:bg-surface-container/30 transition-colors">
                                                <td className="px-4 py-3 text-sm text-on-surface-variant">{i + 1}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-primary">{t.id_pesanan}</td>
                                                <td className="px-4 py-3 text-sm text-on-surface-variant">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                                                <td className="px-4 py-3 text-sm text-on-surface font-semibold">{t.branch?.nama || 'Pusat'}</td>
                                                <td className="px-4 py-3 text-sm text-on-surface">{t.nama}</td>
                                                <td className="px-4 py-3 text-sm text-on-surface-variant uppercase">{t.payment_method}</td>
                                                <td className="px-4 py-3 text-sm font-extrabold text-right text-primary">Rp {Number(t.total).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

Reports.layout = page => <OwnerNav children={page} />;
export default Reports;
