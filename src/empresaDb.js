import { createClient } from "@supabase/supabase-js"

/**
 * Acceso directo del navegador a la base, sin pasar por el backend.
 *
 * Todo el modulo del trabajador opera contra funciones RPC de Postgres.
 * La clave que viaja en el bundle es la publicable (anon), que esta hecha
 * para estar en el navegador: no autoriza nada por si sola. Cada funcion
 * verifica en la base que quien llama tenga rol de trabajador y valida
 * los nombres antes de construir el SQL.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let cliente = null
let tokenActual = null

/**
 * El token de sesion es el mismo access_token que emite Supabase al
 * iniciar sesion, asi que se reenvia tal cual. Se recrea el cliente solo
 * cuando el token cambia.
 */
const conexion = () => {
  if (!url || !anonKey) {
    throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY")
  }

  const token = localStorage.getItem("token")

  if (!token) throw new Error("Sesion no valida")

  if (!cliente || tokenActual !== token) {
    tokenActual = token
    cliente = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
  }

  return cliente
}

/** Traduce el error de Postgres a algo que se pueda mostrar en pantalla. */
const traducir = (error) => {
  const texto = error.message || ""

  if (texto.includes("permission denied")) return "Tu sesion no autoriza esta operacion"
  if (texto.includes("JWT") || texto.includes("expired")) {
    return "Sesion expirada. Vuelve a iniciar sesion"
  }
  if (texto.includes("Failed to fetch")) return "No se pudo conectar con la base de datos"

  return texto || "No se pudo completar la operacion"
}

const llamar = async (funcion, argumentos = {}) => {
  const { data, error } = await conexion().rpc(funcion, argumentos)

  if (error) throw new Error(traducir(error))

  return data
}

export const tablas = () => llamar("empresa_tablas")

export const leer = (tabla, limite, desde) =>
  llamar("empresa_leer", { p_tabla: tabla, p_limite: limite, p_desde: desde })

export const agregarColumna = ({ tabla, nombre, tipo, valorDefecto, motivo }) =>
  llamar("empresa_agregar_columna", {
    p_tabla: tabla,
    p_columna: aIdentificador(nombre),
    p_tipo: tipo,
    p_defecto: valorDefecto || null,
    p_motivo: motivo || null
  })

export const crearTabla = ({ nombre, columnas, motivo }) =>
  llamar("empresa_crear_tabla", {
    p_nombre: aIdentificador(nombre),
    p_columnas: columnas.map((columna) => ({
      nombre: aIdentificador(columna.nombre),
      tipo: columna.tipo
    })),
    p_motivo: motivo || null
  })

export const eliminarColumna = ({ tabla, nombre, motivo }) =>
  llamar("empresa_eliminar_columna", {
    p_tabla: tabla,
    p_columna: nombre,
    p_motivo: motivo || null
  })

export const actualizarCelda = ({ tabla, id, columna, valor }) =>
  llamar("empresa_actualizar_celda", {
    p_tabla: tabla,
    p_id: id,
    p_columna: columna,
    p_valor: valor === "" ? null : String(valor)
  })

export const materializar = (importId, estructura) =>
  llamar("empresa_materializar", { p_import_id: importId, p_estructura: estructura })

/**
 * Tareas que el administrador le asigno a este trabajador. Se leen por
 * PostgREST normal: RLS ya limita cada fila a su destinatario, asi que
 * no hace falta filtrar por usuario desde aqui.
 */
export const tareas = async () => {
  const { data, error } = await conexion()
    .from("tareas")
    .select("id,titulo,mensaje,nivel,columna_sugerida,tipo_sugerido,ejemplo,origen,tabla_destino,estado,created_at,completada_at,cierre")
    .order("estado", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) throw new Error(traducir(error))

  return data
}

/** Cierre manual, para las tareas que no piden crear ninguna columna. */
export const completarTarea = async (id) => {
  const { error } = await conexion()
    .from("tareas")
    .update({ estado: "completada", completada_at: new Date().toISOString(), cierre: "manual" })
    .eq("id", id)

  if (error) throw new Error(traducir(error))

  return true
}

/** La bitacora se lee por PostgREST normal, protegida por RLS. */
export const cambios = async () => {
  const { data, error } = await conexion()
    .from("cambios_estructura")
    .select("id,tabla,operacion,detalle,motivo,sql_aplicado,created_at")
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) throw new Error(traducir(error))

  return data
}

/**
 * Normaliza un texto a identificador de Postgres antes de enviarlo. La
 * base vuelve a validarlo: esto es para que la interfaz avise antes y no
 * para confiar en el navegador.
 */
export const aIdentificador = (valor) => {
  const base = String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, 58)

  if (!base) return ""

  return /^[0-9]/.test(base) ? `c_${base}`.slice(0, 58) : base
}

export const TIPOS = [
  { valor: "texto", label: "Texto" },
  { valor: "numero", label: "Numero decimal" },
  { valor: "entero", label: "Numero entero" },
  { valor: "booleano", label: "Si / No" },
  { valor: "fecha", label: "Fecha" },
  { valor: "moneda", label: "Importe en soles" }
]

export const COLUMNAS_SISTEMA = ["id", "import_id", "fila", "created_at"]
