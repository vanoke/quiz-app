import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          padding: '1rem 2rem',
          background: '#fff',
        }}
      >
        <Link
          to="/"
          style={{ textDecoration: 'none', color: '#333', fontSize: '1.3rem', fontWeight: 600 }}
        >
          Quiz App
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#666' }}>
            {user.name}{' '}
            <span style={{ fontSize: '0.85rem', color: '#999' }}>
              ({user.role === 'host' ? 'Организатор' : 'Участник'})
            </span>
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.4rem 0.9rem',
              background: 'transparent',
              border: '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <h1>Добро пожаловать, {user.name}!</h1>

        {user.role === 'host' ? (
          <>
            <p style={{ color: '#666' }}>
              Вы вошли как <strong>организатор</strong>. Создавайте квизы и
              запускайте их для участников.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
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
                Мои квизы
              </Link>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: '#666' }}>
              Вы вошли как <strong>участник</strong>. Подключайтесь к квизам по
              коду комнаты.
            </p>
            <p style={{ color: '#999', marginTop: '1.5rem' }}>
              Функция подключения к комнате появится в следующих этапах.
            </p>
          </>
        )}
      </main>
    </div>
  );
}