import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ccc',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1>Quiz App</h1>
        <div>
          <span style={{ marginRight: '1rem' }}>
            {user.name} ({user.role === 'host' ? 'Организатор' : 'Участник'})
          </span>
          <button onClick={handleLogout}>Выйти</button>
        </div>
      </header>

      <p>Добро пожаловать, {user.name}!</p>
      <p>Личный кабинет и список квизов появятся в следующих этапах.</p>
    </div>
  );
}