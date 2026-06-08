import OwnerNav from "../layouts/owner_nav";
import { useState } from "react";
import { useForm, router } from "@inertiajs/react";

function Products({ products = [], satuanProducts = [] }) {
    const [modalProduct, setModalProduct] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [oldGambar, setOldGambar] = useState(null);
    const { data, setData, post, processing, errors, reset } = useForm({
        _method: "post",
        nama: "",
        harga: "",
        stok: 0,
        deskripsi: "",
        is_active: true,
        is_favorite: false,
        is_new: false,
        tipe: "satuan",
        kategori: "donuts",
        gambar: null,
        jumlah_pilihan: "",
        package_items: [],
    });

    // Fungsi canggih untuk mencentang array donat varian paket
    const togglePackageItem = (id) => {
        let items = [...data.package_items];
        if (items.includes(id)) {
            items = items.filter(i => i !== id);
        } else {
            items.push(id);
        }
        setData('package_items', items);
    };
    const editProduct = (product) => {
        setIsEdit(true);
        setEditId(product.id);
        setOldGambar(product.gambar);
        setData(
            {
                nama: product.nama,
                harga: product.harga,
                stok: product.stok,
                deskripsi: product.deskripsi || "",
                is_active: product.is_active,
                is_favorite: product.is_favorite,
                is_new: product.is_new,
                tipe: product.tipe,
                kategori: product.kategori,
                gambar: null,
                jumlah_pilihan: product.jumlah_pilihan || "",
                package_items: product.package_items || [],
                _method: 'PUT',
            }
        );
        setModalProduct(true);
    }
    const deleteProduct = (id) => {
        if (confirm("Yakin mau hapus produk ini? Data tidak bisa kembali!")) {
            router.delete(`/owner/products/${id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    alert("Produk berhasil dihapus!");
                },
            });
        }
    };
    const submitData = (e) => {
        e.preventDefault();
        if (isEdit) {
            post(`/owner/products/${editId}`, {
                forceFormData: true,
                onSuccess: () => {
                    setModalProduct(false);
                    reset();
                },
            });
        } else {
            post('/owner/products', {
                forceFormData: true,
                onSuccess: () => {
                    setModalProduct(false);
                    reset();
                },
            });
        }
    }

    const openModalProduct = () => {
        setIsEdit(false);
        setEditId(null);
        setOldGambar(null);
        reset();
        setModalProduct(true);
    }

    const closeModal = () => {
        setModalProduct(false);
        setIsEdit(false);
        setEditId(null);
        setOldGambar(null);
        reset();
    }
    return (
        <>
            <div className="p-8 max-w-7xl mx-auto min-h-screen text-on-surface bg-background text-on-background">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Produk Manajemen</h1>
                </div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p>Ayo buat produk baru yang menarik untuk pelanggan</p>
                    </div>
                    <div
                        onClick={openModalProduct}
                        className="flex items-center gap-2 bg-primary px-5 py-3 rounded-2xl cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <span className="material-symbols-outlined bg-on-primary text-primary rounded-full p-1 text-sm font-bold group-hover: transition-transform">add</span>
                        <button className="text-on-primary font-bold tracking-wide">Tambah Produk</button>
                    </div>
                </div>

                {/* modal tambah product */}
                <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${modalProduct ? "bg-black/60 backdrop-blur-md opacity-100" : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"}`}>
                    <div className={`bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${modalProduct ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                        {/* Header Modal */}
                        <div className="bg-surface p-6 border-b border-on-surface-variant/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-primary tracking-wide">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
                                <p className="text-sm font-medium text-on-surface-variant mt-1">Lengkapi form di bawah untuk menambahkan donat ke menu.</p>
                            </div>
                            <button onClick={() => setModalProduct(false)} className="text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Form Modal */}
                        <form onSubmit={submitData}>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">

                                {/* Nama Produk */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Nama Produk</label>
                                    <input type="text" value={data.nama} onChange={e => setData('nama', e.target.value)} placeholder="Contoh: Choco Melt Donut" className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-2 text-sm outline-none" />
                                    {errors.nama && <span className="text-red-500 text-xs">{errors.nama}</span>}
                                </div>

                                {/* Harga & Stok */}
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Harga (Rp)</label>
                                    <input type="number" value={data.harga} onChange={e => setData('harga', e.target.value)} placeholder="0" className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-2 text-sm outline-none" />
                                    {errors.harga && <span className="text-red-500 text-xs">{errors.harga}</span>}
                                </div>

                                {/* Kategori & Tipe */}
                                {data.tipe === 'satuan' && (
                                    <div>
                                        <label className="block text-sm font-bold text-on-surface-variant mb-1">Kategori</label>
                                        <select value={data.kategori} onChange={e => setData('kategori', e.target.value)} className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-2 text-sm outline-none">
                                            <option value="donuts">Donuts</option>
                                            <option value="mochi">Mochi</option>
                                            <option value="minuman">Minuman</option>

                                        </select>
                                        {errors.kategori && <span className="text-red-500 text-xs">{errors.kategori}</span>}
                                    </div>
                                )}
                                <div className={data.tipe === 'paket' ? "md:col-span-2" : ""}>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Tipe Penjualan</label>
                                    <select disabled={isEdit} value={data.tipe} onChange={e => {
                                        setData('tipe', e.target.value);
                                        if (e.target.value === 'satuan') {
                                            setData('jumlah_pilihan', "");
                                            setData('package_items', []);
                                        }
                                    }} className="disabled:bg-surface-container/50 w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-2 text-sm outline-none">
                                        <option value="satuan">Satuan</option>
                                        <option value="paket">Paket / Kotak</option>
                                    </select>
                                    {isEdit && (
                                        <p className="text-xs text-blue-800 mt-1">
                                            Tidak bisa diubah untuk menjaga konsistensi data.
                                        </p>
                                    )}
                                    {errors.tipe && <span className="text-red-500 text-xs">{errors.tipe}</span>}
                                </div>

                                {/* AREA KHUSUS JIKA TIPE == PAKET */}
                                {data.tipe === 'paket' && (
                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-6 bg-primary-container/20 border-2 border-primary/20 rounded-2xl animate-fade-in">
                                        <div className="md:col-span-2">
                                            <h3 className="font-extrabold text-primary mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined">box</span> Setelan Isi Kotak
                                            </h3>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-on-surface-variant mb-1">Berapa potong donat yang bebas dipilih pelanggan untuk paket ini?</label>
                                            <input type="number" value={data.jumlah_pilihan} onChange={e => setData('jumlah_pilihan', e.target.value)} placeholder="Contoh: 3" className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 font-bold text-xl outline-none" required />
                                            {errors.jumlah_pilihan && <span className="text-red-500 text-xs">{errors.jumlah_pilihan}</span>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-on-surface-variant mb-2">Sebutkan donat satuan apa saja yang diizinkan untuk dipilih:</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-on-surface-variant/20 bg-surface rounded-xl max-h-56 overflow-y-auto">
                                                {satuanProducts.length === 0 && (
                                                    <p className="col-span-full text-center text-sm text-on-surface-variant opacity-70 p-4">Belum ada donat satuan. Tambahkan minimal 1 donat satuan terlebih dahulu ya!</p>
                                                )}
                                                {satuanProducts.map(prod => (
                                                    <div
                                                        key={prod.id}
                                                        onClick={() => togglePackageItem(prod.id)}
                                                        className={`cursor-pointer rounded-xl p-3 flex flex-col items-center gap-2 border-2 transition-all relative ${data.package_items.includes(prod.id) ? 'border-primary bg-primary/10 shadow-md transform scale-105' : 'border-on-surface-variant/10 bg-surface hover:bg-surface-variant/50'}`}
                                                    >
                                                        {data.package_items.includes(prod.id) && <span className="absolute -top-2 -right-2 material-symbols-outlined text-primary bg-background rounded-full text-xl shadow-sm">check_circle</span>}
                                                        <img src={prod.gambar} alt={prod.nama} className="w-12 h-12 rounded-full object-cover shadow-sm bg-surface-container" />
                                                        <span className="text-xs text-center font-bold text-on-surface leading-tight">{prod.nama}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {errors.package_items && <span className="text-red-500 text-xs">{errors.package_items}</span>}
                                        </div>
                                    </div>
                                )}

                                {/* Deskripsi */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Deskripsi Produk (Opsional)</label>
                                    <textarea value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} rows="2" className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-2 text-sm outline-none" placeholder="Tuliskan deskripsi lezat donat ini..."></textarea>
                                </div>

                                {/* Togles / Checkboxes */}
                                <div className="md:col-span-2 flex gap-6 p-4 bg-surface-container/30 rounded-xl border border-on-surface-variant/10">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                        <span className="text-sm font-bold text-on-surface">Aktif Dijual</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.is_favorite} onChange={e => setData('is_favorite', e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                        <span className="text-sm font-bold text-on-surface">⭐ Favorit</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.is_new} onChange={e => setData('is_new', e.target.checked)} className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                                        <span className="text-sm font-bold text-on-surface">🆕 Menu Baru</span>
                                    </label>
                                </div>

                                {/* Upload Gambar */}
                                <div className="md:col-span-2 mt-2">
                                    <label className="block text-sm font-bold text-on-surface-variant mb-1">
                                        {data.tipe === 'satuan' ? "Unggah Gambar" : "Unggah Gambar Box (Opsional)"}
                                    </label>
                                    <div className={`group border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-surface-container/50 transition-colors cursor-pointer relative overflow-hidden ${data.gambar || oldGambar ? 'border-primary/50 h-56 hover:border-primary' : 'border-on-surface-variant/30 h-32 hover:bg-surface-container'}`}>
                                        {/* Invisible file input that tightly covers the exact shape wrapper */}
                                        <input type="file" onChange={e => setData('gambar', e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" />

                                        {(data.gambar || oldGambar) ? (
                                            <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                                                <img src={data.gambar ? URL.createObjectURL(data.gambar) : oldGambar} alt="Preview Foto" className="w-full h-full object-cover" />
                                                {/* Ini adalah layer hitam yang muncul saat di-hover */}
                                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <span className="material-symbols-outlined text-white text-3xl mb-1">edit</span>
                                                    <span className="text-white font-bold text-sm">Klik untuk mengganti gambar</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center p-4 z-10 pointer-events-none">
                                                <span className="material-symbols-outlined text-3xl text-primary/60 mb-1">cloud_upload</span>
                                                <p className="text-sm font-bold text-on-surface-variant">Pilih atau Seret gambar ke sini</p>
                                            </div>
                                        )}
                                    </div>
                                    {errors.gambar && <span className="text-red-500 text-xs">{errors.gambar}</span>}
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="flex items-center justify-end gap-3 px-8 py-4 bg-surface-container/30 border-t border-on-surface-variant/10">
                                <button type="button" onClick={closeModal} className="text-on-surface-variant hover:bg-surface-variant px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Batal</button>
                                <button type="submit" disabled={processing} className={`bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}>
                                    <span className="material-symbols-outlined text-sm">{processing ? 'hourglass_empty' : 'save'}</span>
                                    {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* searchbar & filter */}
                <div className="w-full md:w-1/2 bg-surface-container p-2 rounded-2xl flex items-center mt-6">
                    <div className="flex items-center gap-4 w-full px-2">
                        <span className="material-symbols-outlined text-on-surface-variant">search</span>
                        <input type="text" placeholder="Cari donat menu..." className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-2 outline-none" />
                    </div>
                </div>

                {/* Tabel Produk */}
                <div className="w-full bg-surface-container flex items-center mt-6 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full">
                            <thead className="text-xs uppercase bg-primary-container tracking-wider font-bold">
                                <tr className="border-b border-on-surface-variant/10 text-left">
                                    <th className="px-6 py-4 text-center text-on-primary-container font-semibold w-16">No</th>
                                    <th className="px-6 py-4 text-on-primary-container font-semibold">Sajian</th>
                                    <th className="px-6 py-4 text-on-primary-container font-semibold">Kategori</th>
                                    <th className="px-6 py-4 text-on-primary-container font-semibold">Harga</th>
                                    <th className="px-6 py-4 text-on-primary-container font-semibold">Status</th>

                                    <th className="px-6 py-4 text-center text-on-primary-container font-semibold w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-on-surface-variant/10">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant font-medium text-sm">Belum ada produk yang ditambahkan.</td>
                                    </tr>
                                ) : (
                                    products.map((product, index) => (
                                        <tr key={product.id} className="text-on-surface-variant text-xs uppercase tracking-widest font-bold bg-white hover:bg-surface-container/30 transition-colors">
                                            <td className="px-6 py-4 text-center align-middle">{index + 1}</td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-4">
                                                    <img src={product.gambar} alt={product.nama} className="w-12 h-12 rounded-lg object-cover shadow-sm bg-surface-container" />
                                                    <div className="flex flex-col">
                                                        <span className="text-on-surface font-black text-sm">{product.nama}</span>
                                                        <span className="text-[10px] text-primary">{product.kode_produk}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">{product.kategori}</td>
                                            <td className="px-6 py-4 align-middle">Rp {Number(product.harga).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${product.is_active ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                                                    {product.is_active ? 'TERSEDIA' : 'HABIS / OFF'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center align-middle">
                                                <div className="flex gap-3 justify-center items-center">
                                                    <button onClick={() => editProduct(product)} className="text-primary hover:text-primary/80 transition-transform hover:scale-110">
                                                        <span className="text-xl material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:text-red-500/80 transition-transform hover:scale-110">
                                                        <span className="text-xl material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>

    );
}

Products.layout = page => <OwnerNav children={page} />
export default Products;