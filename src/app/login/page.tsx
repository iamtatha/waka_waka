'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                // Pre-check if username is taken since Supabase Auth trigger returns generic error
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('display_name', username)
                    .maybeSingle();

                if (existingProfile) {
                    setMessage('Username already taken. Please choose a different one.');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username },
                    },
                });

                if (error) {
                    if (error.message.includes('Database error saving new user')) {
                        throw new Error('This username or email might already be in use. Please try another.');
                    }
                    throw error;
                }
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push('/');
                router.refresh();
            }
        } catch (error: any) {
            setMessage(error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="glass-card p-10">
                <h1 className="text-3xl font-bold mb-6 gradient-text text-center">
                    {isSignUp ? 'Join the Contest' : 'Welcome Back'}
                </h1>
                <form onSubmit={handleAuth} className="flex flex-col gap-5">
                    {isSignUp && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-slate-400 ml-1">Username</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-slate-400 ml-1">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-slate-400 ml-1">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="premium-button mt-4 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                {message && (
                    <p className="mt-4 text-center text-sm text-indigo-400 bg-indigo-500/10 py-2 rounded-lg">
                        {message}
                    </p>
                )}

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-6 text-sm text-slate-400 hover:text-white transition-colors"
                >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
            </div>
        </div>
    );
}
