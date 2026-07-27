import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseSelector from './pages/CourseSelector';
import Lesson from './pages/Lesson';
import Results from './pages/Results';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication page */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected Learner routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/languages" 
          element={
            <ProtectedRoute>
              <CourseSelector />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/lesson/:id" 
          element={
            <ProtectedRoute>
              <Lesson />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/results" 
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all route redirecting to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
