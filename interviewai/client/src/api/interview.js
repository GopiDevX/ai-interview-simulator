import api from './auth.js'

export const interviewApi = {
  start: (formData) => api.post('/interview/start', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  sendMessage: (data) => api.post('/interview/message', data),
  evaluateAnswer: (data) => api.post('/interview/evaluate-answer', data),
  evaluateCode: (data) => api.post('/interview/evaluate-code', data),
  endInterview: (sessionId) => api.post('/interview/end', { sessionId }),
  updateStage: (sessionId, stage) => api.post('/interview/stage', { sessionId, stage }),
  getSession: (sessionId) => api.get(`/interview/${sessionId}`),
  getUserSessions: () => api.get('/interview/user/sessions'),
  generateReport: (sessionId) => api.post('/interview/report/generate', { sessionId }),
}
