import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getUserName, getInitials, getEmpresa, getErp, cargarErp, esAdmin } from "../api"

/**
 * Lanzador del ERP: los cuatro modulos del sistema como tarjetas.
 *
 * Los modulos a los que no se llega se muestran apagados en vez de
 * esconderse. Saber que el ERP tiene cuatro partes, aunque solo se entre a
 * una, ubica mucho mejor que ver una sola tarjeta suelta y no saber si eso
 * es todo lo que hay o todo lo que te dieron.
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
  const abrir = (curso) => {
    if (!curso.acceso) return

    const pantalla = curso.modulos.find((modulo) => modulo.acceso && modulo.disponible)

    navigate(pantalla ? pantalla.ruta : `/modulo/${curso.slug}`)
  }

  const mios = erp.filter((curso) => curso.acceso)

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

      {!cargando && mios.length === 0 && (
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
          const concedidas = pantallas.filter((modulo) => modulo.acceso)
          const vacio = curso.modulos.length === 0

          return (
            <button
              type="button"
              key={curso.id}
              className={`erp-card ${curso.acceso ? "" : "bloqueada"} ${vacio ? "vacia" : ""}`}
              onClick={() => abrir(curso)}
              disabled={!curso.acceso}
            >
              <div className="erp-card-head">
                <h3>{curso.nombre}</h3>

                {!curso.acceso ? (
                  <span className="chip chip-vacio">Sin acceso</span>
                ) : vacio ? (
                  <span className="chip chip-vacio">Sin desarrollar</span>
                ) : (
                  <span className="chip chip-propia">
                    {concedidas.length} de {pantallas.length}
                  </span>
                )}
              </div>

              <p className="erp-card-desc">{curso.descripcion}</p>

              {curso.acceso && concedidas.length > 0 && (
                <div className="erp-card-modulos">
                  {concedidas.map((modulo) => (
                    <span key={modulo.clave}>{modulo.nombre}</span>
                  ))}
                </div>
              )}

              {vacio && curso.acceso && (
                <p className="muted erp-card-nota">Todavia no tiene pantallas</p>
              )}
            </button>
          )
        })}
      </div>

      {esAdmin() && (
        <p className="muted erp-pie">
          Ves los cuatro modulos porque eres administrador. Los trabajadores solo ven aquellos a
          los que les diste acceso desde <strong>Usuarios</strong>.
        </p>
      )}
    </>
  )
}

export default Inicio
