import { Link } from '@inertiajs/react';

export default function Navbar({ branches, activeBranch, setActiveBranch, showBranchModal, setShowBranchModal }) {
    return (
        <>
            {/* TopNavBar */}
            <nav className="fixed top-0 w-full z-50 bg-[#fef6e7]/80 dark:bg-[#322e25]/80 backdrop-blur-xl shadow-sm dark:shadow-none">
                <div className="relative flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
                    <span className="text-2xl font-bold tracking-tight text-[#76543d] dark:text-[#fef6e7] brand-font">Dollin Donuts</span>
                    <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
                        <Link href="/" className="text-[#76543d] hover:font-bold hover:border-b-2 hover:border-[#76543d] pb-1 body-md cursor-pointer transition-opacity duration-300">Menu</Link>
                        <Link href="/Pesanan" className="text-[#76543d] hover:font-bold hover:border-b-2 hover:border-[#76543d] pb-1 body-md cursor-pointer transition-all duration-100">Status Pesanan</Link>
                    </div>
                    <div className="flex items-end gap-4">
                        <div>
                            <span className='text-xs font-bold text-on-surface-variant tracking-widest'>LOKASI PENGAMBILAN: </span>
                            <h3 className='text-lg font-bold text-primary'>{activeBranch?.nama || 'Pilih Outlet'}</h3>
                        </div>
                        <button
                            onClick={() => setShowBranchModal(true)}
                            className="ml-2 py-1 text-xs font-bold text-on-surface-variant hover:text-primary underline decoration-dotted underline-offset-4 transition-colors"
                        >
                            Ganti
                        </button>
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
