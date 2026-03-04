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
    RefreshCw
} from 'lucide-react';
import { supabase } from '../supabaseClient';

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
            const response = await axios.get(`http://localhost:5001/api/quizzes?userId=${session.user.id}`);
            setQuizzes(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching quizzes:", error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return alert("Select a file");

        const { data: { session } } = await supabase.auth.getSession();
        const formData = new FormData();
        formData.append('userId', session.user.id);
        formData.append('name', uploadForm.name);
        formData.append('file', uploadForm.file);

        setUploading(true);
        try {
            await axios.post('http://localhost:5001/api/quizzes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadForm({ name: '', file: null });
            fetchQuizzes();
            setUploading(false);
        } catch (error) {
            console.error("Upload failed:", error);
            setUploading(false);
            alert("Upload failed. Ensure the server is running and file is CSV.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this module and all its data?")) return;
        try {
            await axios.delete(`http://localhost:5001/api/quizzes/${id}`);
            fetchQuizzes();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const startEditing = (quiz) => {
        setEditingId(quiz.id);
        setEditForm({ name: quiz.name, filename: quiz.filename });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const handleSaveEdit = async (id) => {
        try {
            await axios.patch(`http://localhost:5001/api/quizzes/${id}`, editForm);
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
            const response = await axios.get(`http://localhost:5001/api/questions?quiz=${quiz.filename}`);
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
        } catch (error) {
            console.error("Migration fatal error:", error);
            alert("Migration failed: " + (error.message || "Unknown error"));
            setMigratingId(null);
        }
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Upload Section */}
                <div className="lg:col-span-1">
                    <div className="p-8 glass-card rounded-[2.5rem] sticky top-24 border-t-white/10">
                        <div className="flex items-center gap-3 mb-8">
                            <Plus className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold uppercase tracking-widest text-white/80">Initialize New</h2>
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
                                                <button onClick={() => handleSaveEdit(quiz.id)} className="px-6 py-2 bg-purple-500 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20">
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
                                                    <p className="text-xs font-mono text-slate-600 mt-1 uppercase tracking-tighter">Source: {quiz.filename}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleMigrateToCloud(quiz)}
                                                    disabled={migratingId !== null}
                                                    title="Migrate to Supabase Cloud"
                                                    className={`p-3 rounded-xl transition-all ${migratingId === quiz.id ? 'bg-purple-500 text-white animate-spin' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400'}`}
                                                >
                                                    {migratingId === quiz.id ? <RefreshCw className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => startEditing(quiz)}
                                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(quiz.id)}
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
