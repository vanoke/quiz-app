import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';

export default function HostLobbyPage() {
  const { id: quizId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { quiz } = await api.getQuiz(quizId);
        setQuiz(quiz);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId]);

  useEffect(() => {
    if (!socket || !connected || !quiz) return;

    socket.emit('room:create', { quizId }, (response) => {
      if (response?.error) {
        setError(response.error);
        return;
      }
      setRoom(response.room);
    });
  }, [socket, connected, quiz, quizId]);

  useEffect(() => {
    if (!socket) return;

    function handlePlayers({ players }) {
      setPlayers(players);
    }

    function handleRoomUpdate({ room }) {
      setRoom(room);
    }

    function handleGameStarted() {
      navigate(`/host/rooms/${room.id}/game`);
    }

    socket.on('room:players', handlePlayers);
    socket.on('room:update', handleRoomUpdate);
    socket.on('game:started', handleGameStarted);

    return () => {
      socket.off('room:players', handlePlayers);
      socket.off('room:update', handleRoomUpdate);
      socket.off('game:started', handleGameStarted);
    };
  }, [socket, room?.id, navigate]);

  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('room:join', { code: room.code }, () => {});
  }, [socket, room?.id]);

  function handleStart() {
    if (players.length === 0) {
      alert('Пока нет игроков. Дождитесь хотя бы одного участника.');
      return;
    }
    socket.emit('room:start', { roomId: room.id }, (response) => {
      if (response?.error) alert(response.error);
    });
  }

  if (loading) return <div style={{ padding: '2rem' }}>Загрузка...</div>;

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ color: '#c00', marginBottom: '1rem' }}>{error}</div>
        <Link to="/my-quizzes">← Назад к списку</Link>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: '2rem' }}>
        {connected ? 'Создание комнаты...' : 'Подключение к серверу...'}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Лобби квиза «{quiz?.title}»</h1>

      <div
        style={{
          padding: '1.5rem',
          background: '#f0f8ff',
          border: '2px solid #3498db',
          borderRadius: 8,
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ color: '#666', marginBottom: '0.5rem' }}>
          Код для подключения участников:
        </div>
        <div
          style={{
            fontSize: '3rem',
            fontWeight: 'bold',
            letterSpacing: '0.3rem',
            color: '#2c3e50',
            fontFamily: 'monospace',
          }}
        >
          {room.code}
        </div>
        <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Участники вводят этот код на странице «Присоединиться к квизу»
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0 }}>
          Игроков: <strong>{players.length}</strong>
        </h2>
        <button
          onClick={handleStart}
          disabled={players.length === 0}
          style={{
            padding: '0.8rem 1.5rem',
            background: players.length === 0 ? '#95a5a6' : '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: players.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Начать игру
        </button>
      </div>

      {players.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: '#f9f9f9',
            borderRadius: 8,
            border: '1px dashed #ccc',
            color: '#666',
          }}
        >
          Ожидание игроков... Они появятся здесь, как только подключатся.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '0.6rem 1rem',
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                borderRadius: 4,
              }}
            >
              {p.user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}