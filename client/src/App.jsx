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

const AppContent = () => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/questions');
        setQuestions(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

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
          <Route path="/" element={<LandingPage setGlobalName={setUserName} />} />
          <Route
            path="/question/:id"
            element={
              <MCQPage
                questions={questions}
                userAnswers={userAnswers}
                onAnswer={handleAnswer}
                isLoading={isLoading}
                userName={userName}
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
              />
            }
          />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/material" element={<StudyMaterialPage questions={questions} />} />
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
