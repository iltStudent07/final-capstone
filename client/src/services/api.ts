import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
});

const isAuthRoute = (url?: string) => {
  if (!url) return false

  return url.includes('/auth/login') || url.includes('/auth/register')
}

// Intercepts and attaches the JWT to headers from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config;
});

// Intercepts and reroutes to /login if there is a 401 error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = typeof error.config?.url === 'string' ? error.config.url : undefined

      if (!isAuthRoute(requestUrl)) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
);

export default api