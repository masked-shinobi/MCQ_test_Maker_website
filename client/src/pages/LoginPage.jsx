import React from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { LogIn, ShieldCheck, Flame, Zap } from 'lucide-react';

const LoginPage = () => {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error('Error logging in:', error.message);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050510]">
            {/* Ambient Background Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div
                className="w-full max-w-md p-10 relative z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="text-center mb-12">
                    <motion.div
                        className="inline-flex p-4 bg-primary/20 rounded-3xl mb-6 border border-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                        <Zap className="w-10 h-10 text-primary" />
                    </motion.div>

                    <h1 className="text-5xl font-black tracking-tighter mb-4">
                        Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Access</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">
                        Authorization required to access the MCQ Databank.
                    </p>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full relative group px-6 py-5 bg-white text-black rounded-2xl text-lg font-black transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                        <span>Authorize with Google</span>
                    </button>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Cloud Security Enforced</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Real-time Sync Active</span>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
                    Proprietary Interface v3.0 // Neural Link Ready
                </p>
            </motion.div>
        </div>
    );
};

export default LoginPage;
