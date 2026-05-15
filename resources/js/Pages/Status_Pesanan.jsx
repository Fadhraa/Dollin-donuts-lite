import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import Navbar from '@/Components/Navbar';

export default function StatusPesanan({ branches = [] }) {
    const [nohp, setNohp] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [showModalSelesai, setShowModalSelesai] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    const [activeBranch, setActiveBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(false);

    useEffect(() => {
        const savedBranch = localStorage.getItem('selectedBranch');
        if (savedBranch) {
            setActiveBranch(JSON.parse(savedBranch));
        } else {
            setShowBranchModal(true);
        }
    }, []);

    const showNotification = (text, type) => {
        setShowInfoModal(true);
        setMessage({ text, type });
        setTimeout(() => {
            setShowInfoModal(false);
            setMessage({ text: '', type: '' });
        }, 3000);
    };

    const clearMessage = () => {
        setShowInfoModal(false);
        setMessage({ text: '', type: '' });
    };

    const activeOrders = orders.filter(o => o.order_status !== 'Selesai');
    const completedOrders = orders.filter(o => o.order_status === 'Selesai');

    const resumePayment = (snapToken) => {
        if (!snapToken) return;
        window.snap.pay(snapToken, {
            onSuccess: function(result) {
                showNotification('Pembayaran berhasil! Silakan muat ulang halaman ini.', 'success');
            },
            onPending: function(result) {
                showNotification('Menunggu pembayaran Anda.', 'info');
            },
            onError: function(result) {
                showNotification('Pembayaran gagal.', 'error');
            },
            onClose: function() {
                showNotification('Anda menutup jendela sebelum menyelesaikan pembayaran', 'error');
            }
        });
    };

    const checkStatus = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setHasSearched(true);

        try {
            const response = await axios.post('/api/cek-pesanan', { nohp });
            if (response.data.status === 'success') {
                setOrders(response.data.data);
            }
        } catch (err) {
            setOrders([]);
            if (err.response?.status !== 404) {
                setError(err.response?.data?.message || 'Terjadi kesalahan saat mencari pesanan.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let intervalId;
        if (hasSearched && nohp) {
            intervalId = setInterval(async () => {
                try {
                    const response = await axios.post('/api/cek-pesanan', { nohp });
                    if (response.data.status === 'success') {
                        setOrders(response.data.data);
                    }
                } catch (err) {
                    // Silently fail on auto-refresh to not interrupt user
                }
            }, 5000); // 5 seconds polling
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [hasSearched, nohp]);

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
                return <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-bold border border-tertiary-fixed-dim">Berhasil</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold border border-primary-fixed-dim">Menunggu Pembayaran</span>;
            case 'failed':
                return <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold border border-error-dim">Dibatalkan/Gagal</span>;
            default:
                return <span className="px-3 py-1 bg-surface-variant text-on-surface-variant rounded-full text-xs font-bold border border-outline-variant">{status}</span>;
        }
    };

    const getOrderStatusBadge = (status) => {
        switch (status) {
            case 'Menunggu Konfirmasi':
                return <span className="px-3 py-1 bg-surface-container-high text-on-surface rounded-full text-xs font-bold border border-outline-variant">Menunggu Konfirmasi</span>;
            case 'Dikonfirmasi':
                return <span className="px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-bold border border-primary-fixed-dim">Dikonfirmasi: Pesananmu akan diproses secepatnya</span>;
            case 'Diproses':
                return <span className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold border border-secondary-fixed-dim">Sedang Diproses Dapur</span>;
            case 'Selesai':
                return <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-xs font-bold border border-tertiary-fixed-dim">Siap Diambil/Dikirim</span>;
            default:
                return <span className="px-3 py-1 bg-surface-container-highest text-on-surface rounded-full text-xs font-bold border border-outline-variant">{status || 'Menunggu'}</span>;
        }
    };
    console.log(activeOrders)
    return (
        <div className="min-h-screen bg-background font-body selection:bg-primary-container selection:text-on-primary-container">
            <Head title="Cek Status Pesanan - Dollin Donuts">
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
            </Head>
            
            {/* TopNavBar */}
            <Navbar 
                branches={branches}
                activeBranch={activeBranch}
                setActiveBranch={setActiveBranch}
                showBranchModal={showBranchModal}
                setShowBranchModal={setShowBranchModal}
            />

            {/* Modern Toast Notification */}
            {showInfoModal && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
                    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border ${
                        message.type === 'success' 
                            ? 'bg-[#f0fdf4]/95 dark:bg-green-900/90 border-green-200 text-green-800' 
                            : message.type === 'error'
                            ? 'bg-[#fef2f2]/95 dark:bg-red-900/90 border-red-200 text-red-800'
                            : 'bg-white/95 dark:bg-surface-container-highest/90 border-primary/20 text-on-surface'
                        } backdrop-blur-xl min-w-[320px] max-w-md`}>
                        
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            message.type === 'success' ? 'bg-green-100 text-green-600' : 
                            message.type === 'error' ? 'bg-red-100 text-red-600' : 
                            'bg-primary/10 text-primary'
                        }`}>
                            <span className="material-symbols-outlined font-black text-2xl">
                                {message.type === 'success' ? 'check_circle' : message.type === 'error' ? 'error' : 'info'}
                            </span>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-bold text-sm tracking-wide uppercase">
                                {message.type === 'success' ? 'Berhasil' : message.type === 'error' ? 'Peringatan' : 'Informasi'}
                            </h3>
                            <p className="text-xs font-medium opacity-90 mt-0.5 leading-relaxed">{message.text}</p>
                        </div>

                        <button 
                            onClick={() => clearMessage()} 
                            className="flex-shrink-0 p-2 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>
            )}

            <main className="pt-32 pb-32 px-6 max-w-4xl mx-auto">
                {/* Hero Section */}
                <section className="relative py-8 md:py-12 flex flex-col items-center text-center gap-6 overflow-hidden">
                    <div className="z-10 flex flex-col items-center w-full">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-black tracking-widest uppercase mb-6 border border-secondary-fixed-dim">
                            Order Status
                        </span>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-[1.1] tracking-tight mb-4 font-headline">
                            Track Your <br/><span className="text-secondary italic">Sweet Treats</span>
                        </h1>
                        <p className="text-on-surface-variant text-base max-w-lg leading-relaxed mb-8">
                            The wait is almost over. Enter your phone number below to see exactly where your fresh artisan donuts are in our baking journey.
                        </p>
                        
                        {/* Search Box */}
                        <div className="relative w-full max-w-md mx-auto">
                            <form onSubmit={checkStatus} className="bg-surface-container-lowest p-2 rounded-2xl flex items-center shadow-lg shadow-primary/5 border border-outline-variant/20 focus-within:border-primary/50 transition-colors">
                                <div className="pl-4 pr-2 text-primary/50 flex items-center">
                                    <span className="material-symbols-outlined">phone_iphone</span>
                                </div>
                                <input 
                                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-bold placeholder:text-outline-variant/70 px-2 py-3 outline-none text-base" 
                                    placeholder="Enter phone number..." 
                                    type="tel"
                                    value={nohp}
                                    onChange={(e) => setNohp(e.target.value)}
                                    required
                                />
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="bg-primary hover:opacity-90 text-on-primary px-6 py-3 rounded-xl font-bold transition-all active:scale-95 whitespace-nowrap disabled:opacity-50 flex items-center justify-center min-w-[120px] shadow-md shadow-primary/20"
                                >
                                    {loading ? (
                                        <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : 'Track Now'}
                                </button>
                            </form>
                            <p className="mt-4 text-[11px] text-outline font-bold uppercase tracking-widest text-center">Example: 085233724944</p>
                            
                            {error && (
                                <div className="mt-4 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-bold animate-in fade-in zoom-in duration-300 text-center">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Results Area */}
                {hasSearched && orders.length === 0 && !loading && !error ? (
                    <section className="mt-8 bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/20 shadow-sm animate-in fade-in duration-500">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-surface-container mx-auto rounded-full flex items-center justify-center mb-5 text-outline-variant">
                                <span className="material-symbols-outlined text-3xl">search_off</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Pesanan Tidak Ditemukan</h3>
                            <p className="text-on-surface-variant text-sm">Kami tidak dapat menemukan pesanan aktif dengan nomor tersebut. Silakan periksa kembali nomor Anda.</p>
                        </div>
                    </section>
                ) : !hasSearched && orders.length === 0 ? (
                    <section className="mt-8 bg-surface-container-lowest rounded-3xl p-10 text-center border border-outline-variant/20 shadow-sm">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-surface-container mx-auto rounded-full flex items-center justify-center mb-5 text-outline-variant">
                                <span className="material-symbols-outlined text-3xl">receipt_long</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">No Order Active</h3>
                            <p className="text-on-surface-variant text-sm">Enter your phone number above to pull up your recent orders and delivery status.</p>
                        </div>
                    </section>
                ) : (
                    <section className="mt-8 space-y-6">
                        {activeOrders.length === 0 && hasSearched && !loading && !error && (
                            <div className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/30 text-center animate-in fade-in">
                                <p className="text-on-surface-variant font-medium">Tidak ada pesanan aktif saat ini.</p>
                            </div>
                        )}
                        {activeOrders.map((order) => (
                            <div key={order.id} className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-sm border border-outline-variant/30 animate-in slide-in-from-bottom-10 fade-in duration-500 hover:shadow-md hover:border-primary/20 transition-all">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline-variant/20 pb-5 mb-5 gap-3">
                                    <div>
                                        <p className="text-[10px] font-black text-on-surface-variant tracking-widest uppercase mb-1">ID Pesanan</p>
                                        <p className="text-xl font-black text-primary font-headline">{order.id_pesanan}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-outline">storefront</span>
                                        <span className="font-bold text-on-surface text-sm">{order.branch?.nama || 'Lokasi tidak diketahui'}</span>
                                    </div>
                                    <div className="md:text-right bg-surface px-4 py-2 rounded-xl border border-outline-variant/30">
                                        <p className="text-[10px] font-black text-on-surface-variant tracking-widest uppercase mb-1">Total Belanja</p>
                                        <p className="text-lg font-black text-primary">Rp {Number(order.total).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                                Status Pembayaran
                                            </p>
                                            <div>{getStatusBadge(order.payment_status)}</div>
                                            {order.payment_method && (
                                                <p className="mt-3 text-[11px] text-on-surface-variant font-bold">Via: <span className="text-primary uppercase">{order.payment_method}</span></p>
                                            )}
                                        </div>
                                        {order.payment_status === 'pending' && order.snap_token && (
                                            <button 
                                                onClick={() => resumePayment(order.snap_token)}
                                                className="mt-4 w-full py-2 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                                                Bayar Sekarang
                                            </button>
                                        )}
                                    </div>
                                    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20">
                                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">bakery_dining</span>
                                            Status Dapur
                                        </p>
                                        <div>{getOrderStatusBadge(order.order_status)}</div>
                                        {order.order_status === 'Sedang Dikirim' && (
                                            <p className="mt-3 text-[11px] text-on-surface-variant font-medium">Kurir: <strong className="text-primary">{order.courier?.name || 'Petugas Dollin'}</strong></p>
                                        )}
                                        {order.order_status === 'Sedang Dikirim' && (
                                            <p className="mt-3 text-[11px] text-on-surface-variant font-medium">Kurir akan menghubungi anda jika diperlukan</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-5 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs gap-2 text-on-surface-variant">
                                    <span>Atas nama: <strong className="text-primary">{order.nama}</strong></span>
                                    <span className="font-semibold">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ))}

                        {completedOrders.length > 0 && (
                            <div className="flex justify-center mt-6 animate-in fade-in">
                                <button 
                                    onClick={() => setShowModalSelesai(true)}
                                    className="px-6 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline-variant/30 hover:bg-surface-container-highest transition-colors shadow-sm text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[20px]">history</span>
                                    Lihat Riwayat Pesanan Selesai ({completedOrders.length})
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* Support Section (Bento Style) */}
                <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="md:col-span-2 bg-surface-container-high rounded-[2rem] p-8 flex flex-col justify-between border border-outline-variant/20 shadow-sm">
                        <div>
                            <h3 className="text-2xl font-bold text-primary mb-3 font-headline tracking-tight">Need Help with Your Order?</h3>
                            <p className="text-on-surface-variant max-w-lg mb-8 leading-relaxed">Our master bakers and delivery partners are here to ensure your treats arrive perfectly. If something feels off, chat with us instantly.</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <a href="#" className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-md shadow-[#25D366]/20 text-sm">
                                <span className="material-symbols-outlined text-[20px]">chat</span>
                                WhatsApp Support
                            </a>
                            <a href="#" className="inline-flex items-center gap-2 bg-surface-container-lowest text-primary px-6 py-3 rounded-xl font-bold hover:bg-surface border border-outline-variant/20 transition-all text-sm shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">call</span>
                                Call Shop
                            </a>
                        </div>
                    </div>
                    
                    <div className="bg-primary rounded-[2rem] p-8 text-on-primary flex flex-col items-center justify-center text-center shadow-lg shadow-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                        <div className="w-14 h-14 rounded-full bg-primary-container text-primary flex items-center justify-center mb-5 shadow-inner transform group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-container mb-2">The Artisan Promise</p>
                        <p className="text-base font-medium leading-relaxed px-2">Baked fresh daily, delivered with care, or your next box is on us.</p>
                    </div>
                </section>
            </main>

            {/* Modal Riwayat Pesanan Selesai */}
            {showModalSelesai && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                <span className="material-symbols-outlined">history</span> Riwayat Pesanan Selesai
                            </h2>
                            <button onClick={() => setShowModalSelesai(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-on-surface-variant">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {completedOrders.map((order) => (
                                <div key={order.id} className="bg-surface rounded-2xl p-5 border border-outline-variant/30 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="font-bold text-primary font-headline">{order.id_pesanan}</p>
                                        <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2 text-on-surface-variant">
                                            <span className="material-symbols-outlined text-[16px]">storefront</span>
                                            <span className="font-medium">{order.branch?.nama || '-'}</span>
                                        </div>
                                        <span className="font-black text-primary">Rp {Number(order.total).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
