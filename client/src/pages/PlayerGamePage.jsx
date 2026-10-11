import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function PlayerGamePage() {
  const { roomId } = useParams();
  const { socket } = useSocket();

  const [phase, setPhase] = useState('waiting'); // waiting | question | answered | results | finished
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selected, setSelected] = useState([]);
  const [lastResult, setLastResult] = useState(null); // { isCorrect, points }
  const [results, setResults] = useState(null);
  const [me, setMe] = useState(null); // { score }
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  // Слушаем события
  useEffect(() => {
    if (!socket) return;

    function onGameStarted(data) {
      setTotalQuestions(data.totalQuestions);
      setPhase('waiting');
    }

    function onQuestionShow(data) {
      setQuestion(data.question);
      setQuestionIndex(data.index);
      setTotalQuestions(data.total);
      setTimeLeft(data.timeLimit);
      setSelected([]);
      setLastResult(null);
      setResults(null);
      setPhase('question');
      submittedRef.current = false;

      if (timerRef.current) clearInterval(timerRef.current);
      const start = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        const left = Math.max(0, data.timeLimit - elapsed);
        setTimeLeft(Math.ceil(left));
        if (left <= 0) clearInterval(timerRef.current);
      }, 200);
    }

    function onQuestionResults(data) {
      if (timerRef.current) clearInterval(timerRef.current);
      setResults(data);
      setPhase('results');
    }

    function onPlayers({ players }) {
      setPlayers(players);
      // Находим себя в списке
      const myToken = localStorage.getItem('token');
      // Простой способ — найти себя по socket.user.id мы не имеем, но у нас есть user из AuthContext.
      // Проще: сохраняем playerId при входе.
      // Здесь просто обновим список, а «me» вычисляем по id из AuthContext (ниже).
    }

    function onGameFinished({ players: finalPlayers }) {
      setPlayers(finalPlayers);
      setPhase('finished');
    }

    socket.on('game:started', onGameStarted);
    socket.on('question:show', onQuestionShow);
    socket.on('question:results', onQuestionResults);
    socket.on('room:players', onPlayers);
    socket.on('game:finished', onGameFinished);

    return () => {
      socket.off('game:started', onGameStarted);
      socket.off('question:show', onQuestionShow);
      socket.off('question:results', onQuestionResults);
      socket.off('room:players', onPlayers);
      socket.off('game:finished', onGameFinished);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket]);

  // Автоматически переподключаемся к комнате (на случай F5)
  useEffect(() => {
    if (!socket || !roomId) return;
    // Пытаемся найти по playerId из localStorage или просто по сокету — но у нас нет кода комнаты.
    // Игрок уже в комнате с момента join, поэтому дополнительно ничего не делаем.
  }, [socket, roomId]);

  function toggleAnswer(answerId) {
    if (phase !== 'question' || submittedRef.current) return;

    if (question.type === 'single') {
      setSelected([answerId]);
    } else {
      setSelected((prev) =>
        prev.includes(answerId)
          ? prev.filter((id) => id !== answerId)
          : [...prev, answerId]
      );
    }
  }

  function submitAnswer() {
    if (selected.length === 0 || submittedRef.current || !question) return;

    submittedRef.current = true;

    socket.emit(
      'room:answer',
      { roomId, questionId: question.id, answerIds: selected },
      (response) => {
        if (response?.error) {
          setError(response.error);
          submittedRef.current = false;
          return;
        }
        setLastResult({
          isCorrect: response.isCorrect,
          points: response.points,
        });
        setPhase('answered');
      }
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#c00', marginBottom: '1rem' }}>{error}</div>
        <Link to="/" style={{ color: '#3498db' }}>
          ← На главную
        </Link>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Ждём начала игры...</h1>
        <p style={{ color: '#666' }}>Организатор скоро запустит первый вопрос</p>
      </div>
    );
  }

  if (phase === 'finished') {
    const myIndex = players.findIndex((p) => p.score === (me?.score ?? -1));
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center' }}>🏁 Игра завершена!</h1>

        <div style={{ marginTop: '2rem' }}>
          {players.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.8rem 1.2rem',
                background: i === 0 ? '#fff8e1' : 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                marginBottom: '0.5rem',
              }}
            >
              <span>
                <strong style={{ marginRight: '0.8rem', color: '#666' }}>
                  #{i + 1}
                </strong>
                {p.user.name}
              </span>
              <strong>{p.score} очков</strong>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            to="/"
            style={{
              padding: '0.7rem 1.5rem',
              background: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
            }}
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // phase === 'question' | 'answered' | 'results'
  return (
    <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          color: '#666',
        }}
      >
        <span>
          Вопрос {questionIndex + 1} из {totalQuestions}
        </span>
        {phase === 'question' && (
          <span
            style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: timeLeft <= 5 ? '#c00' : '#2c3e50',
            }}
          >
            ⏱ {timeLeft}
          </span>
        )}
      </div>

      <div
        style={{
          padding: '1.5rem',
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: 12,
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{question.text}</h2>

        {question.imageUrl && (
          <img
            src={`http://localhost:3001${question.imageUrl}`}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: 250,
              display: 'block',
              margin: '1rem 0',
              borderRadius: 8,
            }}
          />
        )}

        {question.type === 'multiple' && phase === 'question' && (
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Можно выбрать несколько вариантов
          </p>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        {question.answers.map((a) => {
          const isSelected = selected.includes(a.id);
          const isCorrect = results?.correctAnswerIds?.includes(a.id);

          let bg = 'white';
          let border = '2px solid #e0e0e0';

          if (phase === 'question' && isSelected) {
            bg = '#e3f2fd';
            border = '2px solid #3498db';
          } else if (phase === 'answered' && isSelected) {
            bg = '#fff3cd';
            border = '2px solid #f39c12';
          } else if (phase === 'results' && isCorrect) {
            bg = '#d4edda';
            border = '2px solid #27ae60';
          } else if (phase === 'results' && isSelected && !isCorrect) {
            bg = '#f8d7da';
            border = '2px solid #e74c3c';
          }

          return (
            <button
              key={a.id}
              onClick={() => toggleAnswer(a.id)}
              disabled={phase !== 'question'}
              style={{
                padding: '1rem',
                background: bg,
                border,
                borderRadius: 8,
                fontSize: '1.05rem',
                cursor: phase === 'question' ? 'pointer' : 'default',
                textAlign: 'left',
              }}
            >
              {a.text}
              {phase === 'results' && isCorrect && ' ✓'}
            </button>
          );
        })}
      </div>

      {phase === 'question' && (
        <button
          onClick={submitAnswer}
          disabled={selected.length === 0}
          style={{
            width: '100%',
            padding: '1rem',
            background: selected.length === 0 ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem',
            fontWeight: 500,
          }}
        >
          Ответить
        </button>
      )}

      {phase === 'answered' && lastResult && (
        <div
          style={{
            padding: '1rem',
            background: lastResult.isCorrect ? '#d4edda' : '#f8d7da',
            border: `1px solid ${lastResult.isCorrect ? '#27ae60' : '#e74c3c'}`,
            borderRadius: 8,
            textAlign: 'center',
            fontSize: '1.1rem',
          }}
        >
          {lastResult.isCorrect ? (
            <>
              ✓ <strong>Правильно!</strong> +{lastResult.points} очков
            </>
          ) : (
            <>✗ <strong>Неправильно</strong> (0 очков)</>
          )}
          <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Ждём следующий вопрос...
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div
          style={{
            padding: '1rem',
            background: '#f0f0f0',
            borderRadius: 8,
            textAlign: 'center',
            color: '#666',
          }}
        >
          Ждём следующий вопрос...
        </div>
      )}

      {players.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Лидерборд</h3>
          {players.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.3rem 0',
                color: i === 0 ? '#c9a227' : '#333',
              }}
            >
              <span>
                {i + 1}. {p.user.name}
              </span>
              <span>{p.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}