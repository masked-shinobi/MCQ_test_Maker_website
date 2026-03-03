import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, User, Clock } from 'lucide-react';

const MCQPage = ({ questions, userAnswers, onAnswer, isLoading, userName }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const questionIndex = parseInt(id) - 1;
    const question = questions[questionIndex];

    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (userAnswers[questionIndex]) {
            setSelectedOption(userAnswers[questionIndex]);
        } else {
            setSelectedOption(null);
        }
        // Scroll to top on question change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id, userAnswers, questionIndex]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!question) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
                <h2 className="text-3xl font-bold">Session Complete or Invalid.</h2>
                <button onClick={() => navigate('/result')} className="px-8 py-3 bg-primary rounded-xl text-white font-bold">Go to Results</button>
            </div>
        );
    }

    const options = [
        { key: 'A', value: question.optionA },
        { key: 'B', value: question.optionB },
        { key: 'C', value: question.optionC },
        { key: 'D', value: question.optionD },
    ];

    const handleOptionSelect = (key, value) => {
        // If the CSV uses shorthand (A, B, C, D) for the answer, store the key
        // Otherwise store the full value
        const isShorthand = ['A', 'B', 'C', 'D'].includes(question.answer);
        const storedValue = isShorthand ? key : value;

        setSelectedOption(storedValue);
        onAnswer(questionIndex, storedValue);

        // Move to next after a short cinematic delay
        setTimeout(() => {
            handleNext();
        }, 800);
    };

    const handleNext = () => {
        if (questionIndex < questions.length - 1) {
            navigate(`/question/${questionIndex + 2}`);
        } else {
            navigate('/result');
        }
    };

    const handlePrev = () => {
        if (questionIndex > 0) {
            navigate(`/question/${questionIndex}`);
        }
    };

    const progress = ((questionIndex + 1) / questions.length) * 100;

    return (
        <div className="flex flex-col items-center h-screen px-3 pt-16 pb-4 overflow-hidden">
            {/* Slimmer Top Navigation Bar */}
            <div className="fixed top-0 left-0 w-full z-50 bg-[#050510]/90 backdrop-blur-xl border-b border-white/5">
                <div className="h-1 bg-white/5 w-full">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary via-purple-500 to-secondary shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                    />
                </div>
                <div className="px-4 md:px-10 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none mb-0.5">Identity</span>
                            <span className="text-[11px] font-bold text-white leading-none">{userName || 'GUEST_PROTO'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">MODULE_{id}</span>
                        <span className="text-[9px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{questionIndex + 1}/{questions.length}</span>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-2xl flex-1 flex flex-col justify-center gap-4 md:gap-6 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={id}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -15, opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="p-5 md:p-7 glass-card rounded-[2rem] relative overflow-hidden flex flex-col min-h-0 shadow-2xl"
                    >
                        {/* Compact background glow */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col min-h-0">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-4 h-[1px] bg-primary/40" />
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Active_Channel</span>
                            </div>

                            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-5 leading-tight tracking-tight text-white/90">
                                {question.question}
                            </h2>

                            <div className="grid gap-2 overflow-y-auto pr-1 scrollbar-hide py-1">
                                {options.map((opt) => (
                                    <motion.div
                                        key={opt.key}
                                        onClick={() => handleOptionSelect(opt.key, opt.value)}
                                        className={`option-card relative p-3.5 md:p-4 rounded-2xl cursor-none border transition-all duration-300 ${selectedOption === (['A', 'B', 'C', 'D'].includes(question.answer) ? opt.key : opt.value)
                                            ? 'bg-primary border-primary shadow-[0_8px_20px_rgba(139,92,246,0.2)] text-white'
                                            : 'bg-white/[0.04] border-white/5 hover:border-primary/30 text-slate-300'
                                            }`}
                                        whileHover={{ x: 5 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <div className="flex items-center justify-between pointer-events-none">
                                            <div className="flex items-center gap-4">
                                                <span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[10px] md:text-xs font-black border transition-all ${selectedOption === (['A', 'B', 'C', 'D'].includes(question.answer) ? opt.key : opt.value)
                                                    ? 'bg-white text-primary border-white'
                                                    : 'bg-white/5 border-white/10 text-slate-500'
                                                    }`}>
                                                    {opt.key}
                                                </span>
                                                <span className="text-sm md:text-lg font-medium tracking-tight leading-snug">{opt.value}</span>
                                            </div>
                                            {selectedOption === (['A', 'B', 'C', 'D'].includes(question.answer) ? opt.key : opt.value) && (
                                                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer Controls - Now guaranteed visible */}
                <div className="flex justify-between items-center px-2 pb-2">
                    <button
                        onClick={handlePrev}
                        disabled={questionIndex === 0}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-xs ${questionIndex === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>PREV</span>
                    </button>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-primary rounded-xl transition-all font-black border border-white/5 hover:border-primary shadow-lg uppercase tracking-widest text-[9px]"
                    >
                        <span>{questionIndex === questions.length - 1 ? 'FINALIZE' : 'SKIP'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MCQPage;
