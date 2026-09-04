import api from './auth.js'

export const reportApi = {
  getHistory: () => api.get('/report/history'),
  generate: (sessionId) => api.post('/interview/report/generate', { sessionId }),
}
