
const Sign_in = () => {
    return (
        <div className="h-screen overflow-hidden flex items-center justify-center animated-bg relative">

            <div className="relative z-10 w-full max-w-md px-6 py-4 bg-black border border-yellow-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(234,179,8,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(234,179,8,0.25)]">

                <div className="text-center mb-3">
                    <h2 className="text-2xl font-extrabold mb-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                        Yangi hisob yaratish
                    </h2>
                    <p className="text-xs font-medium text-yellow-500/80">Ma'lumotlaringizni kiritib tizimga qo'shiling</p>
                </div>

                <form className="space-y-2">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Ismingiz</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="Ism va familiya"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Email manzilingiz</label>
                        <input
                            type="email"
                            className="w-full px-4 py-2 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="ism@misol.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Parol</label>
                        <input
                            type="password"
                            className="w-full px-4 py-2 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="Kamida 8 ta belgi"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Ro'lni tanlang</label>
                        <select
                            className="w-full px-4 py-2 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 appearance-none cursor-pointer"
                            defaultValue=""
                            required
                        >
                            <option value="" disabled className="text-yellow-600/60 bg-zinc-900">Tanlang...</option>
                            <option value="sotuvchi" className="bg-zinc-900 text-yellow-100">Sotuvchi</option>
                            <option value="ishlab_chiqaruvchi" className="bg-zinc-900 text-yellow-100">Ishlab chiqaruvchi</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 mt-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-extrabold text-base rounded-2xl shadow-[0_4px_20px_rgba(234,179,8,0.3)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(234,179,8,0.5)] active:scale-95"
                    >
                        Ro'yxatdan o'tish
                    </button>
                </form>

                <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-green-400">
                        Allaqachon hisobingiz bormi?{' '}
                        <a href="/sign_up" className="font-bold text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            Tizimga kiring
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sign_in;
