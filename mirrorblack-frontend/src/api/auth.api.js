import api from './axios'

export const authApi = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },
  register: async (credentials) => {
    const { data } = await api.post('/auth/register', credentials)
    return data
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  sendOtp: async (email) => {
    const { data } = await api.post('/auth/send-otp', { email })
    return data
  },
  verifyOtp: async (userId, otp) => {
    const { data } = await api.post('/auth/verify-otp', { userId, otp })
    return data
  },
  resendOtp: async (userId) => {
    const { data } = await api.post('/auth/resend-otp', { userId })
    return data
  }
}
