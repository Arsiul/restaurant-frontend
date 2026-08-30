import { Routes, Route, Navigate } from "react-router-dom"
import { isLogged, esAdmin, esTrabajador, inicioSegunRol } from "./api"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Importar from "./pages/Importar"
import DatosEmpresa from "./pages/DatosEmpresa"
import Archivos from "./pages/Archivos"
import Comparar from "./pages/Comparar"

/**
 * Cada ruta declara que rol la puede ver. Si el rol no coincide se
 * redirige al inicio que corresponda, para que nadie llegue por URL a
 * un modulo que no le toca. El backend valida lo mismo por su cuenta.
 */
const Privada = ({ rol, children }) => {
  if (!isLogged()) return <Navigate to="/login" replace />

  const permitido = rol === "admin" ? esAdmin() : rol === "trabajador" ? esTrabajador() : true

  if (!permitido) return <Navigate to={inicioSegunRol()} replace />

  return <Layout>{children}</Layout>
}

const Publica = ({ children }) => {
  if (isLogged()) return <Navigate to={inicioSegunRol()} replace />
  return children
}

const App = () => (
  <Routes>
    <Route path="/login" element={<Publica><Login /></Publica>} />
    <Route path="/registro" element={<Publica><Register /></Publica>} />

    {/* Trabajador */}
    <Route path="/importar" element={<Privada rol="trabajador"><Importar /></Privada>} />
    <Route path="/datos-empresa" element={<Privada rol="trabajador"><DatosEmpresa /></Privada>} />

    {/* Administrador */}
    <Route path="/archivos" element={<Privada rol="admin"><Archivos /></Privada>} />
    <Route path="/comparar" element={<Privada rol="admin"><Comparar /></Privada>} />

    <Route path="*" element={<Navigate to={isLogged() ? inicioSegunRol() : "/login"} replace />} />
  </Routes>
)

export default App
