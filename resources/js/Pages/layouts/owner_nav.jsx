import { Link, usePage } from "@inertiajs/react";

export default function OwnerNav({children}) {
    const { url } = usePage();

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-surface-container flex flex-col border-r border-on-surface-variant/10 shadow-lg z-20 transition-all duration-300">
                {/* Brand Header */}
                <div className="p-8 flex flex-col items-center justify-center border-b border-on-surface-variant/10">
                    <h1 className="text-xl font-black text-primary tracking-widest uppercase">Dollin Donuts</h1>
                    <p className="text-on-surface-variant text-sm font-medium">Dashboard Owner</p>
               </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-3 p-6 flex-grow overflow-y-auto">
                    <Link 
                        href="/owner/dashboard" 
                        className={`px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-4 ${url.startsWith('/owner/dashboard') ? 'bg-primary text-on-primary shadow-md transform scale-105' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-xl">dashboard</span>
                        Dashboard Utama
                    </Link>
                    <Link 
                        href="/owner/branches" 
                        className={`px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-4 ${url.startsWith('/owner/branches') ? 'bg-primary text-on-primary shadow-md transform scale-105' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-xl">store</span>
                        Kelola Cabang
                    </Link>
                    <Link 
                        href="/owner/products" 
                        className={`px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-4 ${url.startsWith('/owner/products') ? 'bg-primary text-on-primary shadow-md transform scale-105' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-xl">inventory_2</span>
                        Menu & Harga
                    </Link>
                    <Link 
                        href="/owner/reports" 
                        className={`px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ease-in-out flex items-center gap-4
                             ${url.startsWith('/owner/reports') ? 'bg-primary text-on-primary shadow-md transform scale-105' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-xl">insights</span>
                        Laporan Global
                    </Link>
                </div>

                {/* Footer Logout */}
                <div className="p-6 border-t border-on-surface-variant/10">
                    <Link 
                        href="/logout"
                        method="post"
                        as="button"
                        className="w-full flex items-center justify-center gap-3 font-extrabold text-red-500 border-2 border-red-500 rounded-xl px-4 py-3 hover:bg-red-500 hover:text-white transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
           
        </div>
    );
}
