import AdminNav from "../layouts/admin_nav";
import { Head } from "@inertiajs/react";
import dayjs from "dayjs";

function Orders({ orders = [], stats = {} }) {
    console.log(orders)
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
                                {orders.map((order, index) => (

                                
                                    <tr key={index} className="hover:bg-surface-container-low transition-colors group">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-bold text-primary text-base brand-logo">
                                                    {/* Menambahkan qty di depan nama produk pertama */}
                                                    {order.items.length > 0 ? `${order.items[0].qty}x ${order.items[0].product.nama}` : 'Pesanan'}
                                                    
                                                    {/* Menampilkan sisa macam produk lainnya (jika ada) */}
                                                    {order.items.length > 1 ? ` +${order.items.length - 1} macam lainnya` : ''}
                                                </p>
                                                <p className="text-xs text-on-surface-variant font-mono">#{order.id_pesanan}</p>
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
                                            <button className="p-2 hover:bg-primary-container/20 rounded-full text-primary transition-all">
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-8 py-6 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/10">
                        <p className="text-sm text-on-surface-variant">Menampilkan <span className="font-semibold">{orders.length}</span> dari <span className="font-semibold">{orders.length}</span> hasil</p>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/20 hover:bg-primary-container/10 transition-all text-on-surface-variant">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold shadow-md shadow-primary/20">1</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/20 hover:bg-primary-container/10 transition-all">2</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/20 hover:bg-primary-container/10 transition-all">3</button>
                            <span className="px-2 text-on-surface-variant">...</span>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/20 hover:bg-primary-container/10 transition-all">13</button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/20 hover:bg-primary-container/10 transition-all text-on-surface-variant">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

Orders.layout = page => <AdminNav children={page} />;
export default Orders;
