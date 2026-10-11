import api from './auth'

export const collegeApi = {
  getOverview: () => api.get('/college/overview'),
  updateProfile: (data) => api.put('/college/profile', data),
  getStudents: (params) => api.get('/college/students', { params }),
  uploadRoster: (data) => api.post('/college/students/upload', data),
  getSampleCsvUrl: () => `${api.defaults.baseURL || 'http://localhost:5000/api'}/college/sample-csv`,
  getDrives: () => api.get('/college/drives'),
  createDrive: (data) => api.post('/college/drives', data),
  getDriveDetails: (driveId) => api.get(`/college/drives/${driveId}`),
  getAnalytics: () => api.get('/college/analytics'),
  getRecruiterExportUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return `${api.defaults.baseURL || 'http://localhost:5000/api'}/college/export-recruiter?${query}`
  },
  getStudentAssignedDrives: () => api.get('/college/student-assigned-drives'),
  submitMock: (data) => api.post('/college/submit-mock', data)
}

export default collegeApi
