import { useState, useEffect } from "react"
import api, { getMessage, getUserName, getInitials, miles } from "../api"
import Modal from "../components/Modal"

const FILAS_MODAL = 100

/**
 * Modulo 1 del administrador. Cada archivo importado por los trabajadores
 * se muestra como card, y al abrirla se ve su contenido tal cual llego,
 * con las columnas que traiga cada archivo.
 */
const Archivos = () => {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")

  const [abierta, setAbierta] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  useEffect(() => {
    api
      .get("/imports")
      .then((respuesta) => setLista(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))
  }, [])

  const abrir = (importacion) => {
    setAbierta(importacion)
    setDetalle(null)
    setCargandoDetalle(true)

    api
      .get(`/imports/${importacion.id}?limite=${FILAS_MODAL}`)
      .then((respuesta) => setDetalle(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargandoDetalle(false))
  }

  const visibles = lista
    .filter((item) =>
      filtro === "propias" ? item.es_propia : filtro === "otras" ? !item.es_propia : true
    )
    .filter((item) => {
      const texto = busqueda.trim().toLowerCase()
      if (!texto) return true
      return (
        item.empresa.toLowerCase().includes(texto) || item.archivo.toLowerCase().includes(texto)
      )
    })

  const totales = {
    archivos: lista.length,
    propias: lista.filter((i) => i.es_propia).length,
    otras: lista.filter((i) => !i.es_propia).length,
    filas: lista.reduce((total, i) => total + i.total_filas, 0)
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Archivos cargados</h1>
          <p>Todos los CSV y Excel que importaron los trabajadores</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      <div className="metrics metrics-4">
        <div className="metric">
          <span>Archivos</span>
          <strong>{totales.archivos}</strong>
        </div>
        <div className="metric">
          <span>De la empresa</span>
          <strong>{totales.propias}</strong>
        </div>
        <div className="metric">
          <span>De la competencia</span>
          <strong>{totales.otras}</strong>
        </div>
        <div className="metric">
          <span>Filas totales</span>
          <strong>{miles(totales.filas)}</strong>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por restaurante o archivo"
          />
        </div>

        <div className="tabs">
          {[
            { valor: "todos", label: "Todos" },
            { valor: "propias", label: "De la empresa" },
            { valor: "otras", label: "Competencia" }
          ].map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={filtro === opcion.valor ? "active" : ""}
              onClick={() => setFiltro(opcion.valor)}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {cargando && <div className="loading">Cargando archivos</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!cargando && visibles.length === 0 && (
        <div className="card">
          <div className="empty">
            {lista.length === 0
              ? "Todavia no hay archivos importados por los trabajadores"
              : "Ningun archivo coincide con la busqueda"}
          </div>
        </div>
      )}

      <div className="cards">
        {visibles.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`archivo-card ${item.es_propia ? "es-propia" : ""}`}
            onClick={() => abrir(item)}
          >
            <div className="archivo-head">
              <span className={`chip ${item.es_propia ? "chip-propia" : "chip-externa"}`}>
                {item.es_propia ? "Nuestra empresa" : "Competencia"}
              </span>
              <span className="chip chip-tipo">{item.formato.toUpperCase()}</span>
            </div>

            <h3>{item.empresa}</h3>
            <p className="archivo-nombre">{item.archivo}</p>

            <div className="archivo-cifras">
              <div>
                <strong>{miles(item.total_filas)}</strong>
                <span>filas</span>
              </div>
              <div>
                <strong>{item.columnas.length}</strong>
                <span>columnas</span>
              </div>
            </div>

            <div className="archivo-columnas">
              {item.columnas.slice(0, 4).map((columna) => (
                <span key={columna}>{columna}</span>
              ))}
              {item.columnas.length > 4 && <span className="mas">+{item.columnas.length - 4}</span>}
            </div>

            <div className="archivo-pie">
              <span>{item.autor}</span>
              <span>{new Date(item.created_at).toLocaleDateString("es-PE")}</span>
            </div>
          </button>
        ))}
      </div>

      {abierta && (
        <Modal
          ancho
          title={`${abierta.empresa} — ${abierta.archivo}`}
          onClose={() => setAbierta(null)}
        >
          {cargandoDetalle && <div className="loading">Cargando contenido</div>}

          {detalle && (
            <>
              <div className="metrics metrics-4">
                <div className="metric">
                  <span>Filas</span>
                  <strong>{miles(detalle.importacion.total_filas)}</strong>
                </div>
                <div className="metric">
                  <span>Columnas</span>
                  <strong>{detalle.importacion.columnas.length}</strong>
                </div>
                <div className="metric">
                  <span>Origen</span>
                  <strong>{detalle.importacion.es_propia ? "Propia" : "Competencia"}</strong>
                </div>
                <div className="metric">
                  <span>Cargado por</span>
                  <strong className="ellipsis">{detalle.importacion.autor}</strong>
                </div>
              </div>

              <p className="muted" style={{ margin: "18px 0 10px" }}>
                Mostrando las primeras {Math.min(FILAS_MODAL, detalle.filas.length)} filas del
                archivo, con sus columnas originales.
              </p>

              <div className="table-wrap tabla-modal">
                <table className="tabla-dinamica">
                  <thead>
                    <tr>
                      <th className="col-num">#</th>
                      {detalle.importacion.columnas.map((columna) => (
                        <th key={columna}>{columna}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.filas.map((fila, indice) => (
                      <tr key={indice}>
                        <td className="col-num">{indice + 1}</td>
                        {detalle.importacion.columnas.map((columna) => (
                          <td key={columna}>
                            {fila[columna] === undefined || fila[columna] === "" ? (
                              <span className="vacio">&mdash;</span>
                            ) : (
                              String(fila[columna])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

export default Archivos
