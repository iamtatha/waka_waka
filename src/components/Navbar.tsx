'use client';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const fetchRole = async (userId: string) => {
            const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
            setRole(data?.role || null);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchRole(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchRole(session.user.id);
            else setRole(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-3 md:py-4">
            <div className="max-w-7xl mx-auto flex justify-between items-center glass-card px-4 md:px-8 py-2 md:py-3 border-white/40 shadow-xl shadow-indigo-500/5">
                {/* Logo */}
                <Link
                    href="/"
                    className="text-xl md:text-2xl font-black gradient-text tracking-tighter"
                    onClick={() => setIsMenuOpen(false)}
                >
                    WAKA WAKA
                </Link>

                {/* Desktop Links */}
                <div className="hidden lg:flex gap-8 items-center font-bold">
                    <Link href="/" className="text-sm hover:text-indigo-600 transition-colors uppercase tracking-wider">Games</Link>
                    <Link href="/leaderboard" className="text-sm hover:text-indigo-600 transition-colors uppercase tracking-wider">Leaderboard</Link>
                    {(role === 'owner' || role === 'admin') && (
                        <Link href="/admin" className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest border-b-2 border-indigo-600/20">Admin</Link>
                    )}
                </div>

                {/* Desktop User Actions */}
                <div className="hidden lg:flex items-center gap-6">
                    {user ? (
                        <div className="flex gap-4 items-center pl-6 border-l border-slate-200">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none">Logged in as</span>
                                <span className="text-xs font-bold text-slate-700">@{user.user_metadata?.username || user.id.slice(0, 8)}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-5 py-2 text-xs rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 font-black uppercase tracking-widest border border-red-100"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="premium-button py-2 px-8 text-xs font-black uppercase tracking-widest">
                            Join Now
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] border border-indigo-100 flex items-center gap-2 transition-all active:scale-95"
                >
                    {isMenuOpen ? (
                        <>
                            <span>CLOSE</span>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </>
                    ) : (
                        <>
                            <span className="ml-1">MENU</span>
                            <div className="flex flex-col gap-0.5">
                                <div className="w-3.5 h-0.5 bg-indigo-600 rounded-full"></div>
                                <div className="w-3.5 h-0.5 bg-indigo-600 rounded-full"></div>
                            </div>
                        </>
                    )}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="lg:hidden absolute top-[calc(100%-4px)] left-4 right-4 mt-2 glass-card border-white/40 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 flex flex-col gap-6">
                        <div className="flex flex-col gap-4">
                            <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-3">
                                🏠 Games
                            </Link>
                            <Link href="/leaderboard" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-3">
                                🏆 Leaderboard
                            </Link>
                            {(role === 'owner' || role === 'admin') && (
                                <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-indigo-600 flex items-center gap-3">
                                    ⚙️ Admin Dashboard
                                </Link>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            {user ? (
                                <div className="flex flex-col gap-4">
                                    <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">Authenticated</span>
                                        <span className="text-sm font-bold text-slate-700 block truncate">@{user.user_metadata?.username || user.id.slice(0, 8)}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full py-4 text-center rounded-2xl bg-red-50 text-red-600 font-black uppercase tracking-widest border border-red-100"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center premium-button py-4 text-sm font-black uppercase tracking-widest"
                                >
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
