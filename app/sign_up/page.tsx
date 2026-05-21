
const Sign_up = () => {
    return (
        <div className="h-screen overflow-hidden flex items-center justify-center animated-bg relative">

            <div className="relative z-10 w-full max-w-md p-6 bg-black border border-yellow-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(234,179,8,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(234,179,8,0.25)]">

                <div className="text-center mb-4">
                    <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                        Xush kelibsiz!
                    </h2>
                    <p className="text-sm font-medium text-yellow-500/80">O'z hisobingizga kiring va davom eting</p>
                </div>

                <form className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Email manzilingiz</label>
                        <input
                            type="email"
                            className="w-full px-5 py-2.5 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="ism@misol.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-yellow-400">Parol</label>
                            <a href="#" className="text-xs font-medium text-yellow-500/70 hover:text-yellow-300 transition-colors">Parolni unutdingizmi?</a>
                        </div>
                        <input
                            type="password"
                            className="w-full px-5 py-2.5 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 mt-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-extrabold text-lg rounded-2xl shadow-[0_4px_20px_rgba(234,179,8,0.3)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(234,179,8,0.5)] active:scale-95"
                    >
                        Kirish
                    </button>
                </form>

                <div className="mt-5 text-center">
                    <p className="text-sm font-medium text-red-500">
                        Hali ro'yxatdan o'tmaganmisiz?{' '}
                        <a href="/sign_in" className="font-bold text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            Bu yerdan ro'yxatdan o'ting
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sign_up;
