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

/**
 * Modulos a los que llega la sesion, tal como los resolvio el servidor.
 * Solo deciden que se dibuja: cada endpoint y cada funcion de la base los
 * vuelven a verificar por su cuenta.
 */
export const MODULOS = {
  IMPORTAR: "big_data.importar",
  ESTRUCTURA: "big_data.estructura",
  ARCHIVOS: "big_data.datasets",
  COMPARAR: "big_data.comparar",
  DOCUMENTOS: "big_data.documentos"
}

export const getModulos = () => {
  const modulos = getPerfil().modulos
  return Array.isArray(modulos) ? modulos : []
}

export const tieneModulo = (clave) => getModulos().includes(clave)

/**
 * Estructura del ERP: sus modulos y las pantallas de cada uno, con lo que
 * puede ver esta sesion.
 *
 * Se guarda en localStorage para que la barra lateral pinte de inmediato
 * al cambiar de pantalla, y se refresca contra el servidor en cada carga.
 * Lo guardado es solo para dibujar; el permiso lo decide el servidor.
 */
export const getErp = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem("erp"))
    return Array.isArray(guardado) ? guardado : []
  } catch (error) {
    return []
  }
}

export const cargarErp = async () => {
  try {
    const { data } = await api.get("/erp")
    localStorage.setItem("erp", JSON.stringify(data))
    return data
  } catch (error) {
    return getErp()
  }
}

/** El modulo del ERP al que pertenece una ruta, o null si es transversal. */
export const cursoDeRuta = (ruta) =>
  getErp().find((curso) => curso.modulos.some((modulo) => modulo.ruta === ruta)) || null

export const esAdmin = () => getRol() === "admin"

export const esTrabajador = () => getRol() === "trabajador"

export const getEmpresa = () => getPerfil().empresa || "Mi empresa"

/** Identificador corto de la cuenta: el "jperez" de jperez@rimberio.com. */
export const getUsuario = () => getPerfil().usuario || ""

/**
 * Dominio de correo de la empresa. Lo sirve el backend para que exista un
 * solo lugar donde cambiarlo, y se cachea porque no varia en toda la sesion.
 */
let dominioCache = null

export const getDominio = async () => {
  if (dominioCache !== null) return dominioCache

  try {
    const { data } = await api.get("/auth/dominio")
    dominioCache = data.dominio || ""
  } catch (error) {
    dominioCache = ""
  }

  return dominioCache
}

/** Normaliza un texto libre a usuario valido, igual que lo hace el backend. */
export const aUsuario = (valor) =>
  String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9_.]+/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 40)

/**
 * Todo el mundo entra por el lanzador del ERP. Desde ahi se elige el
 * modulo, aunque se tenga acceso a uno solo: ver que el sistema tiene
 * cuatro partes ubica mejor que aterrizar suelto en una pantalla.
 */
export const inicioSegunRol = () => "/inicio"

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
  localStorage.removeItem("erp")
}

/** Formatea importes en soles para toda la interfaz. */
export const soles = (valor) =>
  `S/ ${Number(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

export const miles = (valor) => Number(valor || 0).toLocaleString("es-PE")

export default api
