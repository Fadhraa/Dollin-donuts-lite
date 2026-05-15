import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";
import AdminNav from "../layouts/admin_nav";

function Couriers({ auth, couriers = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" atau "edit"
    
    // Form management using Inertia
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: "",
        name: "",
        email: "",
        password: "",
    });

    const openAddModal = () => {
        reset();
        setModalMode("add");
        setIsModalOpen(true);
    };

    const openEditModal = (courier) => {
        setData({
            id: courier.id,
            name: courier.name,
            email: courier.email,
            password: "", // Kosongkan password saat edit, isi jika ingin diganti
        });
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalMode === "add") {
            post('/admin/couriers', {
                onSuccess: () => closeModal(),
            });
        } else {
            put(`/admin/couriers/${data.id}`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id, name) => {
        if (confirm(`Apakah Anda yakin ingin menghapus kurir ${name}? Data tidak dapat dikembalikan.`)) {
            destroy(`/admin/couriers/${id}`);
        }
    };

    return (
        <>
            <Head title="Kelola Kurir - Admin Cabang" />
            <div className="relative bg-background text-on-background antialiased selection:bg-primary-container min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-on-surface mb-1 tracking-wide">Kelola Kurir</h1>
                            <p className="text-base text-on-surface">Manajemen data tim pengantar (driver) khusus cabang ini</p>
                        </div>
                        <button 
                            onClick={openAddModal}
                            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                        >
                            <span className="material-symbols-outlined">add</span> Tambah Kurir
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10">
                            <span className="text-on-surface-variant font-semibold text-xs uppercase mb-1 block">Total Kurir Terdaftar</span>
                            <div className="text-3xl font-bold text-primary">{couriers.length}</div>
                        </div>
                    </div>

                    {/* Tabel Kurir */}
                    <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden border border-outline-variant/10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low">
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider w-20">ID</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Nama Lengkap</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Email (Username)</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {couriers.length > 0 ? couriers.map((courier) => (
                                        <tr key={courier.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-6 font-bold text-primary">#{courier.id}</td>
                                            <td className="px-6 py-6">
                                                <span className="font-semibold text-on-surface">{courier.name}</span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-sm font-medium text-on-surface-variant max-w-xs truncate" title={courier.email}>
                                                    {courier.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openEditModal(courier)}
                                                        className="p-2 text-stone-400 hover:text-primary transition-colors"
                                                        title="Edit Data Kurir"
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(courier.id, courier.name)}
                                                        className="p-2 text-stone-400 hover:text-error transition-colors"
                                                        title="Hapus Kurir"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-on-surface-variant">Belum ada kurir yang terdaftar.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-primary">
                            <h2 className="text-xl font-bold text-on-primary">
                                {modalMode === 'add' ? 'Tambah Kurir Baru' : 'Edit Data Kurir'}
                            </h2>
                            <span onClick={closeModal} className="material-symbols-outlined text-on-primary cursor-pointer hover:text-on-error transition-colors">close</span>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Nama Lengkap</label>
                                    <input 
                                        type="text" 
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Contoh: Budi Santoso"
                                        required
                                    />
                                    {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Email (Untuk Login)</label>
                                    <input 
                                        type="email" 
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Contoh: budi_kurir@dollin.com"
                                        required
                                    />
                                    {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">
                                        Password {modalMode === 'edit' && <span className="text-xs font-normal text-on-surface-variant ml-2">(Kosongkan jika tidak ingin mengubah password)</span>}
                                    </label>
                                    <input 
                                        type="password" 
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Minimal 6 karakter"
                                        required={modalMode === 'add'}
                                        minLength="6"
                                    />
                                    {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={closeModal}
                                    className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Data'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Couriers.layout = page => <AdminNav children={page} />;
export default Couriers;
