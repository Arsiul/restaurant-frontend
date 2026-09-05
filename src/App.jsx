import { Routes, Route, Navigate, useParams } from "react-router-dom"
import { isLogged, esAdmin, tieneModulo, getErp, MODULOS } from "./api"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Recuperar from "./pages/Recuperar"
import Inicio from "./pages/Inicio"
import ModuloVacio from "./pages/ModuloVacio"
import Importar from "./pages/Importar"
import DatosEmpresa from "./pages/DatosEmpresa"
import Archivos from "./pages/Archivos"
import Comparar from "./pages/Comparar"
import Usuarios from "./pages/Usuarios"

/**
 * El sistema es un ERP de cuatro modulos. Todo lo construido vive dentro
 * de Big Data; los otros tres existen en la estructura y estan vacios.
 *
 * Cada ruta declara la pantalla que hace falta para verla. El acceso sale
 * de lo que el administrador le asigno a cada persona en dos niveles: a
 * que modulo del ERP entra, y que pantallas ve dentro.
 *
 * Esta proteccion es solo de interfaz. El backend exige lo mismo en cada
 * peticion y las funciones de la base lo verifican otra vez, asi que
 * editar el localStorage no da acceso a nada.
 */
const Privada = ({ modulo, soloAdmin, children }) => {
  if (!isLogged()) return <Navigate to="/login" replace />

  // Sin modulo declarado la pantalla es para cualquiera con sesion: es el
  // caso del lanzador, que tiene que ser alcanzable incluso sin acceso a
  // nada, porque es justo donde se explica esa situacion.
  const permitido = soloAdmin ? esAdmin() : modulo ? tieneModulo(modulo) : true

  if (!permitido) return <Navigate to="/inicio" replace />

  return <Layout>{children}</Layout>
}

/** Los modulos del ERP sin pantallas propias, alcanzables por su slug. */
const ModuloDelErp = () => {
  const { slug } = useParams()

  if (!isLogged()) return <Navigate to="/login" replace />

  const curso = getErp().find((item) => item.slug === slug)

  // Si todavia no se cargo la estructura, se deja pasar: la pantalla no
  // muestra ningun dato, y el lanzador la refresca al volver.
  if (curso && !curso.acceso) return <Navigate to="/inicio" replace />

  return (
    <Layout>
      <ModuloVacio />
    </Layout>
  )
}

const Publica = ({ children }) => {
  if (isLogged()) return <Navigate to="/inicio" replace />
  return children
}

const App = () => (
  <Routes>
    <Route path="/login" element={<Publica><Login /></Publica>} />
    <Route path="/registro" element={<Publica><Register /></Publica>} />
    <Route path="/recuperar" element={<Publica><Recuperar /></Publica>} />

    {/* Lanzador del ERP */}
    <Route path="/inicio" element={<Privada><Inicio /></Privada>} />
    <Route path="/modulo/:slug" element={<ModuloDelErp />} />

    {/* Pantallas del modulo Big Data */}
    <Route path="/importar" element={<Privada modulo={MODULOS.IMPORTAR}><Importar /></Privada>} />
    <Route
      path="/datos-empresa"
      element={<Privada modulo={MODULOS.ESTRUCTURA}><DatosEmpresa /></Privada>}
    />
    <Route path="/archivos" element={<Privada modulo={MODULOS.ARCHIVOS}><Archivos /></Privada>} />
    <Route path="/comparar" element={<Privada modulo={MODULOS.COMPARAR}><Comparar /></Privada>} />

    {/* Repartir accesos no es una pantalla repartible: va atada al rol */}
    <Route path="/usuarios" element={<Privada soloAdmin><Usuarios /></Privada>} />

    <Route path="*" element={<Navigate to={isLogged() ? "/inicio" : "/login"} replace />} />
  </Routes>
)

export default App
