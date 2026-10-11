import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function HostGamePage() {
  const { roomId } = useParams();
  const { socket } = useSocket();

  const [quizTitle, setQuizTitle] = useState('');
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState('idle');
  const [results, setResults] = useState(null);
  const [players, setPlayers] = useState([]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    socket.emit('room:join', { code: null }, () => {});
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    function onGameStarted(data) {
      setQuizTitle(data.quiz.title);
      setTotalQuestions(data.totalQuestions);
      setPhase('waiting');
    }

    function onQuestionShow(data) {
      setQuestion(data.question);
      setQuestionIndex(data.index);
      setTotalQuestions(data.total);
      setTimeLeft(data.timeLimit);
      setPhase('question');
      setResults(null);

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
    }

    function onGameFinished({ players: finalPlayers, quizTitle: title }) {
      setPlayers(finalPlayers);
      setQuizTitle(title);
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

  function handleNext() {
    socket.emit('room:next', { roomId }, (response) => {
      if (response?.error) alert(response.error);
    });
  }

  if (phase === 'idle' || phase === 'waiting') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1>Игра начинается...</h1>
        <p style={{ color: '#666' }}>Приготовьтесь, первый вопрос через секунду</p>
      </div>
    );
  }

  if (phase === 'finished') {
    return (
      <div style={{ padding: '3rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center' }}>🏆 Игра завершена!</h1>
        <h2 style={{ textAlign: 'center', color: '#666' }}>{quizTitle}</h2>

        <div style={{ marginTop: '2rem' }}>
          {players.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                background: i === 0 ? '#fff8e1' : i === 1 ? '#f5f5f5' : i === 2 ? '#fbe9e7' : 'white',
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                marginBottom: '0.5rem',
                fontSize: '1.1rem',
              }}
            >
              <span>
                <strong style={{ marginRight: '1rem', color: '#666' }}>#{i + 1}</strong>
                {p.user.name}
              </span>
              <strong>{p.score} очков</strong>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            to="/my-quizzes"
            style={{
              padding: '0.8rem 1.5rem',
              background: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 4,
            }}
          >
            К моим квизам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <span style={{ color: '#666' }}>
          Вопрос {questionIndex + 1} из {totalQuestions}
        </span>
        <span
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: timeLeft <= 5 ? '#c00' : '#2c3e50',
          }}
        >
          ⏱ {timeLeft} сек
        </span>
      </div>

      <div
        style={{
          padding: '2rem',
          background: 'white',
          border: '2px solid #e0e0e0',
          borderRadius: 12,
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{question.text}</h2>

        {question.imageUrl && (
          <img
            src={`http://localhost:3001${question.imageUrl}`}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: 300,
              display: 'block',
              margin: '1rem 0',
              borderRadius: 8,
            }}
          />
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.75rem',
            marginTop: '1rem',
          }}
        >
          {question.answers.map((a) => {
            const isCorrect = results?.correctAnswerIds?.includes(a.id);
            const count = results?.answerCounts?.[a.id] ?? 0;
            let bg = '#f9f9f9';
            let border = '1px solid #e0e0e0';
            if (results) {
              if (isCorrect) {
                bg = '#d4edda';
                border = '2px solid #27ae60';
              } else {
                bg = '#f8f8f8';
              }
            }
            return (
              <div
                key={a.id}
                style={{
                  padding: '1rem',
                  background: bg,
                  border,
                  borderRadius: 8,
                  fontSize: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{a.text}</span>
                  {results && (
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      {count} {count === 1 ? 'ответ' : 'ответов'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {results && (
          <p style={{ marginTop: '1rem', color: '#666' }}>
            Ответили: {results.totalAnswered} из {results.totalPlayers}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Лидерборд</h3>
          {players.slice(0, 5).map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.3rem 0',
                color: i === 0 ? '#c9a227' : '#333',
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              <span>
                {i + 1}. {p.user.name}
              </span>
              <span>{p.score}</span>
            </div>
          ))}
        </div>

        {phase === 'results' && (
          <button
            onClick={handleNext}
            style={{
              padding: '1rem 2rem',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 500,
            }}
          >
            {questionIndex + 1 >= totalQuestions ? 'Завершить игру' : 'Следующий вопрос →'}
          </button>
        )}

        {phase === 'question' && (
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Ожидание ответов игроков...
          </div>
        )}
      </div>
    </div>
  );
}