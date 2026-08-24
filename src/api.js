import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export const getMessage = (error) => {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error
  }
  return "No se pudo conectar con el servidor"
}

export const saveSession = (token, user) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user || {}))
}

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {}
  } catch (error) {
    return {}
  }
}

export const getUserName = () => {
  const user = getUser()
  const meta = user.user_metadata || {}

  if (meta.full_name) return meta.full_name
  if (user.email) return user.email.split("@")[0]

  return "Usuario"
}

export const getInitials = () => {
  const parts = getUserName().trim().split(" ").filter(Boolean)

  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].charAt(0)

  return parts[0].charAt(0) + parts[1].charAt(0)
}

export const isLogged = () => Boolean(localStorage.getItem("token"))

export const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export default api
