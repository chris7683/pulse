import axios from 'axios'

// Use environment variable for API URL, fallback to /api for local dev
const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
