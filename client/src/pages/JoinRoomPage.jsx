import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Код должен состоять из 6 символов');
      return;
    }

    if (!socket || !connected) {
      setError('Подключение к серверу... Попробуйте ещё раз через секунду');
      return;
    }

    setLoading(true);

    socket.emit('room:join', { code: trimmed }, (response) => {
      setLoading(false);

      if (response?.error) {
        setError(response.error);
        return;
      }

      // Организатор зашёл — редирект в лобби
      if (response.isHost) {
        navigate(`/host/quizzes/${response.room.quizId}/lobby`);
        return;
      }

      // Обычный игрок — редирект в игровую комнату
      navigate(`/play/rooms/${response.room.id}`);
    });
  }

  return (
    <div style={{ maxWidth: 500, margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Присоединиться к квизу</h1>
      <p style={{ color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
        Введите код комнаты, который показал организатор
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="A7B3K9"
            maxLength={6}
            autoFocus
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '2rem',
              textAlign: 'center',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace',
              border: '2px solid #3498db',
              borderRadius: 8,
              boxSizing: 'border-box',
              textTransform: 'uppercase',
            }}
          />
        </div>

        {error && (
          <div
            style={{
              color: '#c00',
              marginBottom: '1rem',
              padding: '0.5rem',
              background: '#fee',
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !connected}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: loading || !connected ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading || !connected ? 'not-allowed' : 'pointer',
            fontSize: '1.1rem',
            fontWeight: 500,
          }}
        >
          {loading ? 'Подключение...' : 'Войти в комнату'}
        </button>
      </form>

      {!connected && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
          Подключение к серверу...
        </p>
      )}
    </div>
  );
}