import axios from 'axios'

const loginUrl = `${import.meta.env.BASE_URL}login`

const api = axios.create({
  baseURL: '/api',
});
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
      window.location.href = loginUrl
    }

    return Promise.reject(error)
  },
);

export default api