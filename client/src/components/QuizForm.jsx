import { useState } from 'react';

export default function QuizForm({ initialData, onSubmit, submitLabel = 'Сохранить' }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Общее');
  const [timePerQuestion, setTimePerQuestion] = useState(
    initialData?.timePerQuestion || 30
  );
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    if (timePerQuestion < 5 || timePerQuestion > 300) {
      setError('Время на вопрос должно быть от 5 до 300 секунд');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        title: title.trim(),
        description,
        category,
        timePerQuestion: Number(timePerQuestion),
        status,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    'Общее',
    'История',
    'География',
    'Наука',
    'Спорт',
    'Искусство',
    'Кино',
    'Музыка',
    'Литература',
    'IT и технологии',
  ];

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="title" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Название *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={100}
          placeholder="Например: Столицы мира"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="description" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Описание
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Краткое описание квиза"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="category" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Категория
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="timePerQuestion" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Время на вопрос (секунд)
        </label>
        <input
          id="timePerQuestion"
          type="number"
          min={5}
          max={300}
          value={timePerQuestion}
          onChange={(e) => setTimePerQuestion(e.target.value)}
          style={{ ...inputStyle, maxWidth: 120 }}
        />
        <small style={{ color: '#888', marginLeft: '0.5rem' }}>
          от 5 до 300 секунд
        </small>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Статус
        </label>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="radio"
            name="status"
            value="draft"
            checked={status === 'draft'}
            onChange={(e) => setStatus(e.target.value)}
          />{' '}
          Черновик
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="published"
            checked={status === 'published'}
            onChange={(e) => setStatus(e.target.value)}
          />{' '}
          Опубликован
        </label>
      </div>

      {error && (
        <div
          style={{
            color: '#c00',
            marginBottom: '1rem',
            padding: '0.5rem',
            background: '#fee',
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.7rem 1.5rem',
          background: loading ? '#95a5a6' : '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
        }}
      >
        {loading ? 'Сохранение...' : submitLabel}
      </button>
    </form>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '1rem',
  boxSizing: 'border-box',
};