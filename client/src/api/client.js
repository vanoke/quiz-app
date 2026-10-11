const API_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка запроса');
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  // Quizzes
  myQuizzes: () => request('/quizzes/my'),
  getQuiz: (id) => request(`/quizzes/${id}`),
  createQuiz: (body) => request('/quizzes', { method: 'POST', body }),
  updateQuiz: (id, body) => request(`/quizzes/${id}`, { method: 'PUT', body }),
  deleteQuiz: (id) => request(`/quizzes/${id}`, { method: 'DELETE' }),

  // Questions
  createQuestion: (quizId, body) =>
    request(`/quizzes/${quizId}/questions`, { method: 'POST', body }),
  updateQuestion: (questionId, body) =>
    request(`/quizzes/questions/${questionId}`, { method: 'PUT', body }),
  deleteQuestion: (questionId) =>
    request(`/quizzes/questions/${questionId}`, { method: 'DELETE' }),

  // Upload
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return request('/quizzes/upload', { method: 'POST', body: form });
  },
};