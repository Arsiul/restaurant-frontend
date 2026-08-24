import { Routes, Route, Navigate } from "react-router-dom"
import { isLogged } from "./api"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dishes from "./pages/Dishes"
import Menu from "./pages/Menu"
import Report from "./pages/Report"

const Private = ({ children }) => {
  if (!isLogged()) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

const Public = ({ children }) => {
  if (isLogged()) return <Navigate to="/platos" replace />
  return children
}

const App = () => (
  <Routes>
    <Route path="/login" element={<Public><Login /></Public>} />
    <Route path="/registro" element={<Public><Register /></Public>} />
    <Route path="/platos" element={<Private><Dishes /></Private>} />
    <Route path="/menu" element={<Private><Menu /></Private>} />
    <Route path="/reporte" element={<Private><Report /></Private>} />
    <Route path="*" element={<Navigate to={isLogged() ? "/platos" : "/login"} replace />} />
  </Routes>
)

export default App
