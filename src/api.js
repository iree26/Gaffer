// All API calls go through here. Fields are camelCase to match the live backend schema.
const BASE = 'https://gaffer-v7hq.onrender.com';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${path} → ${res.status} ${text}`);
  }
  return res.json();
}

export const letterFor = (index) => ['a', 'b', 'c', 'd', 'e', 'f'][index];

export function knowledgeRating(pct) {
  if (pct >= 95) return { emoji: '👑', label: 'World Cup Legend' };
  if (pct >= 80) return { emoji: '🧠', label: 'Tactician' };
  if (pct >= 60) return { emoji: '📊', label: 'Analyst' };
  if (pct >= 40) return { emoji: '⚽', label: 'Football Lover' };
  return { emoji: '🌱', label: 'Casual Fan' };
}

export function warmServer() {
  fetch(`${BASE}/health`).catch(() => { fetch(`${BASE}/markets`).catch(() => {}); });
}

export const api = {
  getMarkets:     ()                => req('/markets'),
  submitQuiz:     (userId, expertise, answers) =>
                    req('/signup/quiz', { method: 'POST', body: JSON.stringify({ userId, expertise, answers }) }),
  getQuizResult:  (userId)          => req(`/api/quiz/result?userId=${encodeURIComponent(userId)}`),
  predict:        (userId, marketId, optionId, reasoning = '') =>
                    req('/agent/predict', { method: 'POST', body: JSON.stringify({ userId, marketId, optionId, reasoning }) }),
  chat:           (userId, message, marketId = '') =>
                    req('/agent/chat', { method: 'POST', body: JSON.stringify({ userId, message, marketId }) }),
  getComments:    (marketId)        => req(`/markets/${marketId}/comments`),
  postComment:    (marketId, userId, text) =>
                    req(`/markets/${marketId}/comments`, { method: 'POST', body: JSON.stringify({ userId, text }) }),
  getLeaderboard: ()                => req('/leaderboard'),
  getUser:        (userId)          => req(`/user/${encodeURIComponent(userId)}`),
  // CONFIRM AGAINST /docs: body shape and what it returns
  resolve:        (results)         => req('/admin/resolve', { method: 'POST', body: JSON.stringify({ results }) }),
  getProfile:     (username)        => req(`/api/profile/${encodeURIComponent(username)}`),
};

