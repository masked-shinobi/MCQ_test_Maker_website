import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';
import { supabase } from '../supabaseClient';
import { LayoutDashboard, ArrowLeft, User, Calendar, Award, AlertTriangle, RefreshCw, Database } from 'lucide-react';

const DashboardPage = () => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    const fetchResults = async () => {
        setIsLoading(true);
        setError(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch from Supabase (Primary Cloud Storage) - SECURELY FILTERED BY USER_ID
            const { data, error: sbError } = await supabase
                .from('results')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (sbError) throw sbError;

            // Map keys if needed to match the existing UI
            const mappedResults = data.map(r => ({
                id: r.id,
                userName: r.user_name,
                quizName: r.quiz_name,
                score: r.score,
                total: r.total,
                date: r.created_at
            }));

            setResults(mappedResults);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching results from cloud:", error);

            // Fallback to local server (Secondary)
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const response = await axios.get(`${API_URL}/api/results?userId=${session?.user?.id || 'guest'}`);
                // Filter locally just to be absolutely sure
                const sorted = response.data
                    .filter(r => r.userId === session?.user?.id)
                    .sort((a, b) => b.id - a.id);
                setResults(sorted);
                setIsLoading(false);
            } catch (localError) {
                console.error("Error fetching results from local API:", localError);
                setError(true);
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    return (
        <motion.div
            className="min-h-screen px-4 py-20 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-2xl border border-primary/20 shadow-xl">
                        <LayoutDashboard className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">System <span className="text-primary">Logs</span></h1>
                        <p className="text-slate-500 font-medium text-xs mt-1">Global performance tracking and session analytics.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/manage')}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all border border-purple-500/20 font-bold text-sm group"
                    >
                        <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Manage Modules</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 font-bold text-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Return Core</span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(139,92,246,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse">Scanning Databanks...</span>
                </div>
            ) : error ? (
                <div className="text-center py-20 glass-card rounded-[3rem] p-16 border-red-500/20">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Connection Failure</h2>
                    <p className="text-slate-400 mb-10 max-w-md mx-auto">The engine could not connect to the remote databank. Ensure the backend server is operational.</p>
                    <button
                        onClick={fetchResults}
                        className="flex items-center gap-3 px-10 py-4 bg-red-500 text-white rounded-2xl mx-auto font-bold shadow-2xl hover:scale-105 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>RETRY_CONNECTION</span>
                    </button>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-20 glass-card rounded-[3rem] p-20">
                    <Award className="w-20 h-20 text-slate-800 mx-auto mb-8" />
                    <h2 className="text-3xl font-bold text-slate-500 mb-4">No Session History Found</h2>
                    <p className="text-slate-600 mb-10">Initialize your first engine test to generate performance analytics.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-bold"
                    >
                        START_INITIALIZATION
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    <div className="hidden md:grid grid-cols-4 px-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-4">
                        <span>Candidate_Identity</span>
                        <span>Log_Timestamp</span>
                        <span className="text-center">Precision_Raw</span>
                        <span className="text-right">Efficiency_Index</span>
                    </div>
                    {results.map((res, idx) => (
                        <motion.div
                            key={res.id}
                            className="p-8 glass-card rounded-3xl flex flex-col md:flex-row items-center justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05, ease: "easeOut" }}
                        >
                            {/* Decorative line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-6 flex-1 w-full mb-4 md:mb-0">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                                    <User className="w-7 h-7" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold tracking-tight">{res.userName}</span>
                                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest md:hidden mt-1">Candidate</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1 w-full mb-4 md:mb-0 text-slate-400">
                                <Calendar className="w-5 h-5 opacity-50" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{new Date(res.date).toLocaleDateString()}</span>
                                    <span className="text-[10px] font-mono opacity-40">{new Date(res.date).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="flex-1 text-center w-full mb-6 md:mb-0">
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                    {res.score}/{res.total}
                                </span>
                                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest block mt-1">Score_Raw</span>
                            </div>

                            <div className="flex-1 flex justify-end w-full">
                                <div className={`px - 6 py - 2.5 rounded - 2xl flex items - center gap - 3 text - lg font - black border transition - all ${(res.score / res.total) >= 0.7
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                                    } `}>
                                    <Award className="w-5 h-5" />
                                    <span>{Math.round((res.score / res.total) * 100)}%</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default DashboardPage;
