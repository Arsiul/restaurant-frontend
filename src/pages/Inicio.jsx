import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getUserName, getInitials, getEmpresa, getErp, cargarErp, esAdmin } from "../api"

/**
 * Lanzador del ERP: los modulos a los que llega esta cuenta, como tarjetas.
 *
 * Solo se muestra lo concedido. No hay tarjetas bloqueadas ni apagadas: lo
 * que no se tiene no se ve, y el servidor tampoco lo envia, asi que aqui no
 * hay nada que filtrar.
 */
const Inicio = () => {
  const navigate = useNavigate()
  const [erp, setErp] = useState(getErp())
  const [cargando, setCargando] = useState(getErp().length === 0)

  useEffect(() => {
    cargarErp()
      .then(setErp)
      .finally(() => setCargando(false))
  }, [])

  /** Al entrar a un modulo se abre su primera pantalla disponible. */
  /** Entrar a un modulo abre su primera pantalla construida. */
  const abrir = (curso) => {
    const pantalla = curso.modulos.find((modulo) => modulo.disponible)

    navigate(pantalla ? pantalla.ruta : `/modulo/${curso.slug}`)
  }

  const sinNada = !cargando && erp.length === 0

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{getEmpresa()}</h1>
          <p>Elige el modulo del sistema con el que vas a trabajar</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      {cargando && <div className="loading">Cargando modulos</div>}

      {sinNada && (
        <div className="card">
          <div className="empty empty-grande">
            <strong>Todavia no tienes acceso a ningun modulo</strong>
            <p>
              Tu cuenta esta activa, pero un administrador tiene que asignarte a que parte del
              sistema entras.
            </p>
          </div>
        </div>
      )}

      <div className="erp-grid">
        {erp.map((curso) => {
          const pantallas = curso.modulos.filter((modulo) => modulo.disponible)
          const vacio = pantallas.length === 0

          return (
            <button
              type="button"
              key={curso.id}
              className={`erp-card ${vacio ? "vacia" : ""}`}
              onClick={() => abrir(curso)}
            >
              <div className="erp-card-head">
                <h3>{curso.nombre}</h3>

                {vacio ? (
                  <span className="chip chip-vacio">Sin desarrollar</span>
                ) : (
                  <span className="chip chip-propia">
                    {pantallas.length} {pantallas.length === 1 ? "pantalla" : "pantallas"}
                  </span>
                )}
              </div>

              <p className="erp-card-desc">{curso.descripcion}</p>

              {pantallas.length > 0 && (
                <div className="erp-card-modulos">
                  {pantallas.map((modulo) => (
                    <span key={modulo.clave}>{modulo.nombre}</span>
                  ))}
                </div>
              )}

              {vacio && <p className="muted erp-card-nota">Todavia no tiene pantallas</p>}
            </button>
          )
        })}
      </div>

      {esAdmin() && !sinNada && (
        <p className="muted erp-pie">
          Ves todos los modulos porque eres administrador. Cada trabajador ve unicamente aquellos
          a los que le diste acceso desde <strong>Usuarios</strong>.
        </p>
      )}
    </>
  )
}

export default Inicio
