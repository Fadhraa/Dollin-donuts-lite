import { Link, useForm } from "@inertiajs/react";
import { useState } from "react";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="bg-background font-body text-on-surface overflow-x-hidden">
            <div className="w-full h-screen flex justify-center items-center">
                <div className="flex w-full max-w-[1000px] mx-10 p-8 rounded-lg  justify-between gap-12 lg:gap-24">
                    <form onSubmit={handleSubmit} className="w-full max-w-[440px] flex flex-col">

                        <h1 className="font-headline text-5xl font-black tracking-tight text-on-surface mb-3">Selamat Datang Kembali</h1>
                        <p className="font-body text-base text-on-surface mb-8">Silahkan login untuk melanjutkan</p>
                        
                        {/* Error Notification */}
                        {errors.email && (
                            <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-semibold mb-6 border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {errors.email}
                            </div>
                        )}

                        {/* form login */}
                        <div className="flex flex-col gap-2 mb-4">
                            <label className="text-on-surface font-semibold px-1" htmlFor="Email">Email</label>
                            <input
                            className="w-full h-16 px-6 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline transition-all"
                            placeholder="Masukan email anda" 
                            required
                            value={data.email}
                            type="email"
                            onChange={(e) => setData('email', e.target.value)} />

                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-on-surface font-semibold px-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <input
                                className="w-full h-16 pl-6 pr-12 rounded-xl bg-surface-container-high border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline transition-all"
                                placeholder="Masukan password anda" 
                                required
                                value={data.password}
                                type={showPassword ? "text" : "password"} 
                                onChange={(e) => setData('password', e.target.value)} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/70 hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <button 
                            type="submit"
                            disabled={processing}
                            className=" mt-6 w-full h-16 bg-primary text-on-primary font-headline font-bold text-lg rounded-xl hover:bg-primary-dim transition-all shadow-lg shadow-primary/10 cursor-pointer">
                                Sign In
                            </button>
                        </div>
                 
                    </form>
                    <div className=" group relative lg:flex flex-1 items-center justify-center w-full ">
                        <div className="max-w-[500px] w-full h-full overflow-hidden rounded-2xl shadow-lg shadow-primary/10">
                             <img className="w-full h-full object-cover transition-transform duration-500 ease-in-out hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuANbxNm_wFh5GzoZJnLeNYUH1UZ8LH0lCx4oZJSp3_-XUvVLBk2HrG-JY58oEVIa3aT9fOiChXFAgqmb0LEz_3cKpW-A6oBfUuJhZfT-k7FU49rSzrpan7WKkJu5r36poNyitj6_JiO1bspflU5d9AWI31wzymFosUhNuFprrTNX7bhN65DlVHuFXUdnVwQIEihKJ7uLX6wKr9fC0ScR4NlC2MK5RJMU-_-M7cfmh9SGfid_su0IXeUgW_6tVEbWQe7Q_QbtvyIrHqA" alt="" />
                        </div>
                        <div className="
                        absolute bottom-[-100px] group-hover:bottom-0 
                        transition-all duration-300 ease-in-out
                        rounded-b-2xl
                        left-0 w-full h-1/4 bg-gradient-to-t from-background to-transparent"/>
                        <div className="
                        absolute bottom-0 right-0 z-10 bg-white p-4 max-w-[200px] rounded-l-2xl 
                        ">
                            <p className="text-xs font-bold text-on-surface leading-tight">"The fluffiest mochi donut I've ever tasted!"</p>
                            <p className="text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest font-semibold">— Sarah J.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}