import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage() {
  const { user } = useAuth();
  const isHost = user.role === 'host';

  const [tab, setTab] = useState(isHost ? 'hosted' : 'played');
  const [hosted, setHosted] = useState([]);
  const [played, setPlayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const promises = [api.playedHistory()];
      if (isHost) promises.push(api.hostedHistory());

      const results = await Promise.all(promises);
      setPlayed(results[0].history);
      if (isHost) setHosted(results[1].history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) return <div style={{ padding: '2rem' }}>Загрузка...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← На главную
        </Link>
      </div>

      <h1 style={{ marginTop: 0 }}>История</h1>

      {error && (
        <div style={{ color: '#c00', marginBottom: '1rem', padding: '0.5rem', background: '#fee', borderRadius: 4 }}>
          {error}
        </div>
      )}

      {/* Вкладки — только для организатора */}
      {isHost && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
          <TabButton active={tab === 'hosted'} onClick={() => setTab('hosted')}>
            Проведённые игры ({hosted.length})
          </TabButton>
          <TabButton active={tab === 'played'} onClick={() => setTab('played')}>
            Мои участия ({played.length})
          </TabButton>
        </div>
      )}

      {/* Участник — заголовок + список без вкладок */}
      {!isHost && (
        <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.3rem' }}>
          Мои участия ({played.length})
        </h2>
      )}

      {tab === 'hosted' && isHost && (
        <HostedList items={hosted} formatDate={formatDate} />
      )}
      {tab === 'played' && (
        <PlayedList items={played} formatDate={formatDate} />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.7rem 1.2rem',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '3px solid #3498db' : '3px solid transparent',
        color: active ? '#3498db' : '#666',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        fontSize: '1rem',
      }}
    >
      {children}
    </button>
  );
}

function HostedList({ items, formatDate }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Вы ещё не проводили игры"
        hint="Запустите опубликованный квиз из раздела «Мои квизы»"
      />
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.roomId}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '1rem 1.2rem',
            marginBottom: '0.75rem',
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.quiz.title}</h3>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                {item.quiz.category} • код {item.code} • {formatDate(item.finishedAt || item.startedAt)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
              <div style={{ color: '#666' }}>
                Игроков: <strong>{item.playersCount}</strong>
              </div>
              {item.winner && (
                <div style={{ color: '#c9a227', marginTop: '0.2rem' }}>
                  🏆 {item.winner.name} — {item.winner.score}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayedList({ items, formatDate }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Вы ещё не участвовали в квизах"
        hint="Подключитесь к игре по коду комнаты"
      />
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.roomId}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '1rem 1.2rem',
            marginBottom: '0.75rem',
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.quiz.title}</h3>
              <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                {item.quiz.category} • организатор: {item.host.name} • {formatDate(item.playedAt)}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
              <div style={{ color: '#666' }}>
                Место: <strong style={{ color: item.place === 1 ? '#c9a227' : '#333' }}>#{item.place}</strong> из {item.totalPlayers}
              </div>
              <div style={{ color: '#666', marginTop: '0.2rem' }}>
                Очков: <strong>{item.score}</strong>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, hint }) {
  return (
    <div
      style={{
        padding: '3rem',
        textAlign: 'center',
        background: '#f9f9f9',
        borderRadius: 8,
        border: '1px dashed #ccc',
      }}
    >
      <p style={{ fontSize: '1.1rem', color: '#666', marginTop: 0 }}>{title}</p>
      <p style={{ color: '#999', marginBottom: 0 }}>{hint}</p>
    </div>
  );
}