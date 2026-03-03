import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';

const StudyMaterialPage = ({ questions }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            className="min-h-screen px-4 py-20 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-secondary/20 rounded-2xl">
                        <BookOpen className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold">Material <span className="text-secondary">Library</span></h1>
                        <p className="text-slate-400">Review all concepts before initialization.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back Home</span>
                </button>
            </div>

            <div className="grid gap-6">
                {questions.map((q, idx) => (
                    <motion.div
                        key={idx}
                        className="p-8 glass-card rounded-3xl"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Resource #{idx + 1}</span>
                        </div>
                        <h3 className="text-xl font-semibold mb-6 leading-relaxed">{q.question}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'A', val: q.optionA },
                                { key: 'B', val: q.optionB },
                                { key: 'C', val: q.optionC },
                                { key: 'D', val: q.optionD },
                            ].map((opt) => (
                                <div
                                    key={opt.key}
                                    className={`p-4 rounded-xl border flex items-center gap-3 ${opt.val === q.answer
                                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                            : 'bg-white/5 border-white/10 text-slate-400'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${opt.val === q.answer ? 'bg-green-500 text-white' : 'bg-white/10'
                                        }`}>
                                        {opt.key}
                                    </div>
                                    <span className="flex-1">{opt.val}</span>
                                    {opt.val === q.answer && <CheckCircle className="w-5 h-5" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default StudyMaterialPage;
