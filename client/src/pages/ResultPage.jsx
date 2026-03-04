import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Check, X, Save, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import API_URL from '../config';

const ResultPage = ({ questions, userAnswers, userName, onRestart, quizName }) => {
    const [score, setScore] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [syncStatus, setSyncStatus] = useState('idle'); // idle, loading, success, error
    const hasSavedRef = useRef(false);

    // Helper to check if the answer is correct
    const checkIsCorrect = (q, idx) => {
        const userAnswer = userAnswers[idx];
        const correctAnswer = q.answer;

        // Find the key for the user's answer if it was full text
        const getOptionKey = (val) => {
            if (val === q.optionA) return 'A';
            if (val === q.optionB) return 'B';
            if (val === q.optionC) return 'C';
            if (val === q.optionD) return 'D';
            return null;
        };

        const userKey = getOptionKey(userAnswer) || userAnswer;
        return userKey === correctAnswer || userAnswer === correctAnswer;
    };

    // Helper to get the full text for an answer (key or text)
    const getFullText = (q, val) => {
        if (!val) return "NULL_INPUT";
        if (val === 'A' || val === q.optionA) return q.optionA;
        if (val === 'B' || val === q.optionB) return q.optionB;
        if (val === 'C' || val === q.optionC) return q.optionC;
        if (val === 'D' || val === q.optionD) return q.optionD;
        return val;
    };

    useEffect(() => {
        let currentScore = 0;
        questions.forEach((q, idx) => {
            if (checkIsCorrect(q, idx)) {
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

            const saveResults = async () => {
                try {
                    // 1. Save to Supabase (Primary Cloud Storage)
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('results').insert([{
                            user_id: user.id,
                            user_name: user.user_metadata.full_name || user.email,
                            score: currentScore,
                            total: questions.length,
                            quiz_name: quizName || 'Unknown Module'
                        }]);
                    }

                    // 2. Save to Local Server (Fallback/Log)
                    const payload = {
                        userId: user?.id || 'guest',
                        userName: user?.user_metadata?.full_name || userName || 'Anonymous',
                        score: currentScore,
                        total: questions.length,
                        quizName: quizName
                    };
                    await axios.post(`${API_URL}/api/results`, payload);

                    setSyncStatus('success');
                } catch (err) {
                    console.error("Critical: Sync failed", err);
                    setSyncStatus('error');
                    setTimeout(() => {
                        hasSavedRef.current = false;
                        setSyncStatus('idle');
                    }, 3000);
                }
            };

            saveResults();
        }

        return () => clearInterval(timer);
    }, [questions, userAnswers, userName]);

    return (
        <div className="flex flex-col items-center justify-start min-h-screen px-4 py-20 pb-32 overflow-y-auto scrollbar-hide">
            <motion.div
                className="w-full max-w-4xl text-center mb-10"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex justify-center mb-4">
                    <span className="px-4 py-1.5 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[9px] font-black uppercase tracking-[0.3em]">
                        Final Intelligence Report
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
                    Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary neon-text-glow">Summary</span>
                </h1>

                <p className="text-slate-400 mb-2 text-lg font-light">
                    Candidate Identity: <span className="text-white font-bold tracking-tight">{userName || 'GUEST_ID_UNKNOWN'}</span>
                </p>
                <div className="flex justify-center mb-8">
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black tracking-widest uppercase">
                        Module: {quizName || 'GENERAL_DATASET'}
                    </span>
                </div>

                <div className="flex justify-center flex-wrap gap-6 md:gap-12 mb-8">
                    <div className="flex flex-col items-center">
                        <span className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-purple-500 to-secondary animate-pulse">
                            {animatedScore}/{questions.length}
                        </span>
                        <span className="text-slate-500 font-black tracking-[0.4em] uppercase text-[8px] mt-1">Raw Precision</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-4xl md:text-6xl font-black text-white">
                            {questions.length > 0 ? Math.round((animatedScore / questions.length) * 100) : 0}%
                        </span>
                        <span className="text-slate-500 font-black tracking-[0.4em] uppercase text-[8px] mt-1">Efficiency Index</span>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={onRestart}
                        className="flex items-center gap-2 px-6 py-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-base font-black border border-white/5 hover:border-white/20 transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4 text-primary" />
                        <span>RE-INITIALIZE</span>
                    </button>

                    <div className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-black border transition-all duration-700 ${syncStatus === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                        syncStatus === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                            'bg-white/[0.03] border-white/5 text-slate-500'
                        }`}>
                        {syncStatus === 'loading' && <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />}
                        {syncStatus === 'success' && <Check className="w-4 h-4" />}
                        {syncStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                        {syncStatus === 'idle' && <Save className="w-4 h-4" />}

                        <span className="tracking-tight uppercase tracking-widest text-[9px]">
                            {syncStatus === 'loading' ? 'SYNCHRONIZING...' :
                                syncStatus === 'success' ? 'DATA_SECURED' :
                                    syncStatus === 'error' ? 'SYNC_FAILED' : 'WAITING_FOR_SYNC'}
                        </span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="w-full max-w-4xl grid gap-8"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {questions.map((q, idx) => {
                    const isCorrect = checkIsCorrect(q, idx);
                    const userText = getFullText(q, userAnswers[idx]);
                    const correctText = getFullText(q, q.answer);

                    return (
                        <div
                            key={idx}
                            className={`p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 glass-card group relative overflow-hidden ${isCorrect ? 'hover:border-green-500/30 border-white/5' : 'hover:border-red-500/30 border-white/5'
                                } `}
                        >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} `}>
                                            Question_{idx + 1}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-600 font-mono text-[9px]">
                                            <Info className="w-3 h-3" />
                                            <span>{isCorrect ? 'VALID_LOGIC_STREAM' : 'PARSING_ERROR_DETECTED'}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold leading-tight mb-6 tracking-tight text-white/90">{q.question}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`p-5 rounded-2xl border transition-all ${isCorrect ? 'bg-green-500/5 border-green-500/20 shadow-[0_10px_30px_rgba(34,197,94,0.05)]' : 'bg-red-500/5 border-red-500/20 shadow-[0_10px_30px_rgba(239,68,68,0.05)]'} `}>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Selection_Manifest</span>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} `}>
                                                    {userAnswers[idx] || '?'}
                                                </div>
                                                <span className={`text-base font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'} `}>
                                                    {userText}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/20 shadow-[0_10px_30px_rgba(34,197,94,0.05)]">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">System_Truth_Expected</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded bg-green-500 text-white flex items-center justify-center text-[10px] font-black">
                                                    {q.answer}
                                                </div>
                                                <span className="text-base font-bold text-green-400">
                                                    {correctText}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl flex-shrink-0 transition-all duration-700 ${isCorrect ? 'bg-green-500/10 text-green-500 group-hover:scale-110 group-hover:bg-green-500/20 shadow-[0_20px_40px_rgba(34,197,94,0.1)]' : 'bg-red-500/10 text-red-500 group-hover:scale-110 group-hover:bg-red-500/20 shadow-[0_20px_40px_rgba(239,68,68,0.1)]'
                                    } `}>
                                    {isCorrect ? <Check className="w-8 h-8 stroke-[3]" /> : <X className="w-8 h-8 stroke-[3]" />}
                                </div>
                            </div>

                            {/* Visual decorative line */}
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-700 ${isCorrect ? 'bg-green-500/40 w-0 group-hover:w-full' : 'bg-red-500/40 w-0 group-hover:w-full'} `} />
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default ResultPage;
