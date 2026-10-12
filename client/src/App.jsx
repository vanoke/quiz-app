import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import MyQuizzesPage from './pages/MyQuizzesPage';
import QuizCreatePage from './pages/QuizCreatePage';
import QuizEditPage from './pages/QuizEditPage';
import QuizQuestionsPage from './pages/QuizQuestionsPage';
import HostLobbyPage from './pages/HostLobbyPage';
import HostGamePage from './pages/HostGamePage';
import JoinRoomPage from './pages/JoinRoomPage';
import PlayerGamePage from './pages/PlayerGamePage';
import HistoryPage from './pages/HistoryPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem' }}>Загрузка...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

      <Route path="/my-quizzes" element={<ProtectedRoute role="host"><MyQuizzesPage /></ProtectedRoute>} />
      <Route path="/quizzes/new" element={<ProtectedRoute role="host"><QuizCreatePage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/edit" element={<ProtectedRoute role="host"><QuizEditPage /></ProtectedRoute>} />
      <Route path="/quizzes/:id/questions" element={<ProtectedRoute role="host"><QuizQuestionsPage /></ProtectedRoute>} />

      <Route path="/host/quizzes/:id/lobby" element={<ProtectedRoute role="host"><HostLobbyPage /></ProtectedRoute>} />
      <Route path="/host/rooms/:roomId/game" element={<ProtectedRoute role="host"><HostGamePage /></ProtectedRoute>} />

      <Route path="/join" element={<ProtectedRoute><JoinRoomPage /></ProtectedRoute>} />
      <Route path="/play/rooms/:roomId" element={<ProtectedRoute><PlayerGamePage /></ProtectedRoute>} />

      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}