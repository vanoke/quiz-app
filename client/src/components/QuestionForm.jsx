import { useState, useRef } from 'react';
import { api } from '../api/client';

const MAX_ANSWERS = 6;

export default function QuestionForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить вопрос',
}) {
  const [text, setText] = useState(initialData?.text || '');
  const [type, setType] = useState(initialData?.type || 'single');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [timeLimit, setTimeLimit] = useState(initialData?.timeLimit || '');
  const [answers, setAnswers] = useState(
    initialData?.answers?.length
      ? initialData.answers.map((a) => ({
          text: a.text,
          isCorrect: a.isCorrect,
          imageUrl: a.imageUrl || '',
        }))
      : [
          { text: '', isCorrect: true, imageUrl: '' },
          { text: '', isCorrect: false, imageUrl: '' },
        ]
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  function updateAnswer(index, field, value) {
    setAnswers((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  function toggleCorrect(index) {
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== index) {
          // При single выборе снимаем галочки у остальных
          return type === 'single' ? { ...a, isCorrect: false } : a;
        }
        return { ...a, isCorrect: !a.isCorrect };
      })
    );
  }

  function addAnswer() {
    if (answers.length >= MAX_ANSWERS) return;
    setAnswers((prev) => [...prev, { text: '', isCorrect: false, imageUrl: '' }]);
  }

  function removeAnswer(index) {
    if (answers.length <= 2) {
      setError('Должно быть минимум 2 варианта ответа');
      return;
    }
    setAnswers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const { url } = await api.uploadImage(file);
      setImageUrl(url);
    } catch (err) {
      setError('Ошибка загрузки картинки: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Текст вопроса обязателен');
      return;
    }

    const filledAnswers = answers.filter((a) => a.text.trim());
    if (filledAnswers.length < 2) {
      setError('Заполните минимум 2 варианта ответа');
      return;
    }

    const hasCorrect = filledAnswers.some((a) => a.isCorrect);
    if (!hasCorrect) {
      setError('Отметьте хотя бы один правильный ответ');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        text: text.trim(),
        type,
        imageUrl: imageUrl || null,
        timeLimit: timeLimit ? Number(timeLimit) : null,
        answers: filledAnswers.map((a) => ({
          text: a.text.trim(),
          isCorrect: a.isCorrect,
          imageUrl: a.imageUrl || null,
        })),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '1.5rem',
        background: '#f9f9f9',
        borderRadius: 8,
        border: '1px solid #e0e0e0',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Вопрос</h3>

      {/* Тип вопроса */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Тип ответа
        </label>
        <label style={{ marginRight: '1rem' }}>
          <input
            type="radio"
            name="type"
            value="single"
            checked={type === 'single'}
            onChange={(e) => {
              setType(e.target.value);
              // оставляем только первый правильный
              const firstCorrect = answers.findIndex((a) => a.isCorrect);
              setAnswers((prev) =>
                prev.map((a, i) => ({
                  ...a,
                  isCorrect: i === (firstCorrect === -1 ? 0 : firstCorrect),
                }))
              );
            }}
          />{' '}
          Одиночный выбор
        </label>
        <label>
          <input
            type="radio"
            name="type"
            value="multiple"
            checked={type === 'multiple'}
            onChange={(e) => setType(e.target.value)}
          />{' '}
          Множественный выбор
        </label>
      </div>

      {/* Текст вопроса */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="q-text" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Текст вопроса *
        </label>
        <textarea
          id="q-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          required
          placeholder="Например: В каком году началась Вторая мировая война?"
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
        />
      </div>

      {/* Картинка вопроса */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Картинка (опционально)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <span style={{ marginLeft: '0.5rem', color: '#888' }}>Загрузка...</span>}
        {imageUrl && (
          <div style={{ marginTop: '0.5rem' }}>
            <img
              src={`http://localhost:3001${imageUrl}`}
              alt="Превью"
              style={{ maxWidth: 200, maxHeight: 150, borderRadius: 4, display: 'block' }}
            />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              style={{
                marginTop: '0.3rem',
                fontSize: '0.85rem',
                background: 'transparent',
                border: 'none',
                color: '#c00',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Удалить картинку
            </button>
          </div>
        )}
      </div>

      {/* Время на вопрос (переопределение) */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="q-time" style={{ display: 'block', marginBottom: '0.3rem', fontWeight: 500 }}>
          Время на вопрос (секунд, опционально)
        </label>
        <input
          id="q-time"
          type="number"
          min={5}
          max={300}
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          placeholder="Оставьте пустым — берётся из квиза"
          style={{ ...inputStyle, maxWidth: 250 }}
        />
      </div>

      {/* Варианты ответов */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <label style={{ fontWeight: 500 }}>
            Варианты ответа * <span style={{ color: '#888', fontWeight: 400 }}>(от 2 до {MAX_ANSWERS})</span>
          </label>
          <button
            type="button"
            onClick={addAnswer}
            disabled={answers.length >= MAX_ANSWERS}
            style={{
              padding: '0.3rem 0.7rem',
              fontSize: '0.85rem',
              background: answers.length >= MAX_ANSWERS ? '#ccc' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: answers.length >= MAX_ANSWERS ? 'not-allowed' : 'pointer',
            }}
          >
            + Добавить вариант
          </button>
        </div>

        {answers.map((answer, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: 'white',
              borderRadius: 4,
              border: '1px solid #e0e0e0',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer',
                minWidth: 100,
              }}
              title="Отметить как правильный"
            >
              <input
                type={type === 'single' ? 'radio' : 'checkbox'}
                name={type === 'single' ? 'correct-answer' : `correct-${index}`}
                checked={answer.isCorrect}
                onChange={() => toggleCorrect(index)}
              />
              <span style={{ fontSize: '0.85rem', color: answer.isCorrect ? '#155724' : '#666' }}>
                {answer.isCorrect ? '✓ Верный' : 'Отметить'}
              </span>
            </label>
            <input
              type="text"
              value={answer.text}
              onChange={(e) => updateAnswer(index, 'text', e.target.value)}
              placeholder={`Вариант ${index + 1}`}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeAnswer(index)}
              disabled={answers.length <= 2}
              style={{
                padding: '0.3rem 0.6rem',
                background: answers.length <= 2 ? '#eee' : '#fee',
                color: answers.length <= 2 ? '#999' : '#c00',
                border: '1px solid #fcc',
                borderRadius: 4,
                cursor: answers.length <= 2 ? 'not-allowed' : 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ))}
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

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={loading || uploading}
          style={{
            padding: '0.6rem 1.2rem',
            background: loading ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Сохранение...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

const inputStyle = {
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '1rem',
  boxSizing: 'border-box',
  width: '100%',
};