import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, userAPI } from '../services/api';

const Lesson = () => {
  const { id: lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Question state
  const [selectedOption, setSelectedOption] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Lesson performance
  const [submittedAnswers, setSubmittedAnswers] = useState([]);
  const [localHearts, setLocalHearts] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const res = await courseAPI.getLessonQuestions(lessonId);
        setLesson(res.data);
        setQuestions(res.data.questions || []);
        
        // Fetch current user stats to match hearts count
        const dashRes = await userAPI.getDashboard();
        setLocalHearts(dashRes.data.stats.hearts);
      } catch (err) {
        console.error(err);
        setError('Failed to load lesson questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="lesson-loading-view">
        <div className="spinner"></div>
        <p>Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lesson-error-view">
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="lesson-error-view">
        <p>No questions are configured for this lesson yet.</p>
        <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (opt) => {
    if (isChecked) return;
    setSelectedOption(opt);
  };

  const handleCheck = () => {
    if (isChecked) return;

    let answerText = '';
    if (currentQuestion.type === 'multiple-choice') {
      answerText = selectedOption;
    } else {
      answerText = typedAnswer;
    }

    if (!answerText.trim()) {
      alert('Please select or write an answer first.');
      return;
    }

    // Client-side quick check for visual coloring
    const isAnswerCorrect = currentQuestion.correctAnswer.trim().toLowerCase() === answerText.trim().toLowerCase();
    setIsCorrect(isAnswerCorrect);
    setIsChecked(true);

    // Save answer payload for backend submission
    setSubmittedAnswers(prev => [
      ...prev,
      { questionId: currentQuestion.id, answer: answerText }
    ]);

    if (!isAnswerCorrect) {
      setLocalHearts(prev => Math.max(0, prev - 1));
    }
  };

  const handleContinue = async () => {
    // If user lost all hearts, abort lesson
    if (localHearts <= 0 && !isCorrect) {
      alert('No hearts left! Submitting lesson results now.');
      submitFinalAnswers(true);
      return;
    }

    // Go to next question or submit
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption('');
      setTypedAnswer('');
      setIsChecked(false);
      setIsCorrect(false);
    } else {
      // Complete lesson
      submitFinalAnswers(false);
    }
  };

  const submitFinalAnswers = async (forceFail = false) => {
    try {
      setSubmitting(true);
      // Even if aborted, we submit progress to sync DB stats
      const payloadAnswers = forceFail 
        ? submittedAnswers 
        : submittedAnswers; // could be partial or full

      const res = await userAPI.submitLesson(lessonId, payloadAnswers);
      
      // Navigate to results page passing data
      navigate('/results', {
        state: {
          lessonTitle: lesson.title,
          results: res.data,
          wasFailed: forceFail || res.data.heartsLeft === 0 && res.data.correctCount < res.data.totalQuestions
        }
      });
    } catch (err) {
      console.error(err);
      alert('Error saving your progress. Navigating back to dashboard.');
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress percentage calculation
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="lesson-page-container">
      {/* Lesson Header */}
      <header className="lesson-navbar">
        <button onClick={() => {
          if (window.confirm('Are you sure you want to quit? You will lose any unsaved progress.')) {
            navigate('/');
          }
        }} className="btn-close-lesson">
          ✕
        </button>

        <div className="lesson-progress-container">
          <div className="lesson-progress-bar" style={{ width: `${progressPercent}%` }}></div>
        </div>

        <div className="lesson-hearts-indicator">
          ❤️ <span className="hearts-count">{localHearts}</span>
        </div>
      </header>

      {/* Lesson Content Panel */}
      <main className="lesson-body">
        <div className="question-slide-box">
          <span className="question-type-badge">
            {currentQuestion.type === 'multiple-choice' ? 'Multiple Choice' : 'Fill in the Blank'}
          </span>
          
          <h2 className="question-text-heading">{currentQuestion.questionText}</h2>

          {currentQuestion.type === 'multiple-choice' ? (
            <div className="options-layout-grid">
              {currentQuestion.options && currentQuestion.options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectOption(opt)}
                  className={`option-choice-card ${selectedOption === opt ? 'selected' : ''} ${
                    isChecked && opt === currentQuestion.correctAnswer ? 'correct-highlight' : ''
                  } ${
                    isChecked && selectedOption === opt && opt !== currentQuestion.correctAnswer ? 'wrong-highlight' : ''
                  }`}
                  disabled={isChecked}
                >
                  <span className="option-index">{index + 1}</span>
                  <span className="option-label">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="fill-blank-layout">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type the translation here..."
                disabled={isChecked}
                className={`fill-blank-input ${
                  isChecked && isCorrect ? 'correct-field' : ''
                } ${
                  isChecked && !isCorrect ? 'wrong-field' : ''
                }`}
                autoFocus
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Feedback Bar */}
      <footer className={`lesson-footer-bar ${
        isChecked ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''
      }`}>
        <div className="footer-content-wrap">
          {isChecked ? (
            <div className="feedback-message-group">
              {isCorrect ? (
                <div className="feedback-correct-msg">
                  <span className="feedback-icon">🎉</span>
                  <div className="feedback-txt">
                    <h3>Excellent! You are correct.</h3>
                  </div>
                </div>
              ) : (
                <div className="feedback-wrong-msg">
                  <span className="feedback-icon">❌</span>
                  <div className="feedback-txt">
                    <h3>Incorrect answer</h3>
                    <p>Correct solution: <strong>{currentQuestion.correctAnswer}</strong></p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="footer-tip">
              💡 Tip: Double check spelling before checking your answer!
            </div>
          )}

          <div className="footer-actions">
            {!isChecked ? (
              <button onClick={handleCheck} className="btn-footer-check">
                Check Answer
              </button>
            ) : (
              <button onClick={handleContinue} className="btn-footer-continue" disabled={submitting}>
                {submitting ? 'Saving...' : currentIndex === questions.length - 1 ? 'Finish Lesson' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Lesson;
