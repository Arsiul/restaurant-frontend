import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import api, { getMessage, saveSession, inicioSegunRol, getDominio } from "../api"

const Login = () => {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [dominio, setDominio] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getDominio().then(setDominio)
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      // El backend acepta el correo completo o solo el usuario: si llega
      // "jperez" le agrega el dominio de la empresa antes de autenticar.
      const { data } = await api.post("/auth/login", { usuario: correo, password })
      saveSession(data.token, data.user, data.perfil)
      navigate(inicioSegunRol())
    } catch (problem) {
      const respuesta = (problem.response && problem.response.data) || {}

      if (respuesta.pending) {
        navigate("/registro", { state: { email: respuesta.email || correo, step: "verify" } })
        return
      }

      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-brand">
          <img src="/icono.png" alt="RIMBERIO" className="brand-logo" />
          <span>RIMBERIO</span>
        </div>

        <div>
          <h2>Gestiona las cartas de tu restaurante</h2>
          <p>
            Administra el catalogo de platos, arma los menus por temporada y
            revisa el comportamiento de tus precios en un solo lugar.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <strong>456</strong>
            <span>Platos</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Menus</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Sedes</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <h1>Bienvenido</h1>
          <p>Ingresa con el correo de la empresa</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="text"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder={dominio ? `usuario@${dominio}` : "correo@ejemplo.com"}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contrasena"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-ayuda">
            <Link to="/recuperar">Olvidaste tu contrasena?</Link>
          </div>

          <button type="submit" className="btn btn-block" disabled={loading}>
            {loading ? "Ingresando" : "Ingresar"}
          </button>

          <div className="auth-footer">
            No tienes cuenta?
            <Link to="/registro">
              <button type="button">Registrate</button>
            </Link>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Login
