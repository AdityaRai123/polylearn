import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider, homePathFor, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CourseSelector from './pages/CourseSelector';
import Lesson from './pages/Lesson';
import Results from './pages/Results';
import Tests from './pages/Tests';
import TakeTest from './pages/TakeTest';
import TestResult from './pages/TestResult';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TestEditor from './pages/teacher/TestEditor';
import TestSubmissions from './pages/teacher/TestSubmissions';

const student = (page) => <ProtectedRoute role="student">{page}</ProtectedRoute>;
const teacher = (page) => <ProtectedRoute role="teacher">{page}</ProtectedRoute>;

// Remount the editor when switching between tests (or to a new one) so no state carries over
const TestEditorRoute = () => {
  const { id } = useParams();
  return <TestEditor key={id ?? 'new'} />;
};

const FallbackRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user ? homePathFor(user) : '/auth'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          {/* Student routes */}
          <Route path="/" element={student(<Dashboard />)} />
          <Route path="/languages" element={student(<CourseSelector />)} />
          <Route path="/lesson/:id" element={student(<Lesson />)} />
          <Route path="/results" element={student(<Results />)} />
          <Route path="/tests" element={student(<Tests />)} />
          <Route path="/tests/:id" element={student(<TakeTest />)} />
          <Route path="/tests/:id/result" element={student(<TestResult />)} />

          {/* Teacher routes */}
          <Route path="/teacher" element={teacher(<TeacherDashboard />)} />
          <Route path="/teacher/tests/new" element={teacher(<TestEditorRoute />)} />
          <Route path="/teacher/tests/:id/edit" element={teacher(<TestEditorRoute />)} />
          <Route path="/teacher/tests/:id/submissions" element={teacher(<TestSubmissions />)} />

          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
