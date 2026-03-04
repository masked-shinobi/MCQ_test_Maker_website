import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, User as UserIcon } from 'lucide-react';
import CustomCursor from './components/CustomCursor';
import Background from './components/Background';
import LandingPage from './pages/LandingPage';
import MCQPage from './pages/MCQPage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import QuizManagementPage from './pages/QuizManagementPage';
import ProfilePage from './pages/ProfilePage';
import { supabase } from './supabaseClient';
import LoginPage from './pages/LoginPage';
import Logo from './components/Logo';
import API_URL from './config';

const UserHeader = ({ userMetadata, onLogout }) => {
  const userName = userMetadata?.full_name || userMetadata?.email || 'Authorized_User';
  const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-6 right-6 z-[100] flex items-center gap-4 bg-white/[0.03] backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-2xl"
    >
      <div
        className="flex flex-col items-end cursor-pointer group"
        onClick={() => navigate('/profile')}
      >
        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">Authorized_User</span>
        <span className="text-sm font-bold text-white tracking-tight">{userName}</span>
      </div>
      <div
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform overflow-hidden"
        onClick={() => navigate('/profile')}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <UserIcon className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="w-[1px] h-8 bg-white/10 mx-1" />
      <button
        onClick={onLogout}
        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
        title="Logout"
      >
        <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-500 transition-colors" />
      </button>
    </motion.div>
  );
};

const AppContent = () => {
  const [session, setSession] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setUserName(session.user.user_metadata.full_name || session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setUserName(session.user.user_metadata.full_name || session.user.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const fetchQuizzes = async () => {
      try {
        const localResponse = await axios.get(`${API_URL}/api/quizzes?userId=${session.user.id}`);
        const localQuizzes = localResponse.data.map(q => ({ ...q, source: 'local' }));

        const { data: cloudQuizzes, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('user_id', session.user.id);

        if (error) throw error;

        const formattedCloud = (cloudQuizzes || []).map(q => ({
          ...q,
          source: 'cloud',
          id: q.id,
          name: q.name,
          questionCount: 'Cloud'
        }));

        setQuizzes([...formattedCloud, ...localQuizzes]);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };
    fetchQuizzes();
  }, [session]);

  const fetchQuestions = async (quizId, count) => {
    setIsLoading(true);
    try {
      let allQuestions = [];
      if (!quizId) return;

      const isCloud = String(quizId).length === 36 && String(quizId).includes('-');

      if (isCloud) {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId);

        if (error) throw error;
        allQuestions = data.map(q => ({
          question: q.question,
          optionA: q.option_a,
          optionB: q.option_b,
          optionC: q.option_c,
          optionD: q.option_d,
          answer: q.answer
        }));
      } else {
        const response = await axios.get(`${API_URL}/api/questions?quiz=${quizId}`);
        allQuestions = response.data;
      }

      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      const limit = count && count > 0 ? Math.min(count, shuffled.length) : shuffled.length;
      const selectedQuestions = shuffled.slice(0, limit);

      setQuestions(selectedQuestions);
      setSelectedQuiz(quizzes.find(q => q.id === quizId));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserName('');
    navigate('/');
  };

  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const resetTest = () => {
    setUserAnswers({});
    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white selection:bg-primary/30">
      <CustomCursor />
      <Background />
      {session && <Logo />}

      {session && <UserHeader userMetadata={session.user.user_metadata} onLogout={handleLogout} />}

      <AnimatePresence mode="wait">
        {!session ? (
          <Routes>
            <Route path="*" element={<LoginPage />} />
          </Routes>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  setGlobalName={setUserName}
                  quizzes={quizzes}
                  onSelectQuiz={fetchQuestions}
                />
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/question/:id"
              element={
                <MCQPage
                  questions={questions}
                  userAnswers={userAnswers}
                  onAnswer={handleAnswer}
                  isLoading={isLoading}
                  userName={userName}
                  quizName={selectedQuiz?.name}
                />
              }
            />
            <Route
              path="/result"
              element={
                <ResultPage
                  questions={questions}
                  userAnswers={userAnswers}
                  userName={userName}
                  onRestart={resetTest}
                  quizName={selectedQuiz?.name}
                />
              }
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/material" element={<StudyMaterialPage quizzes={quizzes} />} />
            <Route path="/manage" element={<QuizManagementPage />} />
          </Routes>
        )}
      </AnimatePresence>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
