import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, CheckCircle2, Award } from 'lucide-react';

const StudyMaterialPage = ({ questions }) => {
    const navigate = useNavigate();

    // Helper to check if the option is the correct answer
    const isCorrect = (q, key, val) => {
        const ans = q.answer;
        // Check if answer matches the shorthand key (A, B, C, D) or the full value
        return ans === key || ans === val;
    };

    return (
        <motion.div
            className="min-h-screen px-4 py-20 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-secondary/20 rounded-[2rem] border border-secondary/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-secondary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        <BookOpen className="w-10 h-10 text-secondary relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tight">Material <span className="text-secondary">Library</span></h1>
                        <p className="text-slate-500 font-medium mt-1">Foundational data for Information Retrieval mastery.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 font-bold group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Return Core</span>
                </button>
            </div>

            <div className="grid gap-8">
                {questions.map((q, idx) => (
                    <motion.div
                        key={idx}
                        className="p-8 md:p-12 glass-card rounded-[3rem] border border-white/5 hover:border-secondary/30 transition-all duration-500 group relative overflow-hidden"
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        {/* Status tag */}
                        <div className="absolute top-8 right-8 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Verified_Data</span>
                        </div>

                        <div className="mb-8">
                            <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black tracking-[0.3em] uppercase text-slate-500 mb-6 inline-block">
                                Resource_Module_{idx + 1}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-white/90 max-w-3xl">
                                {q.question}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            {[
                                { key: 'A', val: q.optionA },
                                { key: 'B', val: q.optionB },
                                { key: 'C', val: q.optionC },
                                { key: 'D', val: q.optionD },
                            ].map((opt) => {
                                const correct = isCorrect(q, opt.key, opt.val);
                                return (
                                    <div
                                        key={opt.key}
                                        className={`p-6 rounded-2xl border transition-all duration-500 flex items-center gap-6 ${correct
                                            ? 'bg-secondary/10 border-secondary/40 text-secondary shadow-[0_10px_30px_rgba(236,72,153,0.1)]'
                                            : 'bg-white/[0.02] border-white/5 text-slate-400 opacity-60 group-hover:opacity-80'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border transition-all ${correct
                                            ? 'bg-secondary text-white border-secondary'
                                            : 'bg-white/5 border-white/10 text-slate-600'
                                            }`}>
                                            {opt.key}
                                        </div>
                                        <span className={`text-lg font-semibold flex-1 ${correct ? 'text-white' : ''}`}>{opt.val}</span>
                                        {correct && (
                                            <div className="p-2 bg-secondary/20 rounded-full">
                                                <CheckCircle2 className="w-5 h-5 text-secondary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/5 rounded-full blur-[80px] group-hover:bg-secondary/10 transition-colors" />
                    </motion.div>
                ))}
            </div>

            <div className="mt-20 text-center">
                <div className="inline-flex items-center gap-3 px-10 py-5 bg-secondary text-white rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition-all cursor-pointer" onClick={() => navigate('/')}>
                    <Award className="w-6 h-6" />
                    <span>INITIALIZE ENGINE MISSION</span>
                </div>
            </div>
        </motion.div>
    );
};

export default StudyMaterialPage;
