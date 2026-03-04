import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Award, Activity,
    LogOut, ChevronRight, Settings, Binary,
    Database, Target, Save, X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import API_URL from '../config';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGrade, setNewGrade] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [stats, setStats] = useState({
        totalTests: 0,
        avgScore: 0,
        bestScore: 0,
        privateModules: 0,
        accuracy: 0,
        rank: '--'
    });
    const [loading, setLoading] = useState(true);

    const fetchProfileData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/');
                return;
            }

            setUser(session.user);
            setNewName(session.user.user_metadata.full_name || '');
            setNewGrade(session.user.user_metadata.grade || 'GRADE_A');

            // Fetch Leaderboard for real ranking (Primary Cloud Storage)
            const { data: leaderboard, error: leaderboardError } = await supabase
                .from('leaderboard')
                .select('*');

            if (leaderboardError) console.error("Leaderboard fetch failed:", leaderboardError);

            const myStats = leaderboard?.find(u => u.user_id === session.user.id);

            if (myStats) {
                setStats({
                    totalTests: myStats.total_tests,
                    avgScore: myStats.avg_accuracy,
                    bestScore: Math.round(myStats.best_accuracy),
                    privateModules: stats.privateModules, // Keep what we have
                    accuracy: myStats.avg_accuracy,
                    rank: `#${leaderboard.findIndex(u => u.user_id === session.user.id) + 1}`
                });
            } else {
                // ... handle fallback if needed ...
                const quizzesRes = await axios.get(`${API_URL}/api/quizzes?userId=${session.user.id}`);
                const localQuizzes = quizzesRes.data.filter(q => q.userId === session.user.id);
                setStats(prev => ({
                    ...prev,
                    privateModules: localQuizzes.length,
                    rank: 'N/A'
                }));
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [navigate]);

    const handleUpdateProfile = async () => {
        if (!newName.trim()) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: newName,
                    grade: newGrade
                }
            });
            if (error) throw error;

            // Refresh local session display name
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session.user);
            setIsEditing(false);
        } catch (error) {
            alert("Update failed: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050510]">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const badges = [
        { label: 'RAG ARCHITECT', status: stats.bestScore >= 90 ? 'LOCKED_IN' : 'IN_PROGRESS' },
        { label: 'VECTOR MASTER', status: stats.totalTests >= 5 ? 'LOCKED_IN' : 'IN_PROGRESS' },
        { label: 'DATA SECURED', status: stats.privateModules >= 1 ? 'LOCKED_IN' : 'IN_PROGRESS' }
    ];

    return (
        <motion.div
            className="min-h-screen bg-[#050510] text-white pt-24 pb-12 px-4 md:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-8 glass-card rounded-[3rem] border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-gradient-to-br from-primary via-purple-500 to-secondary p-1 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                            <div className="w-full h-full rounded-[2.3rem] bg-[#0A0A15] flex items-center justify-center overflow-hidden">
                                {(user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                    <img src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-primary/40" />
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-[#0A0A15] flex items-center justify-center">
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        {isEditing ? (
                            <div className="mb-4 flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-white/5 border border-primary/30 rounded-xl px-4 py-2 text-2xl font-black w-full md:max-w-xs focus:outline-none focus:border-primary transition-all"
                                        placeholder="Enter Name"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Grade</label>
                                    <input
                                        type="text"
                                        value={newGrade}
                                        onChange={(e) => setNewGrade(e.target.value)}
                                        className="bg-white/5 border border-secondary/30 rounded-xl px-4 py-1 text-sm font-black w-full md:max-w-xs focus:outline-none focus:border-secondary transition-all"
                                        placeholder="e.g. GRADE_A"
                                    />
                                </div>
                                <div className="flex gap-2 justify-center md:justify-start mt-2">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all"
                                    >
                                        <Save className="w-3 h-3" />
                                        <span>{isSaving ? 'UPLOADING...' : 'CONFIRM_SAVE'}</span>
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                        <span>CANCEL</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className="text-4xl font-black tracking-tighter">
                                    {user?.user_metadata?.full_name || 'Protocol_Candidate'}
                                </h1>
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                    {user?.user_metadata?.grade || 'GRADE_A'}
                                </span>
                            </div>
                        )}
                        <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mb-6 font-medium">
                            <Mail className="w-4 h-4 opacity-50" />
                            {user?.email}
                        </p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Binary className="w-4 h-4 text-primary" />
                                <span>ID: {user?.id?.slice(0, 8)}...</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 border-l border-white/10 pl-4">
                                <Activity className="w-4 h-4 text-secondary" />
                                <span>Status: ONLINE</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 transition-all font-bold group"
                            >
                                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                <span>Modify Protocol</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Performance Stats */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="p-6 md:p-8 glass-card rounded-[2rem] md:rounded-[2.5rem] border-white/5 flex flex-col justify-between group hover:border-primary/30 transition-all">
                            <Target className="w-6 h-6 md:w-8 md:h-8 text-primary mb-4" />
                            <div>
                                <h3 className="text-4xl md:text-5xl font-black mb-1 text-primary group-hover:scale-105 transition-transform origin-left">{stats.accuracy}%</h3>
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Precision_Raw</p>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 glass-card rounded-[2rem] md:rounded-[2.5rem] border-white/5 flex flex-col justify-between group hover:border-secondary/30 transition-all">
                            <Activity className="w-6 h-6 md:w-8 md:h-8 text-secondary mb-4" />
                            <div>
                                <h3 className="text-4xl md:text-5xl font-black mb-1 text-secondary group-hover:scale-105 transition-transform origin-left">{stats.totalTests}</h3>
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Missions_Logged</p>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 glass-card rounded-[2rem] md:rounded-[2.5rem] border-white/5 flex flex-col justify-between group hover:border-yellow-500/30 transition-all">
                            <Award className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-4" />
                            <div>
                                <h3 className="text-4xl md:text-5xl font-black mb-1 text-yellow-500 group-hover:scale-105 transition-transform origin-left">{stats.bestScore}%</h3>
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Peak_Efficiency</p>
                            </div>
                        </div>
                        <div className="p-6 md:p-8 glass-card rounded-[2rem] md:rounded-[2.5rem] border-white/5 flex flex-col justify-between group hover:border-blue-500/30 transition-all">
                            <Database className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mb-4" />
                            <div>
                                <h3 className="text-4xl md:text-5xl font-black mb-1 text-blue-500 group-hover:scale-105 transition-transform origin-left">{stats.privateModules}</h3>
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Secure_Datasets</p>
                            </div>
                        </div>
                    </div>

                    {/* Achievement Section */}
                    <div className="p-8 glass-card rounded-[3rem] border-white/5 relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <div>
                            <h3 className="text-xl font-black mb-8 relative z-10 flex items-center gap-3">
                                <Shield className="w-5 h-5 text-primary" />
                                <span>MASTER_RANK</span>
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {badges.map((badge, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                                        <span className={`text-[10px] font-black tracking-widest ${badge.status === 'LOCKED_IN' ? 'text-white' : 'text-slate-600'}`}>{badge.label}</span>
                                        <div className={`w-2 h-2 rounded-full ${badge.status === 'LOCKED_IN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-slate-800'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center relative z-10">
                            <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase mb-1">
                                Global standing
                            </p>
                            <p className="text-4xl font-black text-white glow-text">
                                {stats.rank}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="flex justify-between items-center px-4">
                    <button
                        onClick={() => navigate('/')}
                        className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-black text-xs tracking-widest group"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        <span>RETURN_TO_BASE</span>
                    </button>

                    <button
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/');
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all font-black border border-red-500/20 text-xs tracking-[0.2em]"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>TERMINATE_SESSION</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfilePage;
