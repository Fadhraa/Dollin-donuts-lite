import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, Suspense, lazy } from 'react';
const MapPicker = lazy(() => import('../Components/MapPicker'));
import axios from 'axios';
import Navbar from '@/Components/Navbar';

export default function Welcome({ products = [], branches = [] }) {
    console.log(branches)
    useEffect(() => {
        const savedBranch = localStorage.getItem('selectedBranch');
        if (savedBranch) {
            const parsed = JSON.parse(savedBranch);
            // Sinkronkan dengan data terbaru dari props agar koordinat masuk
            const latestBranch = branches.find(b => b.id === parsed.id);
            if (latestBranch) {
                setActiveBranch(latestBranch);
            } else {
                setActiveBranch(parsed);
            }
            setShowBranchModal(false);
        }
    }, [branches]);
    const [activeTab, setActiveTab] = useState('Semua');
    const [activeType, setActiveType] = useState('satuan');
    const [activeBranch, setActiveBranch] = useState(null);
    const [showBranchModal, setShowBranchModal] = useState(true);
    const [message, setMessage] = useState({
        text: '',
        type: '',
    });
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showWaModal, setShowWaModal] = useState(false);
    const [configuringBox, setConfiguringBox] = useState(null);
    const [selectedBoxItems, setSelectedBoxItems] = useState([]);

    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [formData, setFormData] = useState({
        nama: '',
        nohp: '',
        alamat: '',
        payment_method: '',
        delivery_method: 'pickup', // Default
        latitude: '',
        longitude: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [distance, setDistance] = useState(0);

    const showNotification = (text, type) => {
        setShowInfoModal(true);
        setMessage({ text, type });

        // Menghilangkan notifikasi otomatis setelah 3 detik
        setTimeout(() => {
            setShowInfoModal(false);
            setMessage({ text: '', type: '' });
        }, 3000);
    };
    const clearMessage = () => {
        setShowInfoModal(false)
        setMessage({ text: '', type: '' });
    }

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            showNotification('Geolocation tidak didukung oleh browser Anda', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
                showNotification('Lokasi berhasil dideteksi!', 'success');
            },
            (error) => {
                let msg = 'Gagal mendeteksi lokasi.';
                if (error.code === 1) msg = 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.';
                showNotification(msg, 'error');
            }
        );
    };

    const handleOrder = async (e) => {
        e.preventDefault();

        if (isProcessing) return;

        if (cart.length === 0) {
            showNotification('Keranjang belanja Anda masih kosong!', 'error');
            return;
        }

        if (formData.delivery_method === 'delivery' && !formData.alamat) {
            showNotification('Harap lengkapi alamat pengiriman.', 'error');
            return;
        }

        if (!formData.payment_method) {
            showNotification('Harap pilih metode pembayaran terlebih dahulu.', 'error');
            return;
        }

        setIsProcessing(true);

        const timestamp = Date.now().toString().slice(-4);
        const idPesanan = `ORD-${Date.now().toString().slice(-6)}`;

        const data = {
            id_pesanan: idPesanan,
            branch_id: activeBranch.id,
            ...formData,
            cart: cart,
            total: grandTotal,
            delivery_fee: deliveryFee,
        };
        try {
            const response = await axios.post('/checkout', data);
            if (response.data.status === 'success') {
                // Reset Cart dan Form Data segera setelah pesanan terkirim ke database
                setCart([]);
                setFormData({
                    nama: '',
                    nohp: '',
                    alamat: '',
                    payment_method: '',
                    delivery_method: 'pickup',
                    latitude: '',
                    longitude: '',
                });
                setDistance(0);

                window.snap.pay(response.data.snap_token, {
                    onSuccess: function (result) {
                        showNotification('Pembayaran berhasil!', 'success');
                        setCart([]); // Kosongkan keranjang
                        setIsProcessing(false);
                        window.location.href = '/Pesanan';
                    },
                    onPending: function (result) {
                        showNotification('Menunggu pembayaran Anda.', 'info');
                        setIsProcessing(false);
                    },
                    onError: function (result) {
                        showNotification('Pembayaran gagal.', 'error');
                        setIsProcessing(false);
                    },
                    onClose: function () {
                        showNotification('Anda menutup jendela sebelum menyelesaikan pembayaran', 'error');
                        setIsProcessing(false);
                    }
                });
            }
        } catch (error) {
            setIsProcessing(false);
            // Tampilkan detail error dari backend ke Console
            console.log("Detail Error:", error.response?.data);

            // Tampilkan pesan error spesifik ke Toast Notification kita
            const errorMessage = error.response?.data?.message || 'Terjadi kesalahan internal server.';
            showNotification(errorMessage, 'error');
        }

    }
    const addToCart = (product) => {
        const currentStockData = product.stocks?.find((stock) => stock.branch_id === activeBranch?.id);
        const maxStock = currentStockData ? currentStockData.stock : 0;
        if (product.tipe === 'satuan') {
            const existingItem = cart.find(item => item.id === product.id && item.type === 'satuan');

            if (existingItem) {
                if (existingItem.qty >= maxStock) {
                    showNotification(`Stok ${product.nama} di cabang ${activeBranch.nama} habis`, 'error');
                    return;
                }
                setCart(cart.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                ));
            } else {
                if (maxStock <= 0) {
                    showNotification(`Stok ${product.nama} di cabang ${activeBranch.nama} habis`, 'error');
                    return;
                }
                setCart([...cart, {
                    id: product.id,
                    kode_produk: product.kode_produk,
                    nama: product.nama,
                    harga: product.harga,
                    gambar: product.gambar,
                    type: product.tipe,
                    qty: 1,
                    uniqueId: Date.now(),
                    contents: product.tipe === 'paket' ? selectedBoxItems : []
                }]);
            }
        } else {
            const itemUntukKeranjang = {
                id: product.id,
                kode_produk: product.kode_produk,
                nama: product.nama,
                harga: product.harga,
                gambar: product.gambar, // Tetap bawa gambar agar UI bagus
                type: product.tipe,
                qty: 1,
                uniqueId: Date.now(),
                contents: product.tipe === 'paket' ? selectedBoxItems : []
            };
            setCart([...cart, itemUntukKeranjang]);
            setConfiguringBox(null);
        }

    };

    // Fungsi Hitung Jarak Garis Lurus (Haversine Formula) sebagai cadangan
    const calculateHaversine = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371; // Radius Bumi dalam KM
        const dLat = (parseFloat(lat2) - parseFloat(lat1)) * (Math.PI / 180);
        const dLon = (parseFloat(lon2) - parseFloat(lon1)) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(parseFloat(lat1) * (Math.PI / 180)) * Math.cos(parseFloat(lat2) * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Effect untuk mengambil jarak rute jalan raya (OSRM)
    useEffect(() => {
        const fetchRouteDistance = async () => {
            if (activeBranch?.latitude && activeBranch?.longitude && formData.latitude && formData.longitude) {
                try {
                    // OSRM menggunakan format [longitude, latitude]
                    const url = `https://router.project-osrm.org/route/v1/driving/${activeBranch.longitude},${activeBranch.latitude};${formData.longitude},${formData.latitude}?overview=false`;
                    const response = await axios.get(url);

                    if (response.data.routes && response.data.routes[0]) {
                        const routeDistance = response.data.routes[0].distance / 1000; // Konversi Meter ke KM
                        setDistance(routeDistance);
                    }
                } catch (error) {
                    console.error("OSRM Error, falling back to Haversine:", error);
                    const hDist = calculateHaversine(
                        activeBranch.latitude, activeBranch.longitude,
                        formData.latitude, formData.longitude
                    );
                    setDistance(hDist);
                }
            }
        };

        // Debounce 1 detik agar tidak terlalu sering hit API saat user geser peta
        const timer = setTimeout(fetchRouteDistance, 1000);
        return () => clearTimeout(timer);
    }, [formData.latitude, formData.longitude, activeBranch]);

    // Hitung secara langsung (variabel reaktif akan selalu ter-update jika cart berubah)
    const subTotal = cart.reduce((total, item) => total + (item.harga * item.qty), 0);
    const adminFee = subTotal * 0.01; // Web Fee 1%

    // Hitung Ongkir berdasarkan state distance
    let deliveryFee = 0;
    if (formData.delivery_method === 'delivery') {
        if (distance > 0) {
            if (distance <= 5) {
                deliveryFee = 8000;
            } else {
                deliveryFee = 8000 + (Math.ceil(distance - 5) * 2000);
            }
        } else {
            deliveryFee = 0;
        }
    }

    const grandTotal = subTotal + adminFee + deliveryFee;
    const removeFromCart = (itemToRemove) => {
        // Filter berdasarkan uniqueId agar jika ada 2 box yg sama, yang terhapus cuma satu
        setCart(cart.filter(item => (item.uniqueId || item.id) !== (itemToRemove.uniqueId || itemToRemove.id)));
    };

    const renderContentsText = (contentIds) => {
        if (!contentIds || contentIds.length === 0) return "";

        // Hitung kemunculan tiap donat
        const counts = {};
        contentIds.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product) {
                counts[product.nama] = (counts[product.nama] || 0) + 1;
            }
        });
        // Ubah jadi teks: "2x Choco, 1x Matcha"
        return Object.entries(counts)
            .map(([nama, qty]) => `${qty}x ${nama}`)
            .join(", ");
    };

    const toggleFavorite = (id) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleAddProduct = (product) => {
        if (product.tipe === 'satuan') {
            // Placeholder untuk keranjang satuan

            addToCart(product);
        } else {
            setConfiguringBox(product);
            setSelectedBoxItems([]);
        }
    };

    const toggleItemInBox = (id) => {
        if (selectedBoxItems.length < configuringBox.jumlah_pilihan) {
            setSelectedBoxItems([...selectedBoxItems, id]);
        } else {
            alert("Kotak sudah penuh!");
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchType = product.tipe === activeType;
        const matchCategory = activeTab === 'Semua' || product.kategori === activeTab;
        return matchType && matchCategory;
    });

    if (activeTab === 'all') {
        products.map((product) => {
            console.log(product.nama);
        })
    }

    return (
        <div className="bg-background text-on-surface selection:bg-primary-container selection:text-on-primary-container font-body">
            <Head title="Dollin Donuts | Glaze & Grain">
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <style>{`
                    .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                    .material-symbols-outlined.fill-1 { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                    body { font-family: 'Be Vietnam Pro', sans-serif; }
                    h1, h2, h3, .brand-font { font-family: 'Plus Jakarta Sans', sans-serif; }
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-15px); }
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                `}</style>
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
                    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border ${message.type === 'success'
                        ? 'bg-[#f0fdf4]/95 dark:bg-green-900/90 border-green-200 text-green-800'
                        : message.type === 'error'
                            ? 'bg-[#fef2f2]/95 dark:bg-red-900/90 border-red-200 text-red-800'
                            : 'bg-white/95 dark:bg-surface-container-highest/90 border-primary/20 text-on-surface'
                        } backdrop-blur-xl min-w-[320px] max-w-md`}>

                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-green-100 text-green-600' :
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
            {/* Modal Pilih Cabang (Muncul Otomatis) dihandle oleh Navbar */}

            {/* Hero Section */}
            <section className="relative pt-36 pb-24 px-8 overflow-hidden bg-[#FAF5ED]">



                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <svg className="absolute rotate-45 top-0 left-[-150px] w-[350px] md:w-[580px] h-auto text-[#A77B5B]/25 pointer-events-none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#DCC3AA" d="M30.8,-48.9C39.9,-48.2,47,-39.7,57.8,-30.3C68.5,-20.8,83,-10.4,87,2.3C91.1,15.1,84.8,30.2,71.4,35.1C58,39.9,37.4,34.5,24.3,40.1C11.2,45.8,5.6,62.4,-5.4,71.7C-16.4,81.1,-32.9,83.3,-38.1,73.2C-43.3,63,-37.3,40.5,-36.2,26.3C-35,12.1,-38.7,6,-43.3,-2.7C-47.9,-11.3,-53.4,-22.7,-51.3,-31.3C-49.3,-40,-39.7,-46.1,-29.9,-46.3C-20.1,-46.5,-10,-41,0.4,-41.7C10.9,-42.5,21.8,-49.6,30.8,-48.9Z" transform="translate(100 100)" />
                    </svg>
                    {/* KIRI: Gambar Donat Melayang + Judul Cabang + Tombol Aksi */}
                    <div className="lg:col-span-6 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
                        {/* Donat Melayang */}
                        <div className="relative mb-6 w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] flex justify-end transition-transform duration-500 hover:scale-105">
                            <img
                                alt="Artisanal Donuts"
                                className="w-auto h-[300px] drop-shadow-[0_25px_35px_rgba(140,94,60,0.18)] animate-float"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrQXTNQRjy9iAj6jbUyFeki3pTXgakRUi48LI64uLb4uNLHeH0gYY2xErg3Ok0fNxfrDsPfWdhcAKlNKDGJw0Z5k3hxwhLR-q9vxtuhXiDDdjYxVeGoUw3XA6wAUmptzAItE49w2j7m6ejqVNL9wNcypZmpJsdMYhe3THB_NcyJPEZT4dZIIeQMUrgCBQwc0oIqpk-TvUdcJUGJfZisvzE17pnpySODmhe7C2AM7UzbT3kLl8-_jNWE9-VNs0d6qPN3Ea4m7Wewf6L"
                            />
                        </div>

                        {/* Nama Cabang */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary leading-[1.15] mb-3 tracking-tight font-headline">
                            {activeBranch?.nama || 'Dollin Donuts'}
                        </h1>

                        {/* Slogan */}
                        <p className="text-[#8C5E3C] font-black text-xs tracking-[0.2em] uppercase mb-8 opacity-90">
                            BECAUSE FLUFFY IS A FEELING
                        </p>

                        {/* Tombol Aksi */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <a
                                className="px-6 py-3.5 bg-[#8C5E3C] hover:bg-[#734A2C] text-[#FAF5ED] rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[#8C5E3C]/20 hover:-translate-y-0.5 active:scale-95"
                                href="#menu"
                            >
                                <span className="material-symbols-outlined text-lg">arrow_downward</span>
                                Browse the Menu
                            </a>
                            <button
                                onClick={() => setShowWaModal(true)}
                                className="px-6 py-3.5 bg-[#ECC6C6] hover:bg-[#E2B2B2] text-[#7A3E3E] rounded-full font-bold text-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 shadow-md shadow-[#ECC6C6]/10"
                            >
                                <span className="material-symbols-outlined text-lg">chat</span>
                                Chat with a Baker
                            </button>
                        </div>
                    </div>

                    {/* KANAN: Outlet Map (Bingkai Jendela Coklat) + Social Capsule */}
                    <div className="lg:col-span-6 z-10 flex flex-col items-center lg:items-end w-full relative">
                        {/* Bingkai Peta Outlet */}
                        <div className="w-full max-w-[500px] bg-[#FAF5ED] rounded-[2.5rem] border-[10px] border-[#A77B5B] shadow-2xl overflow-hidden flex flex-col transform lg:rotate-2 hover:rotate-0 transition-all duration-500">
                            {/* Window Header */}
                            <div className="bg-[#A77B5B] px-6 py-3 flex items-center justify-center border-b border-[#FAF5ED]/10">
                                <span className="text-[#FAF5ED] text-xs font-black tracking-wider uppercase font-headline">
                                    Outlet: {activeBranch?.nama || 'Dollin Donuts'}
                                </span>
                            </div>
                            {/* Map Body */}
                            <div className="h-[280px] sm:h-[320px] w-full relative z-0 bg-surface-container">
                                {activeBranch?.latitude && activeBranch?.longitude ? (
                                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-xs animate-pulse">Memuat Peta Outlet...</div>}>
                                        <MapPicker
                                            latitude={activeBranch.latitude}
                                            longitude={activeBranch.longitude}
                                            onChange={() => { }}
                                            branchPosition={[activeBranch.latitude, activeBranch.longitude]}
                                            mapKey={`hero-map-${activeBranch.id}`}
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center text-on-surface-variant/60 p-6 text-center gap-2">
                                        <span className="material-symbols-outlined text-4xl">map</span>
                                        <span className="text-xs font-bold">Pilih cabang di menu atas untuk melihat lokasi outlet</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Social Capsule Overlay (Frosted Glass Capsule) */}
                        <div className="mt-8 lg:absolute lg:bottom-[-20px] lg:left-[40px] bg-white/65 dark:bg-surface-container-low/65 backdrop-blur-xl px-5 py-3 rounded-full border border-white/40 shadow-xl flex items-center gap-3.5 z-20">
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-[#8C5E3C] hover:bg-[#734A2C] text-[#FAF5ED] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                                </svg>
                            </a>
                            <a
                                href={`https://wa.me/${activeBranch?.nohp?.replace('+', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-[#8C5E3C] hover:bg-[#734A2C] text-[#FAF5ED] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                            >
                                <svg className="w-[18px] h-[18px] translate-y-[0.5px]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.872.516 3.612 1.416 5.148L2 22l5.004-1.356c1.488.804 3.168 1.272 4.992 1.272C17.52 21.916 22 17.436 22 11.904 22 6.372 17.52 2 12.012 2zm3.324 13.068c-.18.528-.9.984-1.356 1.044-.384.048-.864.096-2.508-.576-2.112-.864-3.468-3.012-3.576-3.156-.108-.144-.864-1.14-.864-2.172 0-1.032.528-1.536.72-1.74.192-.204.42-.252.552-.252.132 0 .264 0 .384.012.12.012.276-.048.432.324.168.384.564 1.344.612 1.44.048.096.084.216.012.336-.072.132-.144.216-.276.372-.132.156-.288.36-.408.492-.132.144-.276.3-.12.588.156.288.696 1.14 1.488 1.848.78.696 1.44.912 1.68 1.02.24.108.384.096.528-.06.144-.156.612-.708.78-.96.168-.252.336-.204.552-.132.228.084 1.428.672 1.668.792.24.12.396.18.456.288.06.108.06.636-.12 1.164z" />
                                </svg>
                            </a>
                            <a
                                href="https://tiktok.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-[#8C5E3C] hover:bg-[#734A2C] text-[#FAF5ED] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.525.02c1.31-.03 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.88-.77-1.52-1.81-1.89-2.91-.09-.02-.17-.03-.26-.05v10.87c.01 2.3-.92 4.67-2.73 6.06-2.12 1.65-5.16 2.01-7.62 1.01-2.94-1.18-4.88-4.47-4.58-7.67.24-2.87 2.22-5.46 4.98-6.31 1.62-.51 3.42-.43 4.98.27v4.21c-1.35-.61-3-.62-4.27.16-1.34.82-2.12 2.44-1.92 4.02.16 1.44 1.27 2.76 2.7 3.06 1.48.33 3.15-.22 4.01-1.5.46-.68.64-1.52.61-2.34V.02z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Menu Section */}
            <section className="py-24 px-8 bg-surface-container-low" id="menu">

                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className='text-4xl font-bold text-primary mb-4'>Our Signature Selection</h2>
                        <p className="text-on-surface-variant font-medium">The finest textures from our bakery to your doorstep.</p>
                    </div>
                    {/* Satuan dan Paketan */}

                    <div className='max-w-md mx-auto py-4 mb-12'>
                        <h3 className='text-sm font-black text-primary/60 mb-4 text-center uppercase tracking-widest'>
                            Pilih Pengalaman Belanja
                        </h3>

                        <div className='relative bg-surface-container p-1.5 rounded-2xl flex items-center shadow-inner group'>
                            {/* Latar Belakang Melayang (Animasi) */}
                            <div
                                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-xl shadow-lg transition-all duration-500 ease-out z-0 ${activeType === 'paket' ? 'translate-x-[100%]' : 'translate-x-0'}`}
                            ></div>

                            <button
                                onClick={() => setActiveType('satuan')}
                                className={`relative z-10 flex-1 py-3.5 rounded-xl font-black text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${activeType === 'satuan' ? 'text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
                            >
                                <span className="material-symbols-outlined text-xl">bakery_dining</span>
                                Beli Satuan
                            </button>

                            <button
                                onClick={() => setActiveType('paket')}
                                className={`relative z-10 flex-1 py-3.5 rounded-xl font-black text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${activeType === 'paket' ? 'text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
                            >
                                <span className="material-symbols-outlined text-xl">inventory_2</span>
                                Beli Paketan
                            </button>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        <button onClick={() => setActiveTab('Semua')} className={`px-6 py-2 rounded-full ${activeTab === 'Semua' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container'} transition-colors font-medium`}>Semua Varian</button>
                        <button onClick={() => setActiveTab('donuts')} className={`px-6 py-2 rounded-full ${activeTab === 'donuts' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-secondary-container'} transition-colors font-medium`}>Donuts</button>
                        <button onClick={() => setActiveTab('mochi')} className={`px-6 py-2 rounded-full ${activeTab === 'mochi' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-primary-container'} transition-colors font-medium`}>Mochi</button>
                        <button onClick={() => setActiveTab('minuman')} className={`px-6 py-2 rounded-full ${activeTab === 'minuman' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-tertiary-container'} transition-colors font-medium`}>Minuman</button>
                    </div>
                    {/* Bento Grid Menu */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center">
                                <p className="text-on-surface-variant">Tidak ada produk</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const currentStockData = product.stocks?.find((stock) => stock.branch_id === activeBranch?.id);
                                const currentStock = currentStockData ? currentStockData.stock : 0;
                                return (
                                    <div key={product.id} className="group relative bg-surface-container-lowest rounded-[24px] p-3 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 border border-transparent hover:border-primary/10">
                                        {/* Favorite Button Overlay */}
                                        <button
                                            onClick={() => toggleFavorite(product.id)}

                                            className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90"
                                        >
                                            <span className={`material-symbols-outlined text-[20px] transition-colors ${favorites.includes(product.id) ? 'fill-1 text-red-500' : 'text-on-surface-variant'}`}>
                                                favorite
                                            </span>
                                        </button>

                                        {/* Product Image */}
                                        <div className="aspect-square mb-4 overflow-hidden rounded-[20px] bg-surface-container-low">
                                            <img
                                                alt={product.nama}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                src={product.gambar}
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="px-1">
                                            <div className="flex flex-col mb-3">
                                                <div className="flex justify-between items-center gap-2 mb-2">
                                                    <h3 className="text-sm font-bold text-primary line-clamp-1 group-hover:text-secondary transition-colors">
                                                        {product.nama}
                                                    </h3>

                                                    {/* Badge Stok Responsif */}
                                                    <span className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-black tracking-wider rounded-full uppercase ${currentStock === 0
                                                        ? 'bg-red-100 text-red-500' // Merah kalau habis
                                                        : currentStock <= 10
                                                            ? 'bg-orange-100 text-orange-600 animate-pulse' // Orange kedap-kedip kalau mau habis (FOMO)
                                                            : 'bg-primary/15 text-primary' // Warna normal kalau stok banyak
                                                        }`}>
                                                        {currentStock === 0 ? 'SOLD OUT' : `Sisa ${currentStock}`}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-on-surface-variant line-clamp-1 opacity-70 italic">{product.deskripsi}</p>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <span className="text-base font-black text-primary">
                                                    Rp {Number(product.harga).toLocaleString('id-ID')}
                                                </span>
                                                <button
                                                    onClick={() => handleAddProduct(product)}
                                                    className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl text-[11px] font-black transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {product.tipe === 'paket' ? 'grid_view' : 'add_shopping_cart'}
                                                    </span>
                                                    {product.tipe === 'paket' ? 'Pilih Isi Box' : 'Tambah'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                )
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Order Section */}
            <section className="py-24 px-8" id="order">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* KIRI: Daftar Belanja */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-3xl font-black text-primary italic">Detail Pesanan</h2>
                        {cart.length === 0 ? (
                            <div className="p-10 bg-surface-container rounded-3xl text-center border-2 border-dashed border-on-surface-variant/20">
                                <p className="text-on-surface-variant">Keranjang belanja masih kosong...</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.uniqueId || item.id} className="bg-white p-5 rounded-3xl border border-on-surface-variant/10 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:shadow-md hover:border-primary/20 transition-all">
                                    <div className="flex gap-4 items-center w-full">
                                        <div className="flex-shrink-0 w-12 h-12 bg-primary/5 rounded-2xl text-primary font-black text-lg flex items-center justify-center">
                                            {item.qty}x
                                        </div>

                                        <div className="flex-1 flex gap-4 items-center">
                                            {/* Thumbnail / Gambar Utama */}
                                            <img src={item.gambar} alt={item.nama} className="w-14 h-14 md:w-16 md:h-16 rounded-xl object-cover shadow-sm bg-surface-container" />

                                            <div className="flex flex-col justify-center py-1">
                                                <h4 className="font-bold text-primary text-base md:text-lg leading-tight">{item.nama}</h4>
                                                {item.type === 'paket' && (
                                                    <div className="mt-2 flex flex-col gap-1.5">
                                                        {/* Avatar Donat Kecil */}
                                                        <div className="flex -space-x-2.5">
                                                            {Array.from(new Set(item.contents)).slice(0, 5).map((id, index) => {
                                                                const product = products.find(p => p.id === id);
                                                                return product ? (
                                                                    <img key={index} src={product.gambar} alt={product.nama} className="w-6 h-6 md:w-7 md:h-7 rounded-full object-cover shadow-sm border-[1.5px] border-white" />
                                                                ) : null;
                                                            })}
                                                            {new Set(item.contents).size > 5 && (
                                                                <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-surface-container border-[1.5px] border-white flex items-center justify-center text-on-surface-variant font-bold text-[9px] shadow-sm z-10">
                                                                    +{new Set(item.contents).size - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Keterangan Teks */}
                                                        <p className="text-[11px] md:text-xs text-on-surface-variant italic leading-relaxed max-w-[220px] md:max-w-sm m-0">
                                                            {renderContentsText(item.contents)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end border-t sm:border-none border-on-surface-variant/10 pt-4 sm:pt-0">
                                        <span className="font-black text-primary text-lg">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</span>
                                        <button onClick={() => removeFromCart(item)} className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors flex items-center justify-center border border-transparent hover:border-red-100">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* KANAN: Form Pemesan */}
                    <div className="bg-surface-container rounded-3xl p-8 h-fit sticky top-24">
                        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Data Pengiriman</h2>
                        <form onSubmit={handleOrder} className="space-y-4">
                            {/* Input Nama, Telp, Alamat di sini */}
                            {/* Pilihan Delivery / Pickup */}
                            <div className="pt-6 border-t-2 border-dashed border-on-surface-variant/20 mt-6">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-3">Metode Pengiriman</label>
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div
                                            onClick={() => setFormData({ ...formData, delivery_method: 'pickup', alamat: 'Ambil di Toko' })}
                                            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-start gap-1 ${formData.delivery_method === 'pickup' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-on-surface-variant/20 hover:border-primary/50'}`}
                                        >
                                            <span className="material-symbols-outlined text-primary mb-1">storefront</span>
                                            <span className="text-base font-black text-primary">Ambil Sendiri</span>
                                            <span className="text-[11px] font-medium text-on-surface-variant">Gratis Biaya</span>
                                        </div>
                                        <div
                                            onClick={() => setFormData({ ...formData, delivery_method: 'delivery', alamat: '' })}
                                            className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-start gap-1 ${formData.delivery_method === 'delivery' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-on-surface-variant/20 hover:border-primary/50'}`}
                                        >
                                            <span className="material-symbols-outlined text-primary mb-1">local_shipping</span>
                                            <span className="text-base font-black text-primary">Pesan Antar</span>
                                            <span className="text-[11px] font-medium text-on-surface-variant">Kurir Dollin (+8k)</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="nama" className="block text-sm font-bold text-on-surface-variant mb-2">Nama Lengkap</label>
                                    <input required
                                        name="nama"
                                        type="text"
                                        id="nama"
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-on-surface-variant/10 focus:border-primary focus:outline-none"
                                        placeholder="Masukkan nama Anda" />
                                </div>
                                <div>
                                    <label htmlFor="nohp" className="block text-sm font-bold text-on-surface-variant mb-2">No. HP</label>
                                    <input
                                        required
                                        name="nohp"
                                        type="number"
                                        id="nohp"
                                        onChange={(e) => setFormData({ ...formData, nohp: e.target.value })}

                                        className="w-full px-4 py-3 rounded-xl border-2 border-on-surface-variant/10 focus:border-primary focus:outline-none"
                                        placeholder="Masukkan No. HP Anda" />
                                </div>
                                {formData.delivery_method === 'delivery' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="alamat" className="block text-sm font-bold text-on-surface-variant mb-2">Alamat Lengkap Pengiriman</label>
                                            <textarea
                                                required
                                                name="alamat"
                                                id="alamat"
                                                value={formData.alamat}
                                                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-on-surface-variant/10 focus:border-primary focus:outline-none min-h-[80px]"
                                                placeholder="Tuliskan alamat lengkap Anda (Jalan, RT/RW, Patokan)" />
                                        </div>

                                        {/* Titik Lokasi Peta */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <label className="block text-sm font-bold text-on-surface-variant">Titik Lokasi Pengiriman</label>
                                                    <p className="text-[10px] text-on-surface-variant">Tandai lokasi akurat rumah Anda pada peta.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleLocateMe}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-all border border-primary/20"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">my_location</span>
                                                    Gunakan Lokasi Saya
                                                </button>
                                            </div>
                                            <div className="h-48 w-full rounded-2xl overflow-hidden border-2 border-on-surface-variant/10 z-0 relative bg-surface-container flex items-center justify-center">
                                                <Suspense fallback={<div className="text-xs animate-pulse">Memuat Peta...</div>}>
                                                    <MapPicker
                                                        latitude={formData.latitude || activeBranch?.latitude}
                                                        longitude={formData.longitude || activeBranch?.longitude}
                                                        onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                                                        branchPosition={[activeBranch?.latitude, activeBranch?.longitude]}
                                                        mapKey="buyer-map"
                                                    />
                                                </Suspense>
                                            </div>
                                            {formData.latitude && (
                                                <div className="mt-2 flex items-center gap-1 text-[10px] text-green-600 font-bold">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    Titik lokasi berhasil ditandai
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="payment_method" className="block text-sm font-bold text-on-surface-variant mb-3">Metode Pembayaran</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'qris', name: 'QRIS / GoPay', type: 'Instant Payment', color: 'text-green-600' },
                                            { id: 'bca_va', name: 'BCA', type: 'Virtual Account', color: 'text-[#0066AE]' },
                                            { id: 'bri_va', name: 'BRI', type: 'Virtual Account', color: 'text-[#00529C]' }
                                        ].map((method) => (
                                            <div
                                                key={method.id}
                                                onClick={() => setFormData({ ...formData, payment_method: method.id })}
                                                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-start justify-center gap-1 group overflow-hidden ${formData.payment_method === method.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-on-surface-variant/20 hover:border-primary/50 bg-surface'}`}
                                            >
                                                <span className={`text-base font-black ${method.color}`}>{method.name}</span>
                                                <span className="text-[11px] font-medium text-on-surface-variant">{method.type}</span>

                                                {/* Indikator Aktif (Ceklis) */}
                                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.payment_method === method.id ? 'border-primary bg-primary' : 'border-on-surface-variant/30'}`}>
                                                    {formData.payment_method === method.id && (
                                                        <svg className="w-3 h-3 text-on-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formData.payment_method === '' && (
                                        <p className="text-red-500 text-xs mt-2 font-medium">* Silakan pilih metode pembayaran terlebih dahulu</p>
                                    )}
                                </div>
                                {/* Rincian Pembayaran */}
                                <div className="bg-surface-container-low p-4 rounded-xl mt-4 mb-6 border border-on-surface-variant/10">
                                    <h3 className="text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Rincian Harga</h3>
                                    <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-on-surface-variant/20">
                                        {
                                            cart.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span className="text-on-surface line-clamp-1 pr-4">{item.qty}x {item.nama}</span>
                                                    <span className="text-on-surface font-medium whitespace-nowrap">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</span>
                                                </div>
                                            ))

                                        }
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-on-surface-variant border-b border-on-surface-variant/10 pb-2 mb-2">
                                        <span>Biaya Admin (1%)</span>
                                        <span>Rp {adminFee.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium text-on-surface-variant">
                                        <div className="flex flex-col">
                                            <span>Ongkos Kirim</span>
                                            {distance > 0 && <span className="text-[10px] text-primary">Jarak: {distance.toFixed(1)} km</span>}
                                            {formData.delivery_method === 'delivery' && !activeBranch?.latitude && (
                                                <span className="text-[9px] text-red-500 font-bold">Lokasi cabang belum diset Owner</span>
                                            )}
                                        </div>
                                        <span>{deliveryFee > 0 ? `Rp ${deliveryFee.toLocaleString('id-ID')}` : (formData.delivery_method === 'delivery' && distance === 0 ? 'Pilih lokasi...' : 'Gratis')}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center my-6">
                                    <span className="text-on-surface font-bold text-xl">Total Pembayaran</span>
                                    <span className="text-2xl font-black text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                </div>
                                <button disabled={isProcessing} className={`w-full py-5 text-on-primary rounded-2xl font-black text-lg transition-all cursor-pointer ${isProcessing ? 'bg-primary/50 shadow-none cursor-not-allowed' : 'bg-primary shadow-xl hover:-translate-y-1 shadow-primary/20'}`}>
                                    {isProcessing ? 'Memproses...' : 'Pesan Sekarang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* MODAL PEMBANGUN KOTAK */}
            {configuringBox && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300">
                        {/* Header Modal */}
                        <div className="p-6 border-b border-on-surface-variant/10 flex justify-between items-center bg-orange-50">
                            <div>
                                <h2 className="text-2xl font-bold text-primary">{configuringBox.nama}</h2>
                                <p className="text-sm font-semibold text-on-surface-variant">
                                    Pilih {configuringBox.jumlah_pilihan} donat favoritmu ({selectedBoxItems.length}/{configuringBox.jumlah_pilihan})
                                </p>
                            </div>
                            <button onClick={() => setConfiguringBox(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* List Donat yang tersedia untuk Paket ini */}
                        <div className="p-6 max-h-[50vh] overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                            {((configuringBox.packageItems || configuringBox.package_items) || []).map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItemInBox(item.id)}
                                    className={`cursor-pointer group flex flex-col items-center p-3 rounded-2xl border-2 transition-all relative ${selectedBoxItems.filter(id => id === item.id).length > 0 ? 'border-primary bg-primary/5 shadow-md scale-105' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <div className="relative">
                                        <img src={item.gambar} className="w-20 h-20 rounded-full object-cover shadow-sm mb-2 group-hover:scale-110 transition-transform" />
                                        {/* Counter per item */}
                                        {selectedBoxItems.filter(id => id === item.id).length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce-short">
                                                {selectedBoxItems.filter(id => id === item.id).length}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black text-center text-primary uppercase leading-tight">{item.nama}</span>
                                </div>
                            ))}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-6 bg-gray-50 border-t border-on-surface-variant/10 flex flex-col gap-4">
                            {/* Progress Bar Mini */}
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${(selectedBoxItems.length / configuringBox.jumlah_pilihan) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center">
                                <button onClick={() => setSelectedBoxItems([])} className="text-red-500 font-bold text-sm hover:underline">Reset Pilihan</button>
                                <button
                                    disabled={selectedBoxItems.length !== configuringBox.jumlah_pilihan}
                                    onClick={() => {
                                        addToCart(configuringBox);
                                    }}
                                    className={`px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg ${selectedBoxItems.length === configuringBox.jumlah_pilihan ? 'bg-primary text-white hover:-translate-y-1' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    Konfirmasi Isi Box
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PEMILIHAN WHATSAPP */}
            {showWaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
                    <div className="bg-surface-container-highest max-w-sm w-full rounded-3xl p-8 shadow-2xl border border-white/20 transform animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.031 2C6.49 2 2 6.491 2 12.032c0 1.761.463 3.483 1.341 5.002L2 22l5.122-1.343a9.99 9.99 0 004.908 1.282h.004c5.539 0 10.038-4.493 10.038-10.036 0-2.685-1.045-5.21-2.943-7.108C17.227 2.894 14.71 1.848 12.035 1.848zm0 1.687c2.253 0 4.37.878 5.962 2.47a8.423 8.423 0 012.467 5.964c0 4.652-3.784 8.435-8.438 8.435h-.003c-1.503 0-2.977-.393-4.269-1.137l-.307-.179-3.17.83.844-3.093-.198-.313a8.383 8.383 0 01-1.28-4.544c0-4.654 3.785-8.436 8.441-8.436zm4.646 6.353c-.255-.128-1.506-.745-1.74-.83-.233-.086-.402-.128-.573.128-.17.255-.658.83-.807 1-.148.17-.297.192-.552.064-.255-.128-1.077-.397-2.05-1.264-.757-.674-1.268-1.506-1.416-1.762-.148-.255-.016-.393.111-.52.115-.115.255-.297.382-.446.128-.148.17-.255.255-.425.085-.17.043-.318-.021-.446-.064-.128-.574-1.383-.787-1.894-.207-.496-.418-.429-.573-.437-.148-.008-.319-.009-.489-.009-.17 0-.446.064-.68.319-.234.255-.893.873-.893 2.128 0 1.256.915 2.47 1.042 2.641.128.17 1.8 2.746 4.364 3.854.61.263 1.085.42 1.455.538.613.195 1.17.168 1.611.101.492-.074 1.507-.616 1.719-1.21.213-.594.213-1.104.149-1.21-.064-.106-.234-.17-.489-.297z" clipRule="evenodd" /></svg>
                                Hubungi Kami
                            </h3>
                            <button onClick={() => setShowWaModal(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors"><span className="material-symbols-outlined text-lg">close</span></button>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-6 relative -top-2">Pilih salah satu nomor cabang di bawah ini.</p>
                        <div className="flex flex-col gap-3">
                            <a href="https://wa.me/6285123793693" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all font-bold text-on-surface hover:text-primary">
                                <span>WhatsApp 1</span>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                            <a href="https://wa.me/6285126683156" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all font-bold text-on-surface hover:text-primary">
                                <span>WhatsApp 2</span>
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="w-full py-12 px-8 bg-[#dcd4c0] dark:bg-[#25211a] text-[#76543d] dark:text-[#fef6e7]" id="contact">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
                    <div>
                        <span className="text-lg font-bold text-[#76543d] brand-font">Dollin Donuts</span>
                        <p className="text-xs uppercase tracking-widest mt-2">Feeling Fluffy.</p>
                    </div>
                    <div className="flex justify-center gap-6 items-center">
                        <a className="text-[#76543d]/60 dark:text-[#dcd4c0]/60 hover:text-[#76543d] dark:hover:text-[#fef6e7] transition-colors" href="https://www.instagram.com/dollin.donuts?igsh=ZnJub282NGR1emUy" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                            </svg>
                        </a>
                        <button onClick={() => setShowWaModal(true)} className="text-[#76543d]/60 dark:text-[#dcd4c0]/60 hover:text-[#76543d] dark:hover:text-[#fef6e7] transition-colors" aria-label="WhatsApp">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.031 2C6.49 2 2 6.491 2 12.032c0 1.761.463 3.483 1.341 5.002L2 22l5.122-1.343a9.99 9.99 0 004.908 1.282h.004c5.539 0 10.038-4.493 10.038-10.036 0-2.685-1.045-5.21-2.943-7.108C17.227 2.894 14.71 1.848 12.035 1.848v.152zm0 1.687c2.253 0 4.37.878 5.962 2.47a8.423 8.423 0 012.467 5.964c0 4.652-3.784 8.435-8.438 8.435h-.003c-1.503 0-2.977-.393-4.269-1.137l-.307-.179-3.17.83.844-3.093-.198-.313a8.383 8.383 0 01-1.28-4.544c0-4.654 3.785-8.436 8.441-8.436zm4.646 6.353c-.255-.128-1.506-.745-1.74-.83-.233-.086-.402-.128-.573.128-.17.255-.658.83-.807 1-.148.17-.297.192-.552.064-.255-.128-1.077-.397-2.05-1.264-.757-.674-1.268-1.506-1.416-1.762-.148-.255-.016-.393.111-.52.115-.115.255-.297.382-.446.128-.148.17-.255.255-.425.085-.17.043-.318-.021-.446-.064-.128-.574-1.383-.787-1.894-.207-.496-.418-.429-.573-.437-.148-.008-.319-.009-.489-.009-.17 0-.446.064-.68.319-.234.255-.893.873-.893 2.128 0 1.256.915 2.47 1.042 2.641.128.17 1.8 2.746 4.364 3.854.61.263 1.085.42 1.455.538.613.195 1.17.168 1.611.101.492-.074 1.507-.616 1.719-1.21.213-.594.213-1.104.149-1.21-.064-.106-.234-.17-.489-.297z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <a className="text-[#76543d]/60 dark:text-[#dcd4c0]/60 hover:text-[#76543d] dark:hover:text-[#fef6e7] transition-colors" href="https://www.tiktok.com/@dollin.donuts?_r=1&_t=ZS-95jzkCV7I2O" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 448 512" aria-hidden="true">
                                <path d="M448 209.91a210.06 210.06 0 01-122.77-39.25v178.72A162.55 162.55 0 11185 188.31v89.89a74.62 74.62 0 1052.23 71.18V0h88a121.18 121.18 0 001.86 22.17A122.18 122.18 0 00381 102.39a121.43 121.43 0 0067 20.14z" />
                            </svg>
                        </a>
                    </div>
                    <div className="md:text-right">
                        <p className="text-xs font-semibold">© 2026 Dollin Donuts. All rights reserved.</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}