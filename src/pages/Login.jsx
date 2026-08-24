import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api, { getMessage, saveSession } from "../api"

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data } = await api.post("/auth/login", { email, password })
      saveSession(data.token, data.user)
      navigate("/platos")
    } catch (problem) {
      const pending = problem.response && problem.response.data && problem.response.data.pending

      if (pending) {
        navigate("/registro", { state: { email, step: "verify" } })
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
          <p>Ingresa tus credenciales para continuar</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <label htmlFor="email">Correo electronico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
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
              required
            />
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
