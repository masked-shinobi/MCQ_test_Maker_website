import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import CustomCursor from './components/CustomCursor';
import Background from './components/Background';
import LandingPage from './pages/LandingPage';
import MCQPage from './pages/MCQPage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import StudyMaterialPage from './pages/StudyMaterialPage';
import QuizManagementPage from './pages/QuizManagementPage';

const AppContent = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/quizzes');
        setQuizzes(response.data);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
      }
    };
    fetchQuizzes();
  }, []);

  const fetchQuestions = async (quizId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/questions?quiz=${quizId}`);
      setQuestions(response.data);
      setSelectedQuiz(quizzes.find(q => q.id === quizId));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setIsLoading(false);
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const resetTest = () => {
    setUserAnswers({});
    setUserName('');
    navigate('/');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-white selection:bg-primary/30">
      <CustomCursor />
      <Background />

      <AnimatePresence mode="wait">
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
