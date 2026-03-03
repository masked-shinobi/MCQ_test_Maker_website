import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, LayoutDashboard, User } from 'lucide-react';

const LandingPage = ({ setGlobalName }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const handleStart = () => {
        if (!name.trim()) {
            setError(true);
            return;
        }
        setGlobalName(name);
        navigate('/question/1');
    };

    return (
        <motion.div
            className="flex flex-col items-center justify-center min-h-screen px-4 py-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-12"
            >
                <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-[0.3em] uppercase bg-primary/10 text-primary border border-primary/20 rounded-full animate-pulse">
                    Transmission Online
                </div>
                <h1 className="text-7xl font-black tracking-tighter md:text-9xl mb-4 leading-none">
                    MCQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary neon-text-glow">ENGINE</span>
                </h1>
                <p className="mt-4 text-xl text-slate-400 max-w-[700px] mx-auto font-light leading-relaxed">
                    Modular evaluation processor for <span className="text-white font-medium">Information Retrieval Techniques</span>.
                    Initialize your identity to begin.
                </p>
            </motion.div>

            <motion.div
                className="w-full max-w-md p-8 glass-card rounded-[2.5rem] mb-12 border-t-white/10"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <User className={`w-5 h-5 transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    <input
                        type="text"
                        placeholder="Enter Candidate Name"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError(false);
                        }}
                        className={`w-full bg-black/40 border-2 py-4 pl-12 pr-4 rounded-2xl outline-none transition-all placeholder:text-slate-600 focus:bg-black/60 ${error ? 'border-red-500/50 shake' : 'border-white/5 focus:border-primary/50'
                            }`}
                    />
                    {error && <p className="text-red-500 text-xs mt-2 text-left ml-2">Candidate identifier is required.</p>}
                </div>

                <button
                    onClick={handleStart}
                    className="w-full relative group px-8 py-5 bg-primary text-white rounded-2xl text-lg font-bold overflow-hidden transition-all hover:neon-glow hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(139,92,246,0.3)]"
                >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Initialize Test</span>
                </button>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
                <button
                    onClick={() => navigate('/material')}
                    className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
                >
                    <BookOpen className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Review Material</span>
                </button>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group"
                >
                    <LayoutDashboard className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="font-semibold">Global Dashboard</span>
                </button>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-20 text-[10px] space-x-8 font-mono tracking-[0.5em]">
                <span>CORE_V4.2.1</span>
                <span>SYSTEM_STABLE</span>
                <span>ENCRYPTION_ACTIVE</span>
            </div>
        </motion.div>
    );
};

export default LandingPage;
