import api from './auth.js'

export const interviewApi = {
  start: (formData) => api.post('/interviews', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendMessage: (data) => api.post(`/interviews/${data.sessionId}/messages`, data),
  evaluateAnswer: (data) => api.post(`/interviews/${data.sessionId}/evaluations/answer`, data),
  evaluateCode: (data) => api.post(`/interviews/${data.sessionId}/evaluations/code`, data),
  endInterview: (sessionId) => api.post(`/interviews/${sessionId}/end`),
  updateStage: (sessionId, stage) => api.put(`/interviews/${sessionId}/stage`, { stage }),
  getSession: (sessionId) => api.get(`/interviews/${sessionId}`),
  getUserSessions: () => api.get('/interviews'),
  generateReport: (sessionId) => api.post(`/interviews/${sessionId}/reports`),
}
