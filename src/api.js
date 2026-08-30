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
      localStorage.removeItem("perfil")
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

export const saveSession = (token, user, perfil) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user || {}))
  localStorage.setItem("perfil", JSON.stringify(perfil || {}))
}

// El perfil guardado solo decide que se dibuja. Cada endpoint vuelve a
// verificar el rol contra la base, asi que editarlo a mano no da acceso.
export const getPerfil = () => {
  try {
    return JSON.parse(localStorage.getItem("perfil")) || {}
  } catch (error) {
    return {}
  }
}

export const getRol = () => getPerfil().role || ""

export const esAdmin = () => getRol() === "admin"

export const esTrabajador = () => getRol() === "trabajador"

export const getEmpresa = () => getPerfil().empresa || "Mi empresa"

export const inicioSegunRol = () => (esAdmin() ? "/archivos" : "/importar")

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {}
  } catch (error) {
    return {}
  }
}

export const getUserName = () => {
  const perfil = getPerfil()
  if (perfil.full_name) return perfil.full_name

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
  localStorage.removeItem("perfil")
}

/** Formatea importes en soles para toda la interfaz. */
export const soles = (valor) =>
  `S/ ${Number(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

export const miles = (valor) => Number(valor || 0).toLocaleString("es-PE")

export default api
