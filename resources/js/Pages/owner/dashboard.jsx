import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import OwnerNav from "../layouts/owner_nav";

function Dashboard({ auth, stats = {}, recent_orders = [], branches = [], filters = {} }) {
    const user = auth.user;
    console.log(recent_orders)
    // State untuk filter cabang
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || "semua");

    const handleBranchFilter = (e) => {
        const branch_id = e.target.value;
        setSelectedBranch(branch_id);
        
        router.get(
            '/owner/dashboard', 
            { branch_id: branch_id }, 
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
        <div className="relative bg-background text-on-background antialiased selection:bg-primary-container min-h-screen">
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-on-surface mb-1 tracking-wide">Dashboard Owner</h1>
                        <p className="text-base text-on-surface">Pantau penjualan dan performa dari seluruh cabang Dollin Donuts</p>
                    </div>
                    
                    {/* Dropdown Filter Cabang Khusus Owner */}
                    <div className="relative min-w-[250px]">
                        <select 
                            value={selectedBranch}
                            onChange={handleBranchFilter}
                            className="appearance-none w-full bg-surface-container-high text-primary px-6 py-3 pr-10 rounded-xl font-bold border border-transparent focus:border-outline-variant/50 focus:outline-none focus:ring-0 cursor-pointer shadow-sm transition-all"
                        >
                            <option value="semua">Keseluruhan (Semua Cabang)</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.nama}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                            expand_more
                        </span>
                    </div>
                </div>

                {/* content main */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="md:col-span-2 bg-primary-container p-8 rounded-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <span className="text-on-surface-variant text-sm font-medium">Pendapatan Hari Ini</span>
                            <h3 className="text-5xl font-extrabold text-on-primary-container mb-2">Rp {Number(stats.pendapatan_hari_ini || 0).toLocaleString('id-ID')}</h3>
                            <div className={`flex items-center gap-2 font-bold mt-4 ${stats.persentase_pendapatan >= 0 ? 'text-primary' : 'text-error'}`}>
                                <span className="material-symbols-outlined ">{stats.persentase_pendapatan >= 0 ? 'trending_up' : 'trending_down'}</span>
                                <span className="">{Math.abs(stats.persentase_pendapatan)}% dari kemarin</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-surface-container-low p-8 rounded-lg flex flex-col justify-between">
                        <div>
                            <span className="text-on-surface-variant font-semibold text-xs uppercase mb-1 block">Total Orders</span>
                            <div className="text-4xl font-bold text-primary">{stats.total_orders || 0}</div>
                        </div>
                        <div className="flex items-center gap-2 text-tertiary text-sm font-medium">
                            <span className="material-symbols-outlined text-sm">shopping_cart</span>
                            <span>{stats.pending_pickup || 0} pending pickup</span>
                        </div>
                    </div>
                    
                    <div className="bg-secondary-container p-8 rounded-lg flex flex-col justify-between relative overflow-hidden">
                        <div>
                            <span className="text-on-secondary-container font-semibold text-xs uppercase mb-1 block">Total Cabang Aktif</span>
                            <div className="text-xl font-bold text-on-secondary-container mt-2">{branches.length} Cabang</div>
                        </div>
                        <div className="bg-on-secondary-container/10 p-2 rounded-md text-xs font-bold text-on-secondary-container self-start">
                            SISTEM NORMAL
                        </div>
                    </div>
                </div>

                <section className="bg-surface-container-lowest p-8 rounded-lg w-full">
                    <h2 className="text-2xl font-bold text-on-surface mb-4">Pesanan Terbaru</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-on-surface-variant/10">
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">No</th>
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">ID Pesanan</th>
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">Cabang</th>
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">Nama</th>
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">Total</th>
                                    <th className="px-8 py-2 text-left text-on-surface-variant font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recent_orders.length > 0 ? recent_orders.map((order, index) => (
                                    <tr key={index} className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                                        <td className="px-8 py-4">{index + 1}</td>
                                        <td className="px-8 py-4 font-mono text-primary">#{order.id_pesanan}</td>
                                        <td className="px-8 py-4">{order.branch?.nama || '-'}</td>
                                        <td className="px-8 py-4">{order.nama || 'Pelanggan'}</td>
                                        <td className="px-8 py-4">Rp {order.total.toLocaleString('id-ID')}</td>
                                        <td className="px-8 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] ${
                                                order.order_status === 'Selesai' ? 'bg-tertiary-container text-on-tertiary-container' : 
                                                order.order_status === 'Diproses' ? 'bg-primary-container text-on-primary-container' : 
                                                'bg-secondary-container text-on-secondary-container'
                                            }`}>
                                                {order.order_status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-4 text-center text-on-surface-variant">Belum ada pesanan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
        </>
    );
}

Dashboard.layout = page => <OwnerNav children={page} />
export default Dashboard;
