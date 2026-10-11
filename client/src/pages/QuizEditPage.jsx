import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import QuizForm from '../components/QuizForm';

export default function QuizEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [id]);

  async function loadQuiz() {
    try {
      setLoading(true);
      const { quiz } = await api.getQuiz(id);
      setQuiz(quiz);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data) {
    await api.updateQuiz(id, data);
    navigate('/my-quizzes');
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Загрузка...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: '#c00', marginBottom: '1rem' }}>{error}</div>
        <Link to="/my-quizzes">← Назад к списку</Link>
      </div>
    );
  }

  if (!quiz) {
    return <div style={{ padding: '2rem' }}>Квиз не найден</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/my-quizzes" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Назад к списку
        </Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Редактирование квиза</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Вопросов в квизе: <strong>{quiz.questions?.length || 0}</strong>
      </p>

      <QuizForm
        initialData={quiz}
        onSubmit={handleSubmit}
        submitLabel="Сохранить изменения"
      />

      <div
        style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <p style={{ color: '#999' }}>
          Редактор вопросов будет доступен после создания формы (следующий подэтап).
        </p>
      </div>
    </div>
  );
}