import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { clearSession, getUserName, getInitials, getRol, getEmpresa, esAdmin } from "../api"
import Confirm from "./Confirm"

const MENU = {
  trabajador: [
    { to: "/importar", label: "Importar archivos" },
    { to: "/datos-empresa", label: "Datos de la empresa" }
  ],
  admin: [
    { to: "/archivos", label: "Archivos cargados" },
    { to: "/comparar", label: "Comparar restaurantes" }
  ]
}

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const [asking, setAsking] = useState(false)

  const rol = getRol()
  const enlaces = MENU[rol] || []

  const logout = () => {
    clearSession()
    navigate("/login")
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/icono.png" alt="RIMBERIO" className="brand-logo" />
          <span>RIMBERIO</span>
        </div>

        <nav className="sidebar-nav">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to}>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar avatar-light">{getInitials()}</span>
            <div className="sidebar-ident">
              <span className="sidebar-name">{getUserName()}</span>
              <span className={`rol-chip ${esAdmin() ? "rol-admin" : "rol-trabajador"}`}>
                {esAdmin() ? "Administrador" : "Trabajador"}
              </span>
            </div>
          </div>

          <span className="sidebar-empresa">{getEmpresa()}</span>

          <button type="button" className="btn btn-logout" onClick={() => setAsking(true)}>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>

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
