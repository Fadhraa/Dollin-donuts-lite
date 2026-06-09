import { Head, router, useForm } from "@inertiajs/react";
import { useState, Suspense, lazy } from "react";
import OwnerNav from "../layouts/owner_nav";

const MapPicker = lazy(() => import('../../Components/MapPicker'));

function Branches({ auth, branches = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" atau "edit"

    // Form management using Inertia
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: "",
        nama: "",
        alamat: "",
        admin_email: "",
        admin_password: "",
        nohp: "+62",
        is_active: 1,
        latitude: -6.2088, // Default Jakarta
        longitude: 106.8456,
    });

    const openAddModal = () => {
        reset();
        setModalMode("add");
        setIsModalOpen(true);
    };

    const openEditModal = (branch) => {
        setData({
            id: branch.id,
            nama: branch.nama,
            alamat: branch.alamat,
            admin_email: branch.users?.[0]?.email || "",
            admin_password: "", // Kosongkan password saat edit, isi jika ingin diganti
            nohp: branch.nohp || "+62",
            is_active: branch.is_active,
            latitude: branch.latitude ? parseFloat(branch.latitude) : -6.2088,
            longitude: branch.longitude ? parseFloat(branch.longitude) : 106.8456,
        });
        setModalMode("edit");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };
    const handlePhoneChange = (e) => {
        let value = e.target.value;

        // Pastikan input selalu diawali dengan "+62"
        if (!value.startsWith("+62")) {
            // Jika user mencoba menghapus "+62", paksa tetap "+62"
            value = "+62";
        }

        // Hanya perbolehkan karakter angka setelah awalan "+62"
        const prefix = "+62";
        const suffix = value.slice(3).replace(/\D/g, ""); // Menghapus semua karakter non-angka setelah +62

        setData("nohp", prefix + suffix);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalMode === "add") {
            post('/owner/branches', {
                onSuccess: () => closeModal(),
            });
        } else {
            put(`/owner/branches/${data.id}`, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id, nama) => {
        if (confirm(`Apakah Anda yakin ingin menghapus cabang ${nama}? Data tidak dapat dikembalikan.`)) {
            destroy(`/owner/branches/${id}`);
        }
    };

    return (
        <>
            <Head title="Kelola Cabang - Owner" />
            <div className="relative bg-background text-on-background antialiased selection:bg-primary-container min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    {errors.message && (
                        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
                            <span className="material-symbols-outlined text-error">warning</span>
                            <div className="text-error font-medium text-sm">{errors.message}</div>
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-on-surface mb-1 tracking-wide">Kelola Cabang</h1>
                            <p className="text-base text-on-surface">Manajemen data cabang dan lokasi operasional toko</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                        >
                            <span className="material-symbols-outlined">add</span> Tambah Cabang
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant/10">
                            <span className="text-on-surface-variant font-semibold text-xs uppercase mb-1 block">Total Cabang Aktif</span>
                            <div className="text-3xl font-bold text-primary">{branches.length}</div>
                        </div>

                    </div>

                    {/* Tabel Cabang */}
                    <div className="bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden border border-outline-variant/10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-surface-container-low">
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider w-20">ID</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Nama Cabang</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider w-1/3">Alamat Lengkap</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">No. HP</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-5 text-sm font-bold text-primary header-anchor uppercase tracking-wider text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container">
                                    {branches.length > 0 ? branches.map((branch) => (
                                        <tr key={branch.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-6 font-bold text-primary">#{branch.id}</td>
                                            <td className="px-6 py-6">
                                                <span className="font-semibold text-on-surface">{branch.nama}</span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-sm font-medium text-on-surface-variant max-w-xs truncate" title={branch.alamat}>
                                                    {branch.alamat}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-sm font-medium text-on-surface-variant max-w-xs truncate" title={branch.nohp}>
                                                    {branch.nohp}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {branch.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(branch)}
                                                        className="p-2 text-stone-400 hover:text-primary transition-colors"
                                                        title="Edit Cabang"
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(branch.id, branch.nama)}
                                                        className="p-2 text-stone-400 hover:text-error transition-colors"
                                                        title="Hapus Cabang"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-on-surface-variant">Belum ada cabang yang terdaftar.</td>
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
                    <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-primary shrink-0">
                            <h2 className="text-xl font-bold text-on-primary">
                                {modalMode === 'add' ? 'Tambah Cabang Baru' : 'Edit Data Cabang'}
                            </h2>
                            <span onClick={closeModal} className="material-symbols-outlined text-on-primary cursor-pointer hover:text-on-error transition-colors ">close</span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Nama Cabang</label>
                                    <input
                                        type="text"
                                        value={data.nama}
                                        onChange={e => setData('nama', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Contoh: Dollin Sudirman"
                                        required
                                    />
                                    {errors.nama && <p className="text-error text-xs mt-1">{errors.nama}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Alamat Lengkap</label>
                                    <textarea
                                        value={data.alamat}
                                        onChange={e => setData('alamat', e.target.value)}
                                        className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[80px]"
                                        placeholder="Tuliskan alamat lengkap dengan kode pos..."
                                        required
                                    ></textarea>
                                    {errors.alamat && <p className="text-error text-xs mt-1">{errors.alamat}</p>}
                                </div>

                                {/* Map untuk Lokasi Cabang */}
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Tandai Lokasi Cabang di Peta</label>
                                    <p className="text-xs text-on-surface-variant mb-2 italic">Geser atau klik peta untuk menentukan titik akurat cabang.</p>
                                    <div className="h-48 w-full rounded-xl overflow-hidden border border-outline-variant/30 z-0 relative bg-surface-container flex items-center justify-center">
                                        {isModalOpen && (
                                            <Suspense fallback={<div className="text-xs text-on-surface-variant animate-pulse">Memuat Peta...</div>}>
                                                <MapPicker
                                                    mapKey={`${data.id}-${modalMode}`}
                                                    latitude={data.latitude}
                                                    longitude={data.longitude}
                                                    onChange={(lat, lng) => setData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                                                />
                                            </Suspense>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant/70 mt-1 mb-3">Koordinat Terpilih: {data.latitude}, {data.longitude}</p>
                                    <div>
                                        <label className="block text-sm font-bold text-on-surface-variant mb-2">No. HP Cabang</label>
                                        <input className="w-full mb-3 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" id="nohp" value={data.nohp} onChange={handlePhoneChange} type="text" placeholder="0853277434567" />
                                    </div>
                                    {/* Input Manual Koordinat */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Latitude</label>
                                            <input
                                                type="text"
                                                value={data.latitude}
                                                onChange={e => setData('latitude', e.target.value)}
                                                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                                placeholder="Contoh: -6.12345"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Longitude</label>
                                            <input
                                                type="text"
                                                value={data.longitude}
                                                onChange={e => setData('longitude', e.target.value)}
                                                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                                placeholder="Contoh: 106.12345"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-on-surface-variant/60 mt-1 italic">*Atau tempel koordinat dari Google Maps ke kolom di atas.</p>
                                </div>

                                {modalMode === 'edit' && (
                                    <div>
                                        <label className="block text-sm font-bold text-on-surface-variant mb-2">Status Cabang</label>
                                        <select
                                            value={data.is_active}
                                            onChange={e => setData('is_active', parseInt(e.target.value))}
                                            className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        >
                                            <option value={1}>Aktif (Beroperasi)</option>
                                            <option value={0}>Nonaktif (Tutup Sementara/Permanen)</option>
                                        </select>
                                    </div>
                                )}

                                {/* Divider Data Admin */}
                                <div className="border-t border-outline-variant/20 pt-4 mt-2">
                                    <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Data Login Admin Cabang</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-on-surface-variant mb-2">Email Admin</label>
                                            <input
                                                type="email"
                                                value={data.admin_email}
                                                onChange={e => setData('admin_email', e.target.value)}
                                                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="Contoh: dollin_sudirman@gmail.com"
                                                required
                                            />
                                            {errors.admin_email && <p className="text-error text-xs mt-1">{errors.admin_email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-on-surface-variant mb-2">
                                                Password Admin {modalMode === 'edit' && <span className="text-xs font-normal text-on-surface-variant/70 ml-1">(Kosongkan jika tidak ingin diubah)</span>}
                                            </label>
                                            <input
                                                type="password"
                                                value={data.admin_password}
                                                onChange={e => setData('admin_password', e.target.value)}
                                                className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder={modalMode === 'add' ? "Minimal 6 karakter" : "Ketik password baru jika ingin diubah..."}
                                                required={modalMode === 'add'}
                                            />
                                            {errors.admin_password && <p className="text-error text-xs mt-1">{errors.admin_password}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 justify-end">
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
                                    className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                                    Simpan Cabang
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

Branches.layout = page => <OwnerNav children={page} />;
export default Branches;
