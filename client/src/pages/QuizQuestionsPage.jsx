import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import QuestionForm from '../components/QuestionForm';

export default function QuizQuestionsPage() {
  const { id: quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  async function loadQuiz() {
    try {
      setLoading(true);
      const { quiz } = await api.getQuiz(quizId);
      setQuiz(quiz);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data) {
    const { question } = await api.createQuestion(quizId, data);
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));
    setShowForm(false);
  }

  async function handleUpdate(data) {
    const { question } = await api.updateQuestion(editingQuestion.id, data);
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === question.id ? question : q
      ),
    }));
    setEditingQuestion(null);
  }

  async function handleDelete(question) {
    if (!confirm(`Удалить вопрос "${question.text}"?`)) return;

    try {
      await api.deleteQuestion(question.id);
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== question.id),
      }));
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Загрузка...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: '#c00' }}>{error}</div>
        <Link to="/my-quizzes" style={{ color: '#3498db' }}>
          ← Назад к списку
        </Link>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/my-quizzes" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Назад к списку квизов
        </Link>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Вопросы: {quiz.title}</h1>
          <p style={{ color: '#666', margin: '0.3rem 0 0 0' }}>
            Всего вопросов: <strong>{quiz.questions.length}</strong> •{' '}
            {quiz.timePerQuestion} сек на вопрос по умолчанию
          </p>
        </div>
        <Link
          to={`/quizzes/${quizId}/edit`}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            color: '#3498db',
            textDecoration: 'none',
            border: '1px solid #3498db',
            borderRadius: 4,
            fontSize: '0.9rem',
          }}
        >
          Настройки квиза
        </Link>
      </div>

      {!showForm && !editingQuestion && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '0.7rem 1.3rem',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          + Добавить вопрос
        </button>
      )}

      {showForm && (
        <div style={{ marginBottom: '2rem' }}>
          <QuestionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitLabel="Добавить вопрос"
          />
        </div>
      )}

      {editingQuestion && (
        <div style={{ marginBottom: '2rem' }}>
          <QuestionForm
            initialData={editingQuestion}
            onSubmit={handleUpdate}
            onCancel={() => setEditingQuestion(null)}
            submitLabel="Сохранить изменения"
          />
        </div>
      )}

      {quiz.questions.length === 0 && !showForm ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#f9f9f9',
            borderRadius: 8,
            border: '1px dashed #ccc',
          }}
        >
          <p style={{ color: '#666' }}>В квизе пока нет вопросов.</p>
          <p style={{ color: '#999' }}>Нажмите «+ Добавить вопрос», чтобы начать.</p>
        </div>
      ) : (
        <div>
          {quiz.questions.map((question, idx) => (
            <div
              key={question.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '1rem',
                marginBottom: '0.75rem',
                background: 'white',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#888',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Вопрос {idx + 1} •{' '}
                    {question.type === 'single' ? 'Одиночный' : 'Множественный'}{' '}
                    • {question.answers.length} ответов
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>
                    {question.text}
                  </div>

                  {question.imageUrl && (
                    <img
                      src={`http://localhost:3001${question.imageUrl}`}
                      alt=""
                      style={{
                        maxWidth: 120,
                        maxHeight: 90,
                        borderRadius: 4,
                        marginBottom: '0.5rem',
                        display: 'block',
                      }}
                    />
                  )}

                  <div style={{ fontSize: '0.9rem', color: '#555' }}>
                    {question.answers.map((a) => (
                      <div key={a.id} style={{ marginTop: '0.15rem' }}>
                        {a.isCorrect ? '✓ ' : '○ '}
                        <span style={{ color: a.isCorrect ? '#155724' : '#666' }}>
                          {a.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button
                    onClick={() => {
                      setEditingQuestion(question);
                      setShowForm(false);
                    }}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(question)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: '#fee',
                      color: '#c00',
                      border: '1px solid #fcc',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}