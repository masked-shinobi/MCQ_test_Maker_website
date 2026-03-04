import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Database,
    ArrowLeft,
    Plus,
    Upload,
    Trash2,
    Edit3,
    Check,
    X,
    FileText,
    ShieldCheck,
    AlertCircle,
    Cloud,
    RefreshCw,
    Copy,
    Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import API_URL from '../config';

const QuizManagementPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [migratingId, setMigratingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', filename: '' });
    const [uploadForm, setUploadForm] = useState({ name: '', file: null });
    const navigate = useNavigate();

    const fetchQuizzes = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Fetch Local & Cloud Data
            const localResponse = await axios.get(`${API_URL}/api/quizzes?userId=${session.user.id}`);

            const { data: cloudQuizzes, error: cloudError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('user_id', session.user.id);

            if (cloudError) console.error("Cloud fetch error:", cloudError);

            // 2. Map and Merge with Deduplication
            const localQuizzes = localResponse.data.map(localQ => {
                const isMigrated = (cloudQuizzes || []).some(cloudQ =>
                    cloudQ.name.trim().toLowerCase() === localQ.name.trim().toLowerCase()
                );
                return { ...localQ, source: 'local', isMigrated };
            });

            const formattedCloud = (cloudQuizzes || []).map(q => ({
                id: q.id,
                name: q.name,
                filename: 'Cloud_Storage',
                source: 'cloud',
                isCloud: true
            }));

            // Deduplicate all quizzes by name, preferring cloud version
            const allQuizzes = [...formattedCloud, ...localQuizzes];
            const uniqueQuizzes = Array.from(
                allQuizzes.reduce((map, quiz) => {
                    const key = quiz.name.trim().toLowerCase();
                    const existing = map.get(key);
                    // Keep cloud version if it exists, otherwise keep what we have
                    if (!existing || (quiz.source === 'cloud' && existing.source === 'local')) {
                        map.set(key, quiz);
                    }
                    return map;
                }, new Map()).values()
            );

            setQuizzes(uniqueQuizzes);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const [uploadTarget, setUploadTarget] = useState('local'); // 'local' or 'cloud'

    const parseCSV = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        return lines.slice(1).map(line => {
            // Robust CSV split handling quoted commas
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches) return null;
            const values = matches.map(v => v.trim().replace(/^"|"$/g, ''));

            const obj = {};
            headers.forEach((h, i) => {
                obj[h] = values[i];
            });
            return obj;
        }).filter(Boolean);
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return alert("Select a file");

        const { data: { session } } = await supabase.auth.getSession();
        setUploading(true);

        try {
            if (uploadTarget === 'cloud') {
                // 1. Read and Parse locally
                const text = await uploadForm.file.text();
                const questions = parseCSV(text);

                if (questions.length === 0) throw new Error("No data found in CSV");

                // 2. Create Quiz in Supabase
                const { data: quiz, error: quizError } = await supabase
                    .from('quizzes')
                    .insert([{
                        name: uploadForm.name || uploadForm.file.name.replace('.csv', ''),
                        user_id: session.user.id
                    }])
                    .select()
                    .single();

                if (quizError) throw quizError;

                // 3. Batch Insert Questions
                const supabaseQuestions = questions.map(q => ({
                    quiz_id: quiz.id,
                    question: q.Question || q.question,
                    option_a: q.OptionA || q.optionA,
                    option_b: q.OptionB || q.optionB,
                    option_c: q.OptionC || q.optionC,
                    option_d: q.OptionD || q.optionD,
                    answer: q.Answer || q.answer
                }));

                const { error: batchError } = await supabase
                    .from('questions')
                    .insert(supabaseQuestions);

                if (batchError) throw batchError;

                alert(`Successfully deployed to Cloud Vault with ${questions.length} questions!`);
            } else {
                // Traditional Local Upload
                const formData = new FormData();
                formData.append('userId', session.user.id);
                formData.append('name', uploadForm.name);
                formData.append('file', uploadForm.file);

                await axios.post(`${API_URL}/api/quizzes/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setUploadForm({ name: '', file: null });
            fetchQuizzes();
            setUploading(false);
        } catch (error) {
            console.error("Initialization failed:", error);
            setUploading(false);
            alert("Process failed: " + (error.message || "Check file format or server status."));
        }
    };

    const handleDelete = async (quiz) => {
        if (!window.confirm(`Delete "${quiz.name}" and all its data?`)) return;
        try {
            if (quiz.source === 'cloud') {
                const { error } = await supabase
                    .from('quizzes')
                    .delete()
                    .eq('id', quiz.id);
                if (error) throw error;
            } else {
                await axios.delete(`${API_URL}/api/quizzes/${quiz.id}`);
            }
            fetchQuizzes();
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Delete failed: " + error.message);
        }
    };

    const startEditing = (quiz) => {
        setEditingId(quiz.id);
        setEditForm({ name: quiz.name, filename: quiz.filename });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (quiz) => {
        try {
            if (quiz.source === 'cloud') {
                const { error } = await supabase
                    .from('quizzes')
                    .update({ name: editForm.name })
                    .eq('id', quiz.id);
                if (error) throw error;
            } else {
                await axios.patch(`${API_URL}/api/quizzes/${quiz.id}`, editForm);
            }
            setEditingId(null);
            fetchQuizzes();
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update quiz metadata.");
        }
    };

    const handleMigrateToCloud = async (quiz) => {
        const confirm = window.confirm(`Migrate "${quiz.name}" to Supabase Cloud? This will convert CSV rows to SQL tables.`);
        if (!confirm) return;

        setMigratingId(quiz.id);
        try {
            // 1. Fetch questions from local server
            const response = await axios.get(`${API_URL}/api/questions?quiz=${quiz.filename}`);
            const questions = response.data;

            if (questions.length === 0) throw new Error("No questions found in CSV");

            // 2. Insert Quiz metadata into Supabase
            const { data: { user } } = await supabase.auth.getUser();
            const { data: supabaseQuiz, error: quizError } = await supabase
                .from('quizzes')
                .insert([{ name: quiz.name, user_id: user.id }])
                .select()
                .single();

            if (quizError) throw quizError;

            // 3. Prepare questions for Supabase
            const supabaseQuestions = questions.map(q => ({
                quiz_id: supabaseQuiz.id,
                question: q.question,
                option_a: q.optionA,
                option_b: q.optionB,
                option_c: q.optionC,
                option_d: q.optionD,
                answer: q.answer
            }));

            // 4. Batch insert questions
            const { error: batchError } = await supabase
                .from('questions')
                .insert(supabaseQuestions);

            if (batchError) throw batchError;

            alert(`Successfully migrated ${questions.length} questions to Supabase!`);
            setMigratingId(null);
            fetchQuizzes();
        } catch (error) {
            console.error("Migration fatal error:", error);
            alert("Migration failed: " + (error.message || "Unknown error"));
            setMigratingId(null);
        }
    };

    const copyMasterPrompt = () => {
        const prompt = `Act as an expert MCQ generator. Create a professional CSV dataset for the topic: "[REPLACE_WITH_YOUR_TOPIC]". 
The output MUST be a valid CSV file with these exact headers: Question,OptionA,OptionB,OptionC,OptionD,Answer
The 'Answer' column should contain only the letter (A, B, C, or D).
Generate 10 challenging questions. Do not include any intro/outro text, only the CSV data.`;

        navigator.clipboard.writeText(prompt);
        alert("Master Prompt copied! Paste this into ChatGPT or Claude to generate your CSV.");
    };

    return (
        <motion.div
            className="min-h-screen px-4 py-20 max-w-6xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-purple-500/20 rounded-[2rem] border border-purple-500/20 shadow-2xl">
                        <Database className="w-10 h-10 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tight">Module <span className="text-purple-400">Vault</span></h1>
                        <p className="text-slate-500 font-medium mt-1">Manage MCQ datasets and system metadata.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 font-bold"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Return Dashboard</span>
                </button>
            </div>

            {/* Master Prompt Section */}
            <motion.div
                className="mb-12 p-8 glass-card rounded-[2.5rem] border border-purple-500/10 bg-gradient-to-r from-purple-500/[0.03] to-transparent flex flex-col md:flex-row items-center justify-between gap-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Generate with AI</h3>
                        <p className="text-slate-500 text-sm max-w-md">Copy the expert prompt to generate compatible CSV datasets instantly using any LLM.</p>
                    </div>
                </div>
                <button
                    onClick={copyMasterPrompt}
                    className="group flex items-center gap-3 px-8 py-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-2xl transition-all text-purple-400 font-black uppercase tracking-widest text-xs"
                >
                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Copy Master_Prompt</span>
                </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <div className="p-8 glass-card rounded-[2.5rem] sticky top-24 border-t-white/10">
                        <div className="flex items-center gap-3 mb-8">
                            <Plus className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold uppercase tracking-widest text-white/80">Initialize New</h2>
                        </div>

                        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setUploadTarget('local')}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${uploadTarget === 'local' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Local_Vault
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadTarget('cloud')}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${uploadTarget === 'cloud' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Cloud_Vault
                            </button>
                        </div>

                        <form onSubmit={handleFileUpload} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">Display Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., ADVANCED_NLP_MCQ"
                                    value={uploadForm.name}
                                    onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl outline-none focus:border-purple-500/50 transition-all font-bold text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 ml-1">CSV Source</label>
                                <div className="relative">
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        name="file"
                                        onChange={e => {
                                            const selectedFile = e.target.files[0];
                                            console.log("File selected:", selectedFile);
                                            setUploadForm(prev => ({ ...prev, file: selectedFile }));
                                        }}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className={`w-full border-2 border-dashed p-8 rounded-2xl flex flex-col items-center gap-3 cursor-pointer transition-all ${uploadForm.file
                                            ? 'bg-purple-500/10 border-purple-500/50'
                                            : 'bg-black/40 border-white/10 hover:border-purple-500/30'
                                            }`}
                                    >
                                        <Upload className={`w-8 h-8 ${uploadForm.file ? 'text-purple-400' : 'text-slate-600'}`} />
                                        <div className="text-center">
                                            <span className={`text-sm font-bold block ${uploadForm.file ? 'text-white' : 'text-slate-500'}`}>
                                                {uploadForm.file ? uploadForm.file.name : 'Select .csv file'}
                                            </span>
                                            {uploadForm.file && (
                                                <span className="text-[10px] text-purple-400/60 font-black uppercase mt-1 block">Click to change file</span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-5 bg-purple-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {uploading ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck className="w-5 h-5" />
                                        <span>DEPLOY_MODULE</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        <div className="px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                            <span>Active_Resources</span>
                            <span>System_Metadata</span>
                        </div>

                        <AnimatePresence>
                            {quizzes.map((quiz, idx) => (
                                <motion.div
                                    key={quiz.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-8 glass-card rounded-3xl border border-white/5 hover:border-purple-500/20 transition-all group"
                                >
                                    {editingId === quiz.id ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 mb-2 block tracking-widest uppercase">Metadata_Name</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-purple-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-600 mb-2 block tracking-widest uppercase">Exact_Filename</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.filename}
                                                        onChange={e => setEditForm({ ...editForm, filename: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-purple-500/50 font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-4 justify-end">
                                                <button onClick={cancelEditing} className="px-6 py-2 bg-white/5 rounded-xl font-bold flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                                                    <X className="w-4 h-4" /> Cancel
                                                </button>
                                                <button onClick={() => handleSaveEdit(quiz)} className="px-6 py-2 bg-purple-500 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20">
                                                    <Check className="w-4 h-4" /> Save Metadata
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                                                    <FileText className="w-7 h-7 text-slate-500 group-hover:text-purple-400 transition-colors" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">{quiz.name}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-xs font-mono text-slate-600 uppercase tracking-tighter">Source: {quiz.filename}</p>
                                                        {quiz.isMigrated && <span className="text-[8px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-green-500/20">Migrated</span>}
                                                    </div>
                                                    {quiz.source === 'cloud' && <span className="text-[8px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-purple-500/20 block w-fit mt-1">Cloud_Vault</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {quiz.source === 'local' && (
                                                    <button
                                                        onClick={() => handleMigrateToCloud(quiz)}
                                                        disabled={migratingId !== null || quiz.isMigrated}
                                                        title={quiz.isMigrated ? "Already in Cloud" : "Migrate to Supabase Cloud"}
                                                        className={`p-3 rounded-xl transition-all ${migratingId === quiz.id ? 'bg-purple-500 text-white animate-spin' : (quiz.isMigrated ? 'bg-green-500/10 text-green-500/50 cursor-not-allowed' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400')}`}
                                                    >
                                                        {migratingId === quiz.id ? <RefreshCw className="w-5 h-5" /> : (quiz.isMigrated ? <Check className="w-5 h-5" /> : <Cloud className="w-5 h-5" />)}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => startEditing(quiz)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(quiz)}
                                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all text-red-500/60 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {quizzes.length === 0 && !isLoading && (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <p className="text-slate-600 font-bold">No active MCQ modules detected.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QuizManagementPage;
