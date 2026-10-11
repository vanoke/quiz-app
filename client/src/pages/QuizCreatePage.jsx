import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import QuizForm from '../components/QuizForm';

export default function QuizCreatePage() {
  const navigate = useNavigate();

  async function handleSubmit(data) {
    const { quiz } = await api.createQuiz(data);
    navigate(`/quizzes/${quiz.id}/edit`);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/my-quizzes" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Назад к списку
        </Link>
      </div>

      <h1 style={{ marginTop: 0 }}>Создание квиза</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Заполните основную информацию. После создания вы сможете добавить вопросы.
      </p>

      <QuizForm onSubmit={handleSubmit} submitLabel="Создать квиз" />
    </div>
  );
}