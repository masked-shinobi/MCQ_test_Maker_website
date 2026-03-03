import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Check, X, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ResultPage = ({ questions, userAnswers, userName, onRestart }) => {
    const [score, setScore] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, loading, success, error
    const hasSavedRef = useRef(false);

    useEffect(() => {
        let currentScore = 0;
        questions.forEach((q, idx) => {
            if (userAnswers[idx] === q.answer) {
                currentScore++;
            }
        });
        setScore(currentScore);

        // Score animation logic
        let start = 0;
        const end = currentScore;
        const duration = 2000;
        const increment = end / (duration / 16);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setAnimatedScore(end);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.floor(start));
            }
        }, 16);

        // Synchronization logic
        if (!hasSavedRef.current && questions.length > 0) {
            hasSavedRef.current = true;
            setSyncStatus('loading');

            const payload = {
                userName: userName || 'Anonymous',
                score: currentScore,
                total: questions.length
            };

            // Double check server availability before POST
            axios.post('http://localhost:5001/api/results', payload)
                .then(() => {
                    setSyncStatus('success');
                })
                .catch(err => {
                    console.error("Critical: Sync failed", err);
                    setSyncStatus('error');
                    // Retry once after 3 seconds if failed
                    setTimeout(() => {
                        hasSavedRef.current = false;
                        setSyncStatus('idle');
                    }, 3000);
                });
        }

        return () => clearInterval(timer);
    }, [questions, userAnswers, userName]);

    const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

    return (
        <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 pb-32 overflow-y-auto scrollbar-hide">
            <motion.div
                className="w-full max-w-4xl text-center mb-16"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex justify-center mb-6">
                    <span className="px-5 py-2 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                        Final Intelligence Report
                    </span>
                </div>

                <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
                    Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text-glow">Summary</span>
                </h1>

                <p className="text-slate-400 mb-12 text-xl font-light">
                    Candidate Identity: <span className="text-white font-bold tracking-tight">{userName || 'GUEST_ID_UNKNOWN'}</span>
                </p>

                <div className="flex justify-center flex-wrap gap-10 md:gap-24 mb-14">
                    <div className="flex flex-col items-center">
                        <span className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-purple-500 to-secondary animate-pulse">
                            {animatedScore}/{questions.length}
                        </span>
                        <span className="text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] mt-4">Raw Precision</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-7xl md:text-9xl font-black text-white">
                            {Math.round((animatedScore / questions.length) * 100)}%
                        </span>
                        <span className="text-slate-500 font-black tracking-[0.4em] uppercase text-[10px] mt-4">Efficiency Index</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                    <button
                        onClick={onRestart}
                        className="flex items-center gap-4 px-12 py-6 bg-white/[0.03] hover:bg-white/[0.08] rounded-3xl text-xl font-black border border-white/5 hover:border-white/20 transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-6 h-6 text-primary" />
                        <span>RE-INITIALIZE</span>
                    </button>

                    <div className={`flex items-center gap-4 px-10 py-6 rounded-3xl text-xl font-black border transition-all duration-700 ${syncStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                            'bg-white/[0.03] border-white/5 text-slate-500'
                        }`}>
                        {syncStatus === 'loading' && <div className="w-6 h-6 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />}
                        {syncStatus === 'success' && <Check className="w-6 h-6" />}
                        {syncStatus === 'error' && <AlertCircle className="w-6 h-6" />}
                        {syncStatus === 'idle' && <Save className="w-6 h-6" />}

                        <span className="tracking-tight">
                            {syncStatus === 'loading' ? 'SYNCHRONIZING...' :
                                syncStatus === 'success' ? 'DATA_SECURED' :
                                    syncStatus === 'error' ? 'SYNC_FAILED' : 'WAITING_FOR_SYNC'}
                        </span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="w-full max-w-4xl grid gap-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {questions.map((q, idx) => {
                    const isCorrect = userAnswers[idx] === q.answer;
                    return (
                        <div
                            key={idx}
                            className={`p-10 md:p-14 rounded-[3rem] border transition-all duration-500 glass-card group relative overflow-hidden ${isCorrect ? 'border-green-500/10 hover:border-green-500/30' : 'border-red-500/10 hover:border-red-500/30'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            Module_{idx + 1}
                                        </span>
                                        <span className="text-slate-600 font-mono text-[10px]">{isCorrect ? 'VALID_LOGIC' : 'LOGIC_FAILURE'}</span>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold leading-snug mb-8 tracking-tight">{q.question}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">Candidate Selection</span>
                                            <span className={`text-lg font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                                {userAnswers[idx] || "NULL_INPUT"}
                                            </span>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-2">System Truth</span>
                                            <span className="text-lg font-bold text-green-400">{q.answer}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center justify-center w-20 h-20 rounded-3xl flex-shrink-0 transition-all duration-500 ${isCorrect ? 'bg-green-500/5 text-green-500 group-hover:bg-green-500/20' : 'bg-red-500/5 text-red-500 group-hover:bg-red-500/20'
                                    }`}>
                                    {isCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default ResultPage;
