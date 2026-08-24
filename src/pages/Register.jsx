import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import api, { getMessage, saveSession } from "../api"

const LENGTH = 8

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState("form")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [code, setCode] = useState(Array(LENGTH).fill(""))
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [wait, setWait] = useState(0)

  const boxes = useRef([])

  useEffect(() => {
    if (location.state && location.state.step === "verify") {
      setEmail(location.state.email || "")
      setStep("verify")
      setNotice("Tu cuenta no esta verificada. Ingresa el codigo o solicita uno nuevo.")
    }
  }, [location.state])

  useEffect(() => {
    if (wait <= 0) return undefined
    const timer = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const register = async (event) => {
    event.preventDefault()
    setError("")

    if (password !== repeat) {
      setError("Las contrasenas no coinciden")
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post("/auth/register", { email, password, fullName })

      if (data.verified) {
        saveSession(data.token, data.user)
        navigate("/platos")
        return
      }

      setStep("verify")
      setNotice("Revisa tu correo e ingresa el codigo de 8 digitos.")
      setWait(60)
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (event) => {
    event.preventDefault()
    setError("")

    const token = code.join("")

    if (token.length !== LENGTH) {
      setError(`Ingresa los ${LENGTH} digitos del codigo`)
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post("/auth/verify", { email, token })
      saveSession(data.token, data.user)
      navigate("/platos")
    } catch (problem) {
      setCode(Array(LENGTH).fill(""))
      if (boxes.current[0]) boxes.current[0].focus()
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setError("")
    setLoading(true)

    try {
      await api.post("/auth/resend", { email })
      setNotice("Codigo reenviado. Revisa tu bandeja y la carpeta de spam.")
      setWait(60)
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  const change = (index, value) => {
    const digit = value.replace(/[^0-9]/g, "")
    const next = [...code]
    next[index] = digit
    setCode(next)

    if (digit && index < LENGTH - 1) boxes.current[index + 1].focus()
  }

  const back = (index, key) => {
    if (key === "Backspace" && !code[index] && index > 0) boxes.current[index - 1].focus()
  }

  const paste = (event) => {
    event.preventDefault()
    const text = event.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, LENGTH)
    const next = Array(LENGTH).fill("")
    text.split("").forEach((digit, index) => {
      next[index] = digit
    })
    setCode(next)
    boxes.current[Math.min(text.length, LENGTH - 1)].focus()
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-brand">
          <img src="/icono.png" alt="eMenu" className="brand-logo" />
          <span>eMenu</span>
        </div>

        <div>
          <h2>Crea tu cuenta y empieza a organizar la carta</h2>
          <p>
            Carga tus platos de forma masiva, asignalos a cada menu y obten
            reportes con recomendaciones automaticas.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <strong>3</strong>
            <span>Modulos</span>
          </div>
          <div>
            <strong>CSV</strong>
            <span>Importacion</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        {step === "form" ? (
          <form className="auth-form" onSubmit={register}>
            <h1>Crear cuenta</h1>
            <p>Completa tus datos para registrarte</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Juan Perez"
                required
              />
            </div>

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
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="repeat">Repetir contrasena</label>
              <input
                id="repeat"
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                minLength={8}
                required
              />
            </div>

            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? "Creando cuenta" : "Crear cuenta"}
            </button>

            <div className="auth-footer">
              Ya tienes cuenta?
              <Link to="/login">
                <button type="button">Ingresa</button>
              </Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verify}>
            <h1>Verificar cuenta</h1>
            <p>
              Enviamos un codigo de {LENGTH} digitos a <strong>{email}</strong>
            </p>

            {error && <div className="alert alert-error">{error}</div>}
            {!error && notice && <div className="alert alert-info">{notice}</div>}

            <div className="otp">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    boxes.current[index] = element
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => change(index, event.target.value)}
                  onKeyDown={(event) => back(index, event.key)}
                  onPaste={paste}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? "Verificando" : "Verificar"}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: "10px" }}
              onClick={resend}
              disabled={loading || wait > 0}
            >
              {wait > 0 ? `Reenviar codigo (${wait}s)` : "Reenviar codigo"}
            </button>

            <div className="auth-footer">
              <button type="button" onClick={() => setStep("form")}>
                Volver al registro
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default Register
