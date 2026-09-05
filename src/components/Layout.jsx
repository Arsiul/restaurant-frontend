import { useState, useEffect } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import {
  clearSession,
  getUserName,
  getInitials,
  getUsuario,
  getEmpresa,
  getErp,
  cargarErp,
  cursoDeRuta,
  esAdmin
} from "../api"
import Icono from "./Icono"
import Confirm from "./Confirm"

/**
 * Riel de navegacion: una columna angosta de iconos, siempre visible.
 *
 * Se eligio riel y no menu ancho porque el sistema tiene dos niveles. Con
 * un menu de texto habria que repetir en el lateral el nombre del modulo
 * del ERP y ademas el de cada pantalla, y esa jerarquia ya la lleva la
 * cabecera. El riel se queda con lo unico que hace falta a cada momento:
 * a donde puedo ir desde aqui.
 *
 * El icono y la etiqueta corta salen de la clave; el nombre largo, de la
 * base. Ninguna pantalla del sistema queda sin representacion: lo que no
 * tenga icono propio cae en el generico.
 */
const ICONOS = {
  "big_data.importar": "importar",
  "big_data.estructura": "estructura",
  "big_data.datasets": "datasets",
  "big_data.comparar": "comparar"
}

const CORTOS = {
  "big_data.importar": "Importar",
  "big_data.estructura": "Estructura",
  "big_data.datasets": "Datasets",
  "big_data.comparar": "Comparar"
}

/** El riel es angosto: una etiqueta de dos palabras no entra legible. */
const corto = (modulo) => CORTOS[modulo.clave] || modulo.nombre.split(" ")[0]

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [asking, setAsking] = useState(false)
  const [erp, setErp] = useState(getErp())

  // La estructura se refresca en segundo plano: si el administrador cambio
  // un acceso, el riel se pone al dia sin tener que cerrar sesion.
  useEffect(() => {
    cargarErp().then(setErp)
  }, [])

  const curso = cursoDeRuta(location.pathname)

  const pantallas = curso
    ? (erp.find((item) => item.id === curso.id) || curso).modulos.filter(
        (modulo) => modulo.acceso && modulo.disponible
      )
    : []

  const logout = () => {
    clearSession()
    navigate("/login")
  }

  return (
    <div className="layout">
      <aside className="riel">
        <NavLink to="/inicio" className="riel-marca" title="RIMBERIO">
          <img src="/icono.png" alt="RIMBERIO" />
        </NavLink>

        <nav className="riel-nav">
          <NavLink to="/inicio" className="riel-item" end>
            <Icono nombre="inicio" />
            <span>Inicio</span>
          </NavLink>

          {pantallas.length > 0 && <span className="riel-separador" />}

          {pantallas.map((modulo) => (
            <NavLink
              key={modulo.clave}
              to={modulo.ruta}
              className="riel-item"
              title={modulo.nombre}
            >
              <Icono nombre={ICONOS[modulo.clave] || "modulo"} />
              <span>{corto(modulo)}</span>
            </NavLink>
          ))}

          {esAdmin() && (
            <>
              <span className="riel-separador" />
              <NavLink to="/usuarios" className="riel-item" title="Usuarios">
                <Icono nombre="usuarios" />
                <span>Usuarios</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="riel-pie">
          <span className="avatar avatar-riel" title={`${getUserName()} · @${getUsuario()}`}>
            {getInitials()}
          </span>

          <button
            type="button"
            className="riel-item riel-salir"
            onClick={() => setAsking(true)}
            title="Cerrar sesion"
          >
            <Icono nombre="salir" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* La key hace que el contenido se remonte al cambiar de pantalla,
          que es lo que vuelve a disparar la animacion de entrada. */}
      <main className="main" key={location.pathname}>
        {/* El modulo del ERP en el que se esta va aqui y no en el riel:
            es contexto de lo que se ve, no un destino al que ir. */}
        {curso && (
          <div className="contexto">
            <span className="contexto-modulo">{curso.nombre}</span>
            <span className="contexto-sep">/</span>
            <span className="contexto-empresa">{getEmpresa()}</span>
          </div>
        )}

        {children}
      </main>

      {asking && (
        <Confirm
          title="Cerrar sesion"
          message="Estas seguro de que deseas cerrar la sesion?"
          detail="Tendras que ingresar tus credenciales nuevamente."
          confirmLabel="Cerrar sesion"
          danger
          onCancel={() => setAsking(false)}
          onConfirm={logout}
        />
      )}
    </div>
  )
}

export default Layout
