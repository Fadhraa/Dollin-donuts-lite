import AdminNav from "../layouts/admin_nav";
import { useState } from "react";
import { useForm, router, Head } from "@inertiajs/react";

function AdminProducts({ products = [] }) {
    const [modalProduct, setModalProduct] = useState(false);
    const [editId, setEditId] = useState(null);
    const [productName, setProductName] = useState("");
    
    const { data, setData, patch, processing, errors, reset } = useForm({
        stock: 0,
    });

    const openStockModal = (product) => {
        setEditId(product.id);
        setProductName(product.nama);
        setData('stock', product.stocks?.[0]?.stock || 0);
        setModalProduct(true);
    }

    const closeModal = () => {
        setModalProduct(false);
        setEditId(null);
        reset();
    }

    const submitData = (e) => {
        e.preventDefault();
        patch(`/admin/products/${editId}/stock`, {
            onSuccess: () => {
                closeModal();
            },
        });
    }

    return (
        <>
            <Head title="Manajemen Produk - Admin Cabang" />
            <div className="p-8 max-w-7xl mx-auto min-h-screen text-on-surface bg-background">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold">Katalog Produk</h1>
                    <p className="mt-2 text-on-surface-variant">
                        Pantau daftar produk dari pusat dan atur ketersediaan stok khusus untuk cabang Anda.
                    </p>
                </div>

                {/* Modal Update Stok */}
                <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${modalProduct ? "bg-black/60 backdrop-blur-md opacity-100" : "bg-black/0 backdrop-blur-none opacity-0 pointer-events-none"}`}>
                    <div className={`bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 ${modalProduct ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                        <div className="bg-surface p-6 border-b border-on-surface-variant/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-primary tracking-wide">Update Stok</h2>
                                <p className="text-sm font-medium text-on-surface-variant mt-1">{productName}</p>
                            </div>
                            <button type="button" onClick={closeModal} className="text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors flex items-center justify-center">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={submitData}>
                            <div className="p-8">
                                <div>
                                    <label className="block text-sm font-bold text-on-surface-variant mb-2">Jumlah Stok Tersedia</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        value={data.stock} 
                                        onChange={e => setData('stock', e.target.value)} 
                                        className="w-full bg-surface-container border border-on-surface-variant/20 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-4 py-3 text-lg font-bold outline-none" 
                                        required 
                                    />
                                    {errors.stock && <span className="text-red-500 text-xs mt-1">{errors.stock}</span>}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-8 py-4 bg-surface-container/30 border-t border-on-surface-variant/10">
                                <button type="button" onClick={closeModal} className="text-on-surface-variant hover:bg-surface-variant px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">Batal</button>
                                <button type="submit" disabled={processing} className={`bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}>
                                    <span className="material-symbols-outlined text-sm">{processing ? 'hourglass_empty' : 'save'}</span>
                                    Simpan Stok
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
                                    <th className="px-6 py-4 text-center text-on-primary-container font-semibold w-24">Stok Anda</th>
                                    <th className="px-6 py-4 text-center text-on-primary-container font-semibold w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-on-surface-variant/10">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant font-medium text-sm">Belum ada produk yang ditambahkan oleh Pusat.</td>
                                    </tr>
                                ) : (
                                    products.map((product, index) => (
                                        <tr key={product.id} className={`text-on-surface-variant text-xs uppercase tracking-widest font-bold bg-white hover:bg-surface-container/30 transition-colors ${!product.is_active ? 'opacity-60' : ''}`}>
                                            <td className="px-6 py-4 text-center align-middle">{index + 1}</td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-4">
                                                    <img src={product.gambar} alt={product.nama} className="w-12 h-12 rounded-lg object-cover shadow-sm bg-surface-container" />
                                                    <div className="flex flex-col">
                                                        <span className="text-on-surface font-black text-sm">{product.nama} {product.is_active ? '' : '(NONAKTIF)'}</span>
                                                        <span className="text-[10px] text-primary">{product.kode_produk}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">{product.kategori}</td>
                                            <td className="px-6 py-4 align-middle">Rp {Number(product.harga).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4 text-center align-middle">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${product.stocks?.[0]?.stock > 10 ? 'bg-green-100 text-green-700' : product.stocks?.[0]?.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                                  {product.stocks?.[0]?.stock ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center align-middle">
                                                <div className="flex justify-center items-center">
                                                    <button onClick={() => openStockModal(product)} className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                                        Atur Stok
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

AdminProducts.layout = page => <AdminNav children={page} />
export default AdminProducts;