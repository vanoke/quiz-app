import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function MyQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);
      const data = await api.myQuizzes();
      setQuizzes(data.quizzes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!confirm(`Удалить квиз «${title}»? Это действие необратимо.`)) {
      return;
    }

    try {
      await api.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Загрузка...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Мои квизы</h1>
        <button
          onClick={() => navigate('/quizzes/new')}
          style={{
            padding: '0.6rem 1.2rem',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          + Создать квиз
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
      )}

      {quizzes.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#f9f9f9',
            borderRadius: 8,
            border: '1px dashed #ccc',
          }}
        >
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            У вас пока нет квизов.
          </p>
          <p style={{ color: '#999' }}>
            Нажмите «+ Создать квиз», чтобы начать.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '1rem',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.5rem',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{quiz.title}</h3>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: 4,
                    background:
                      quiz.status === 'published' ? '#d4edda' : '#fff3cd',
                    color:
                      quiz.status === 'published' ? '#155724' : '#856404',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {quiz.status === 'published' ? 'Опубликован' : 'Черновик'}
                </span>
              </div>

              <p
                style={{
                  color: '#666',
                  fontSize: '0.9rem',
                  margin: '0 0 0.75rem 0',
                }}
              >
                {quiz.category}
              </p>

              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  marginBottom: '1rem',
                }}
              >
                <div>Вопросов: {quiz._count?.questions ?? 0}</div>
                <div>Время на вопрос: {quiz.timePerQuestion} сек</div>
                <div>Создан: {formatDate(quiz.createdAt)}</div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: 'auto',
                }}
              >
                <Link
                  to={`/quizzes/${quiz.id}/edit`}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    textAlign: 'center',
                    background: '#f0f0f0',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: 4,
                    fontSize: '0.9rem',
                  }}
                >
                  Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    background: '#fee',
                    color: '#c00',
                    border: '1px solid #fcc',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}