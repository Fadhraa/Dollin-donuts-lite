import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Navbar({ branches, activeBranch, setActiveBranch, showBranchModal, setShowBranchModal }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { url } = usePage();
    
    // Logika deteksi aktif yang lebih kuat (menangani parameter URL)
    const isHomeActive = url === '/' || url.startsWith('/?');
    const isPesananActive = url.startsWith('/Pesanan');

    return (
        <>
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-[#fef6e7]/80 dark:bg-[#322e25]/80 backdrop-blur-xl shadow-sm dark:shadow-none">
                <div className="relative flex justify-between items-center px-4 md:px-8 py-2 md:py-4 max-w-7xl mx-auto min-h-[56px] md:min-h-[64px]">
                    {/* Hamburger Button (Mobile Only) */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-[#76543d] hover:bg-primary/5 rounded-xl transition-all flex items-center justify-center"
                        >
                            <span className="material-symbols-outlined text-2xl leading-none">
                                {isMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center">
                        <span className="text-xl md:text-2xl font-bold tracking-tight text-[#76543d] dark:text-[#fef6e7] brand-font shrink-0 leading-none">Dollin Donuts</span>
                    </div>
                    
                    <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 h-full">
                        <Link 
                            href="/" 
                            className={`text-[#76543d] hover:font-bold border-b-2 pb-1 body-md cursor-pointer transition-all duration-300 ${isHomeActive ? 'font-bold border-[#76543d]' : 'border-transparent'}`}
                        >
                            Menu
                        </Link>
                        <Link 
                            href="/Pesanan" 
                            className={`text-[#76543d] hover:font-bold border-b-2 pb-1 body-md cursor-pointer transition-all duration-300 ${isPesananActive ? 'font-bold border-[#76543d]' : 'border-transparent'}`}
                        >
                            Status Pesanan
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 ml-auto h-full">
                        <div className="text-right hidden sm:flex flex-col justify-center">
                            <span className='hidden md:inline text-[10px] font-black text-on-surface-variant tracking-widest uppercase leading-none mb-1'>Outlet: </span>
                            <h3 className='text-xs md:text-lg font-bold text-primary leading-none'>{activeBranch?.nama || 'Pilih Outlet'}</h3>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => setShowBranchModal(true)}
                                className="py-2 px-2 text-[10px] md:text-xs font-bold text-on-surface-variant hover:text-primary underline decoration-dotted underline-offset-4 transition-colors shrink-0 flex items-center"
                            >
                                {activeBranch?.nama ? 'Ganti' : 'Pilih Outlet'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white backdrop-blur-lg border-b border-primary/10 ${isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 space-y-2">
                        <Link 
                            href="/" 
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 font-bold ${isHomeActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant bg-transparent'}`}
                        >
                            <span className="material-symbols-outlined">bakery_dining</span>
                            Beli Donat
                        </Link>
                        <Link 
                            href="/Pesanan" 
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-95 font-bold ${isPesananActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant bg-transparent'}`}
                        >
                            <span className="material-symbols-outlined">receipt_long</span>
                            Status Pesanan
                        </Link>
                        {/* Info Outlet di dalam menu mobile */}
                        <div className="mt-4 p-4 rounded-2xl border border-dashed border-primary/20">
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Outlet Saat Ini:</p>
                            <p className="font-bold text-on-surface">{activeBranch?.nama || 'Belum Memilih'}</p>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Modal Pilih Cabang */}
            {showBranchModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
                    <div className="bg-surface-container-highest max-w-md w-full rounded-3xl p-8 shadow-2xl border border-white/20 transform animate-in zoom-in-95 duration-300">
                        <div className="text-center mb-8">
                            <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-primary text-3xl">location_on</span>
                            </div>
                            <h2 className="text-2xl font-bold text-on-surface">Pilih Outlet Dollin</h2>
                            <p className="text-on-surface-variant mt-2 text-sm">
                                Silahkan pilih outlet terdekat untuk melihat ketersediaan stok donat favoritmu.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {branches && branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        setActiveBranch(branch);
                                        setShowBranchModal(false);
                                        localStorage.setItem('selectedBranch', JSON.stringify(branch));
                                    }}
                                    className="w-full flex items-center p-4 rounded-2xl bg-surface-container-low hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all group text-left"
                                >
                                    <div className="flex-1">
                                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{branch.nama}</h3>
                                        <p className="text-xs text-on-surface-variant line-clamp-1">{branch.alamat}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                                </button>
                            ))}
                        </div>

                        <p className="text-center text-[10px] text-on-surface-variant mt-8 uppercase tracking-widest font-bold">
                            Freshly Baked Every Day
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
