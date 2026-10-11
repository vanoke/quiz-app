import { useEffect, useState } from 'react';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Quiz App</h1>
      <p>Проверка связи с сервером:</p>
      {health ? (
        <pre style={{ background: '#f0f0f0', padding: '1rem' }}>
          {JSON.stringify(health, null, 2)}
        </pre>
      ) : (
        <p>Загрузка...</p>
      )}
    </div>
  );
}

export default App;