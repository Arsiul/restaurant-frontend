import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { clearSession, getUserName, getInitials } from "../api"
import Confirm from "./Confirm"

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const [asking, setAsking] = useState(false)

  const name = getUserName()

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
          <NavLink to="/platos">Platos</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/reporte">Reporte</NavLink>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar avatar-light">{getInitials()}</span>
            <span className="sidebar-name">{name}</span>
          </div>

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
