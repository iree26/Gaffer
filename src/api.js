const BASE = 'https://gaffer-v7hq.onrender.com';

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.detail ? (Array.isArray(data.detail) ? data.detail.map(d => d.msg).join('; ') : typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : `${res.status} ${res.statusText}`;
    throw new Error(`${path} → ${res.status}: ${msg}`);
  }
  return data;
}

export const letterFor = (index) => ['a', 'b', 'c', 'd', 'e', 'f'][index];

export const api = {
  // ── Health ──────────────────────────────────────────────
  health: () => req('/health'),

  // ── Markets ─────────────────────────────────────────────
  getMarkets:     ()           => req('/markets'),
  getMarket:      (marketId)   => req(`/markets/${marketId}`),
  getMarketComments: (marketId) => req(`/markets/${marketId}/comments`),
  postMarketComment: (marketId, userId, text) =>
    req(`/markets/${marketId}/comments`, { method: 'POST', body: JSON.stringify({ userId, text }) }),

  // ── Users ───────────────────────────────────────────────
  register:   (username, password, expertise) =>
    req('/api/users/register', { method: 'POST', body: JSON.stringify({ username, password, expertise }) }),
  login:      (username, password) =>
    req('/api/users/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  registerOld: (username, email) =>
    req('/api/users/register-old', { method: 'POST', body: JSON.stringify({ username, email }) }),
  getUser:         (userId)  => req(`/api/users/${encodeURIComponent(userId)}`),
  getUserPublic:   (userId)  => req(`/user/${encodeURIComponent(userId)}`),
  userExists:      (username) => req(`/api/users/${encodeURIComponent(username)}/exists`),

  // ── Profile ─────────────────────────────────────────────
  getProfile:          (username)   => req(`/api/profile/${encodeURIComponent(username)}`),
  getProfileOld:       (userId)     => req(`/api/profile-old/${encodeURIComponent(userId)}`),
  follow:              (username, followerId) =>
    req(`/api/profile/${encodeURIComponent(username)}/follow`, { method: 'POST', body: JSON.stringify({ follower_id: followerId }) }),
  unfollow:            (username, followerId) =>
    req(`/api/profile/${encodeURIComponent(username)}/unfollow`, { method: 'POST', body: JSON.stringify({ follower_id: followerId }) }),
  getFollowers:        (username) => req(`/api/profile/${encodeURIComponent(username)}/followers`),
  getFollowing:        (username) => req(`/api/profile/${encodeURIComponent(username)}/following`),
  getProfilePosts:     (username) => req(`/api/profile/${encodeURIComponent(username)}/posts`),
  getProfilePredictions: (username) => req(`/api/profile/${encodeURIComponent(username)}/predictions`),
  setAllegiance:       (username, country, flagEmoji) =>
    req(`/api/profile/${encodeURIComponent(username)}/allegiance`, { method: 'POST', body: JSON.stringify({ country, flag_emoji: flagEmoji }) }),
  updateProfile:       (username, displayName, bio) =>
    req(`/api/profile/${encodeURIComponent(username)}/update`, { method: 'PUT', body: JSON.stringify({ display_name: displayName, bio }) }),

  // ── Signup Quiz ────────────────────────────────────────
  submitSignupQuiz: (userId, expertise, answers) =>
    req('/signup/quiz', { method: 'POST', body: JSON.stringify({ userId, expertise, answers }) }),

  // ── Agent ───────────────────────────────────────────────
  agentPredict: (userId, marketId, optionId, reasoning = '') =>
    req('/agent/predict', { method: 'POST', body: JSON.stringify({ userId, marketId, optionId, reasoning }) }),
  agentChat: (userId, message, marketId = null) =>
    req('/agent/chat', { method: 'POST', body: JSON.stringify({ userId, message, marketId }) }),

  // ── Admin ───────────────────────────────────────────────
  resolveMarket: (marketId, resultOptionId) =>
    req(`/admin/resolve/${marketId}`, { method: 'POST', body: JSON.stringify({ resultOptionId }) }),
  resolveMarketsBulk: (results) =>
    req('/admin/resolve', { method: 'POST', body: JSON.stringify({ results }) }),

  // ── Leaderboard ────────────────────────────────────────
  getLeaderboard:    () => req('/leaderboard'),
  getPredictionsLeaderboard: () => req('/api/predictions/leaderboard'),

  // ── Feed (Social) ───────────────────────────────────────
  createPost:   (userId, content, type = 'take') =>
    req('/api/feed/post', { method: 'POST', body: JSON.stringify({ user_id: userId, content, type }) }),
  getFeed:      (page = 1, limit = 20, filter = 'all', userId = '') =>
    req(`/api/feed?page=${page}&limit=${limit}&filter=${filter}&user_id=${encodeURIComponent(userId)}`),
  likePost:     (postId, userId) =>
    req(`/api/feed/${postId}/like`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  repostPost:   (postId, userId, comment = '') =>
    req(`/api/feed/${postId}/repost`, { method: 'POST', body: JSON.stringify({ user_id: userId, comment }) }),
  commentOnPost: (postId, userId, content) =>
    req(`/api/feed/${postId}/comment`, { method: 'POST', body: JSON.stringify({ user_id: userId, content }) }),
  getPostComments: (postId) => req(`/api/feed/${postId}/comments`),

  // ── Hot Takes ───────────────────────────────────────────
  createHotTake:  (userId, take) =>
    req('/api/hottakes/post', { method: 'POST', body: JSON.stringify({ user_id: userId, take }) }),
  voteHotTake:    (takeId, userId, vote) =>
    req(`/api/hottakes/${takeId}/vote`, { method: 'POST', body: JSON.stringify({ user_id: userId, vote }) }),
  getHotTakes:    (sort = 'latest') => req(`/api/hottakes?sort=${sort}`),
  getHotTakesToday: () => req('/api/hottakes/today'),

  // ── Challenges ──────────────────────────────────────────
  createChallenge: (challengerId, opponentUsername, marketId, challengerPick, starsAtStake = 1) =>
    req('/api/challenges/create', { method: 'POST', body: JSON.stringify({
      challenger_id: challengerId, opponent_username: opponentUsername, market_id: marketId,
      challenger_pick: challengerPick, stars_at_stake: starsAtStake }) }),
  acceptChallenge: (challengeId, userId, theirPick) =>
    req(`/api/challenges/${challengeId}/accept`, { method: 'POST', body: JSON.stringify({ user_id: userId, their_pick: theirPick }) }),
  declineChallenge: (challengeId, userId) =>
    req(`/api/challenges/${challengeId}/decline`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  getChallenges:  (usernameOrId) => req(`/api/challenges/${encodeURIComponent(usernameOrId)}`),

  // ── Matches ─────────────────────────────────────────────
  getLiveMatches:        () => req('/api/matches/live'),
  getTodayMatches:       () => req('/api/matches/today'),
  getYesterdayResults:   () => req('/api/matches/yesterday/results'),
  updateMatch:           (matchId, homeTeam, awayTeam, homeGoals, awayGoals, minute, status) =>
    req('/api/matches/update', { method: 'POST', body: JSON.stringify({ match_id: matchId, home_team: homeTeam, away_team: awayTeam, home_goals: homeGoals, away_goals: awayGoals, minute, status }) }),
  getStandings:          (group) => req(`/api/standings/group/${group}`),
  cardEvent:             (matchId, player, team, cardType, minute) =>
    req('/api/matches/card', { method: 'POST', body: JSON.stringify({ match_id: matchId, player, team, card_type: cardType, minute }) }),

  // ── Commentary ──────────────────────────────────────────
  updateCommentary: (matchId, homeScore, awayScore, commentary) =>
    req('/api/commentary/update', { method: 'POST', body: JSON.stringify({ match_id: matchId, home_score: homeScore, away_score: awayScore, commentary }) }),
  getCommentary:   (matchId) => req(`/api/commentary/${matchId}`),

  // ── Gaffer AI ───────────────────────────────────────────
  gafferPredictMatch: (matchId, homeTeam, awayTeam) =>
    req('/api/gaffer/predict-match', { method: 'POST', body: JSON.stringify({ match_id: matchId, home_team: homeTeam, away_team: awayTeam }) }),
  gafferPredictions:   () => req('/api/gaffer/predictions'),
  gafferAccuracy:      () => req('/api/gaffer/accuracy'),

  // ── Streaks ─────────────────────────────────────────────
  getStreaks: (username) => req(`/api/streaks/${encodeURIComponent(username)}`),

  // ── Brackets ────────────────────────────────────────────
  submitBracket:  (userId, bracket) =>
    req('/api/bracket/submit', { method: 'POST', body: JSON.stringify({ user_id: userId, bracket }) }),
  getBracket:     (userId) => req(`/api/bracket/${encodeURIComponent(userId)}`),
  getBracketLeaderboard: () => req('/api/bracket/leaderboard'),

  // ── Groups ──────────────────────────────────────────────
  createGroup:    (creatorId, name, description = '', isPrivate = false) =>
    req('/api/groups/create', { method: 'POST', body: JSON.stringify({ creator_id: creatorId, name, description, is_private: isPrivate }) }),
  joinGroup:      (userId, inviteCode) =>
    req('/api/groups/join', { method: 'POST', body: JSON.stringify({ user_id: userId, invite_code: inviteCode }) }),
  getGroup:       (groupId) => req(`/api/groups/${groupId}`),
  getGroupLeaderboard: (groupId) => req(`/api/groups/${groupId}/leaderboard`),
  postInGroup:    (groupId, userId, content) =>
    req(`/api/groups/${groupId}/post`, { method: 'POST', body: JSON.stringify({ user_id: userId, content }) }),
  getGroupFeed:   (groupId) => req(`/api/groups/${groupId}/feed`),
  getMyGroups:    (username) => req(`/api/groups/user/${encodeURIComponent(username)}/my-groups`),

  // ── Notifications ───────────────────────────────────────
  getNotifications:      (userId) => req(`/api/notifications/${encodeURIComponent(userId)}`),
  markNotificationRead:  (notificationId, userId) =>
    req(`/api/notifications/${notificationId}/read`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  markAllNotificationsRead: (userId) =>
    req('/api/notifications/read-all', { method: 'POST', body: JSON.stringify({ user_id: userId }) }),

  // ── Terraces ────────────────────────────────────────────
  terraceGeneral: (userId, message) =>
    req('/api/terraces/general', { method: 'POST', body: JSON.stringify({ user_id: userId, message }) }),
  getGeneralTerraces: () => req('/api/terraces/general'),

  // ── Predictions (Match Predictions) ─────────────────────
  submitPrediction: (userId, matchId, homeTeam, awayTeam, predictedWinner, predictedScore, firstScorer) =>
    req('/api/predictions/submit', { method: 'POST', body: JSON.stringify({
      user_id: userId, match_id: matchId, home_team: homeTeam, away_team: awayTeam,
      predicted_winner: predictedWinner, predicted_score: predictedScore, first_scorer: firstScorer }) }),
  resolvePrediction: (matchId, actualScore, actualWinner, actualFirstScorer) =>
    req('/api/predictions/resolve', { method: 'POST', body: JSON.stringify({
      match_id: matchId, actual_score: actualScore, actual_winner: actualWinner, actual_first_scorer: actualFirstScorer }) }),

  // ── Quiz v2 ─────────────────────────────────────────────
  startQuiz:      (userId, difficulty, category, numQuestions) =>
    req('/api/quiz/start-v2', { method: 'POST', body: JSON.stringify({ user_id: userId, difficulty, category, num_questions: numQuestions }) }),
  answerQuiz:     (userId, questionId, answer) =>
    req('/api/quiz/answer-v2', { method: 'POST', body: JSON.stringify({ user_id: userId, question_id: questionId, answer }) }),
  getQuizResult:  (userId) => req(`/api/quiz/result-v2/${encodeURIComponent(userId)}`),

  // ── Quiz v1 (legacy) ────────────────────────────────────
  startQuizV1:    (userId, difficulty, category, numQuestions) =>
    req('/api/quiz/start', { method: 'POST', body: JSON.stringify({ user_id: userId, difficulty, category, num_questions: numQuestions }) }),
  answerQuizV1:   (userId, questionId, answer) =>
    req('/api/quiz/answer', { method: 'POST', body: JSON.stringify({ user_id: userId, question_id: questionId, answer }) }),
  getQuizResultV1: (userId) => req(`/api/quiz/result/${encodeURIComponent(userId)}`),

  // ── Comments (legacy) ───────────────────────────────────
  postCommentLegacy: (userId, comment, context) =>
    req('/api/comments/post', { method: 'POST', body: JSON.stringify({ user_id: userId, comment, context }) }),
  getUserComments: (userId) => req(`/api/comments/${encodeURIComponent(userId)}`),

  // ── Lineups ─────────────────────────────────────────────
  getLineups: (matchId) => req(`/api/lineups/${matchId}`),
};

export function warmServer() {
  fetch(`${BASE}/health`).catch(() => {});
}

export function knowledgeRating(pct) {
  if (pct >= 95) return { emoji: '\u{1F451}', label: 'World Cup Legend' };
  if (pct >= 80) return { emoji: '\u{1F9E0}', label: 'Tactician' };
  if (pct >= 60) return { emoji: '\u{1F4CA}', label: 'Analyst' };
  if (pct >= 40) return { emoji: '\u26BD', label: 'Football Lover' };
  return { emoji: '\u{1F331}', label: 'Casual Fan' };
}
