import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import api, { getMessage, getDominio } from "../api"

const LENGTH = 8

/**
 * Recuperacion de contrasena en dos pasos, con el mismo codigo de ocho
 * digitos que usa la verificacion del registro. Se eligio codigo y no
 * enlace para no depender de que la URL de retorno este declarada en el
 * proyecto de Supabase: el correo llega igual en desarrollo y en produccion.
 */
const Recuperar = () => {
  const navigate = useNavigate()

  const [step, setStep] = useState("pedir")
  const [correo, setCorreo] = useState("")
  const [dominio, setDominio] = useState("")
  const [code, setCode] = useState(Array(LENGTH).fill(""))
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [wait, setWait] = useState(0)

  const boxes = useRef([])

  useEffect(() => {
    getDominio().then(setDominio)
  }, [])

  useEffect(() => {
    if (wait <= 0) return undefined
    const timer = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  const pedir = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      await api.post("/auth/recuperar", { usuario: correo })
      setStep("cambiar")
      setNotice("Si esa cuenta existe, le enviamos un codigo de 8 digitos. Revisa tambien el spam.")
      setWait(60)
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  const cambiar = async (event) => {
    event.preventDefault()
    setError("")

    const token = code.join("")

    if (token.length !== LENGTH) {
      setError(`Ingresa los ${LENGTH} digitos del codigo`)
      return
    }

    if (password !== repeat) {
      setError("Las contrasenas no coinciden")
      return
    }

    setLoading(true)

    try {
      await api.post("/auth/clave", { usuario: correo, token, password })
      navigate("/login", { replace: true })
    } catch (problem) {
      setCode(Array(LENGTH).fill(""))
      if (boxes.current[0]) boxes.current[0].focus()
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  const reenviar = async () => {
    setError("")
    setLoading(true)

    try {
      await api.post("/auth/recuperar", { usuario: correo })
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

  const pegar = (event) => {
    const texto = (event.clipboardData.getData("text") || "").replace(/[^0-9]/g, "").slice(0, LENGTH)
    if (!texto) return

    event.preventDefault()

    const next = Array(LENGTH).fill("")
    texto.split("").forEach((digito, indice) => {
      next[indice] = digito
    })

    setCode(next)

    const foco = Math.min(texto.length, LENGTH - 1)
    if (boxes.current[foco]) boxes.current[foco].focus()
  }

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="auth-brand">
          <img src="/icono.png" alt="RIMBERIO" className="brand-logo" />
          <span>RIMBERIO</span>
        </div>

        <div>
          <h2>Recupera el acceso a tu cuenta</h2>
          <p>
            Te enviamos un codigo al correo de la empresa con el que ingresas.
            Con ese codigo defines una contrasena nueva y vuelves a entrar.
          </p>
        </div>

        <div className="auth-stats">
          <div>
            <strong>1</strong>
            <span>Pides el codigo</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Lo ingresas</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Nueva clave</span>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        {step === "pedir" ? (
          <form className="auth-form" onSubmit={pedir}>
            <h1>Recuperar contrasena</h1>
            <p>Indica el correo con el que inicias sesion</p>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="correo">Correo</label>
              <input
                id="correo"
                type="text"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                placeholder={dominio ? `usuario@${dominio}` : "correo@ejemplo.com"}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? "Enviando" : "Enviar codigo"}
            </button>

            <div className="auth-footer">
              Ya la recordaste?
              <Link to="/login">
                <button type="button">Iniciar sesion</button>
              </Link>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={cambiar}>
            <h1>Nueva contrasena</h1>
            <p>
              Codigo enviado a <strong>{correo}</strong>
            </p>

            {notice && <div className="alert alert-info">{notice}</div>}
            {error && <div className="alert alert-error">{error}</div>}

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
                  onPaste={pegar}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="field">
              <label htmlFor="clave">Contrasena nueva</label>
              <input
                id="clave"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="repetir">Repite la contrasena</label>
              <input
                id="repetir"
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                placeholder="Vuelve a escribirla"
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? "Guardando" : "Cambiar contrasena"}
            </button>

            <div className="auth-footer">
              No te llego?
              <button type="button" onClick={reenviar} disabled={wait > 0 || loading}>
                {wait > 0 ? `Reenviar en ${wait}s` : "Reenviar codigo"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

export default Recuperar
