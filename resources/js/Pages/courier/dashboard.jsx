import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function CourierDashboard({ auth, availableOrders, activeOrders, completedToday }) {
    const [activeTab, setActiveTab] = useState('available'); // 'available' | 'active'
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTakeOrder = (id) => {
        if (!confirm('Ambil pesanan ini untuk diantar?')) return;
        setIsProcessing(true);
        router.patch(`/courier/take/${id}`, {}, {
            onFinish: () => {
                setIsProcessing(false);
                setActiveTab('active');
            }
        });
    };

    const handleCompleteOrder = (id) => {
        if (!confirm('Tandai pesanan ini selesai (sudah sampai ke pelanggan)?')) return;
        setIsProcessing(true);
        router.patch(`/courier/complete/${id}`, {}, {
            onFinish: () => setIsProcessing(false)
        });
    };

    const formatPhoneForWA = (phone) => {
        let formatted = phone.replace(/\D/g, '');
        if (formatted.startsWith('0')) {
            formatted = '62' + formatted.substring(1);
        }
        return formatted;
    };
    const renderOrderCard = (order, type) => {
        const waLink = `https://wa.me/${formatPhoneForWA(order.nohp)}?text=Halo Kak ${order.nama}, ini kurir Dollin Donuts. Pesanan atas nama kakak sedang dalam perjalanan ya!`;
        
        // Gunakan koordinat jika ada, jika tidak gunakan alamat teks (fallback)
        const mapsLink = order.latitude && order.longitude 
            ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.alamat)}`;

        return (
            <div key={order.id} className="bg-surface rounded-2xl shadow-sm border border-outline-variant/20 p-5 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                            #{order.id_pesanan}
                        </span>
                        <h3 className="font-bold text-on-surface text-lg mt-2">{order.nama}</h3>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-black text-on-surface block">Rp {Number(order.total).toLocaleString('id-ID')}</span>
                        {type === 'active' && <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">Sedang Jalan</span>}
                    </div>
                </div>

                <div className="bg-surface-container-lowest p-3 rounded-xl mb-4 border border-outline-variant/10">
                    <div className="flex gap-2 items-start text-sm text-on-surface-variant mb-2">
                        <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">location_on</span>
                        <p className="font-medium leading-tight line-clamp-3">{order.alamat}</p>
                    </div>
                    <div className="flex gap-2 items-center text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                        <p className="font-medium">{order.nohp}</p>
                    </div>
                </div>

                {/* Aksi Cepat / Shortcut */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-sm">map</span> Maps
                    </a>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 py-2.5 rounded-xl text-xs font-bold transition-colors">
                        <span className="material-symbols-outlined text-sm">chat</span> WhatsApp
                    </a>
                </div>

                {/* Tombol Aksi Utama */}
                {type === 'available' ? (
                    <button 
                        disabled={isProcessing}
                        onClick={() => handleTakeOrder(order.id)}
                        className="w-full bg-primary text-on-primary font-black py-3.5 rounded-xl shadow-md shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">two_wheeler</span>
                        Ambil & Mulai Antar
                    </button>
                ) : (
                    <button 
                        disabled={isProcessing}
                        onClick={() => handleCompleteOrder(order.id)}
                        className="w-full bg-tertiary text-on-tertiary font-black py-3.5 rounded-xl shadow-md shadow-tertiary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check_circle</span>
                        Pesanan Selesai (Sampai)
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-surface-container-low text-on-surface font-sans antialiased pb-24">
            <Head title="Kurir Dashboard - Dollin Donuts" />
            
            {/* Header / Navbar Mobile */}
            <header className="bg-primary text-on-primary p-5 shadow-lg sticky top-0 z-40 rounded-b-3xl">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="font-black text-xl tracking-wide font-body">Portal Kurir</h1>
                        <p className="text-sm opacity-90">Halo, {auth.user.name}</p>
                    </div>
                    <Link href="/logout" method="post" as="button" className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-colors">
                        <span className="material-symbols-outlined text-on-primary">logout</span>
                    </Link>
                </div>
                
                {/* Status Hari Ini */}
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                    <div className="bg-white/20 p-2 rounded-xl">
                        <span className="material-symbols-outlined text-white">task_alt</span>
                    </div>
                    <div>
                        <p className="text-xs opacity-90 font-medium">Diselesaikan hari ini</p>
                        <p className="font-black text-lg">{completedToday} Pesanan</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-5">
                {/* Tabs */}
                <div className="flex bg-surface p-1 rounded-2xl shadow-sm mb-6 border border-outline-variant/10">
                    <button 
                        onClick={() => setActiveTab('available')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'available' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        Tersedia ({availableOrders.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'active' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        Sedang Diantar ({activeOrders.length})
                    </button>
                </div>

                {/* List Content */}
                <div className="space-y-4">
                    {activeTab === 'available' && (
                        availableOrders.length > 0 ? (
                            availableOrders.map(order => renderOrderCard(order, 'available'))
                        ) : (
                            <div className="text-center py-12 px-6">
                                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-outline-variant">inbox</span>
                                </div>
                                <h3 className="font-bold text-lg text-on-surface mb-2">Belum Ada Pesanan</h3>
                                <p className="text-sm text-on-surface-variant">Belum ada pesanan yang siap diantar dari dapur saat ini.</p>
                            </div>
                        )
                    )}

                    {activeTab === 'active' && (
                        activeOrders.length > 0 ? (
                            activeOrders.map(order => renderOrderCard(order, 'active'))
                        ) : (
                            <div className="text-center py-12 px-6">
                                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl text-outline-variant">directions_bike</span>
                                </div>
                                <h3 className="font-bold text-lg text-on-surface mb-2">Santai Dulu</h3>
                                <p className="text-sm text-on-surface-variant">Kamu sedang tidak mengantar pesanan apa-apa. Cek tab Tersedia untuk mengambil pesanan baru.</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
