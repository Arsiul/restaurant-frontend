import { useState, useEffect, useRef } from "react"
import api, { getMessage, getUserName, getInitials, getEmpresa, miles } from "../api"
import * as db from "../empresaDb"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"
import ResumenImport from "../components/ResumenImport"

/**
 * Modulo 1 del trabajador. Dos zonas de carga separadas: los archivos de
 * la empresa alimentan la tabla propia, y los de la competencia quedan
 * disponibles para que el administrador los compare.
 */

const ZonaCarga = ({ propia, empresaFija, onSubido }) => {
  const input = useRef(null)

  const [archivo, setArchivo] = useState(null)
  const [empresa, setEmpresa] = useState(propia ? empresaFija : "")
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState("")
  const [arrastrando, setArrastrando] = useState(false)

  const tomar = (lista) => {
    const elegido = lista && lista[0]
    if (!elegido) return

    if (!/\.(csv|xlsx|xls)$/i.test(elegido.name)) {
      setError("Solo se aceptan archivos CSV, XLSX o XLS")
      return
    }

    setError("")
    setArchivo(elegido)
  }

  const enviar = async () => {
    if (!archivo) return setError("Selecciona un archivo")
    if (!empresa.trim()) return setError("Indica el nombre del restaurante")

    const cuerpo = new FormData()
    cuerpo.append("file", archivo)
    cuerpo.append("empresa", empresa.trim())
    cuerpo.append("esPropia", String(propia))

    setSubiendo(true)
    setError("")

    try {
      const { data } = await api.post("/imports", cuerpo)

      // La creacion de la tabla la hace el navegador contra la base, no el
      // backend: el archivo ya quedo guardado, asi que si esto falla se
      // informa sin perder la importacion.
      let materializacion = null

      if (propia) {
        try {
          materializacion = await db.materializar(data.importacion.id, data.estructura)
        } catch (problema) {
          materializacion = { error: problema.message }
        }
      }

      setArchivo(null)
      if (!propia) setEmpresa("")
      if (input.current) input.current.value = ""

      onSubido({ ...data, materializacion })
    } catch (problema) {
      setError(getMessage(problema))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className={`card carga ${propia ? "carga-propia" : "carga-externa"}`}>
      <div className="carga-head">
        <span className={`carga-tag ${propia ? "tag-propia" : "tag-externa"}`}>
          {propia ? "Nuestra empresa" : "Otra empresa"}
        </span>
        <h3>{propia ? "Importar CSV o Excel de la empresa" : "Importar de otra empresa"}</h3>
        <p>
          {propia
            ? "Los datos propios crean y alimentan la tabla que podras ampliar con columnas nuevas."
            : "Datos de la competencia. Sirven de referencia para comparar y detectar que nos falta."}
        </p>
      </div>

      <div
        className={`dropzone ${arrastrando ? "activa" : ""} ${archivo ? "con-archivo" : ""}`}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault()
          setArrastrando(false)
          tomar(e.dataTransfer.files)
        }}
        onClick={() => input.current && input.current.click()}
      >
        <input
          ref={input}
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          onChange={(e) => tomar(e.target.files)}
        />

        {archivo ? (
          <>
            <strong>{archivo.name}</strong>
            <span>{(archivo.size / 1024).toFixed(0)} KB &middot; listo para subir</span>
          </>
        ) : (
          <>
            <strong>Arrastra el archivo o haz clic</strong>
            <span>CSV, XLSX o XLS &middot; hasta 10 MB</span>
          </>
        )}
      </div>

      <div className="field">
        <label>Restaurante al que pertenecen los datos</label>
        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder={propia ? empresaFija : "Ej. Sabor Norteno"}
          disabled={propia}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button type="button" className="btn btn-block" onClick={enviar} disabled={subiendo || !archivo}>
        {subiendo ? "Procesando archivo..." : "Importar archivo"}
      </button>
    </div>
  )
}

const Importar = () => {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [resultado, setResultado] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [aviso, setAviso] = useState("")

  const cargar = () => {
    api
      .get("/imports")
      .then((respuesta) => setLista(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  const subido = (data) => {
    setResultado(data)
    cargar()
  }

  /**
   * Eliminar un archivo se lleva sus filas y, si era propio, tambien lo que
   * se habia volcado a la tabla de la empresa: esas filas no caen solas
   * porque no hay clave foranea que las ate.
   */
  const eliminar = async () => {
    setEliminando(true)
    setError("")

    try {
      const { data } = await api.delete(`/imports/${borrando.id}`)

      setAviso(
        `Se elimino "${data.archivo}"` +
          (data.materializadas > 0
            ? `, con sus ${miles(data.materializadas)} filas de la tabla de la empresa`
            : "")
      )
      setTimeout(() => setAviso(""), 6000)

      setBorrando(null)
      cargar()
    } catch (problema) {
      setError(getMessage(problema))
      setBorrando(null)
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Importar archivos</h1>
          <p>Carga de datos de ventas en CSV o Excel, con cualquier estructura de columnas</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      <div className="grid-2 grid-carga">
        <ZonaCarga propia empresaFija={getEmpresa()} onSubido={subido} />
        <ZonaCarga propia={false} onSubido={subido} />
      </div>

      <div className="card">
        <div className="chart-title">Archivos que has cargado</div>

        {cargando && <div className="loading">Cargando</div>}
        {aviso && <div className="alert alert-success">{aviso}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!cargando && lista.length === 0 && (
          <div className="empty">Todavia no has importado ningun archivo</div>
        )}

        {lista.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Restaurante</th>
                  <th>Origen</th>
                  <th style={{ textAlign: "right" }}>Filas</th>
                  <th style={{ textAlign: "right" }}>Columnas</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="cell-main">{item.archivo}</span>
                      <span className="muted">{item.formato.toUpperCase()}</span>
                    </td>
                    <td>{item.empresa}</td>
                    <td>
                      <span className={`chip ${item.es_propia ? "chip-propia" : "chip-externa"}`}>
                        {item.es_propia ? "Nuestra" : "Competencia"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{miles(item.total_filas)}</td>
                    <td style={{ textAlign: "right" }}>{item.columnas.length}</td>
                    <td className="muted">
                      {new Date(item.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setResumen(item)}
                        >
                          Ver resumen
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setBorrando(item)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resultado && (
        <Modal ancho title="Archivo importado" onClose={() => setResultado(null)}>
          <div className="metrics metrics-3">
            <div className="metric">
              <span>Filas cargadas</span>
              <strong>{miles(resultado.resumen.filas)}</strong>
            </div>
            <div className="metric">
              <span>Columnas detectadas</span>
              <strong>{resultado.resumen.columnas}</strong>
            </div>
            <div className="metric">
              <span>Formato</span>
              <strong>{resultado.resumen.formato.toUpperCase()}</strong>
            </div>
          </div>

          <p className="muted" style={{ margin: "18px 0 10px" }}>
            Estructura reconocida en <strong>{resultado.importacion.archivo}</strong>:
          </p>

          {/* En rejilla y no en tabla: un archivo de veinte columnas cabe
              entero a lo ancho, sin obligar a desplazarse a los lados ni a
              recorrer una lista larguisima hacia abajo. */}
          <div className="estructura-grid">
            {resultado.estructura.map((campo) => (
              <div className="estructura-campo" key={campo.columna}>
                <strong>{campo.original}</strong>
                <span className="muted">{campo.columna}</span>
                <span className="chip chip-tipo">{campo.tipo}</span>
              </div>
            ))}
          </div>

          {resultado.materializacion && !resultado.materializacion.error && (
            <div className="alert alert-success" style={{ marginTop: "16px" }}>
              Los datos se volcaron en la tabla <strong>{resultado.materializacion.tabla}</strong>
              {resultado.materializacion.creada ? ", que se creo con este archivo. " : ", que ya existia. "}
              Ya puedes agregarle columnas desde Datos de la empresa.
            </div>
          )}

          <div className="modal-acciones">
            <button
              type="button"
              className="btn"
              onClick={() => {
                const importacion = resultado.importacion
                setResultado(null)
                setResumen(importacion)
              }}
            >
              Ver resumen y graficos
            </button>
          </div>

          {resultado.materializacion && resultado.materializacion.error && (
            <div className="alert alert-error" style={{ marginTop: "16px" }}>
              El archivo quedo guardado, pero no se pudo volcar a la tabla de la empresa:{" "}
              {resultado.materializacion.error}
            </div>
          )}
        </Modal>
      )}
      {resumen && <ResumenImport importacion={resumen} onClose={() => setResumen(null)} />}

      {borrando && (
        <Confirm
          title="Eliminar archivo importado"
          message={`Se eliminara "${borrando.archivo}" y sus ${miles(borrando.total_filas)} filas.`}
          detail={
            borrando.tabla_fisica
              ? `Como era un archivo de la empresa, tambien se borraran sus ${miles(
                  borrando.total_filas
                )} filas de la tabla ${borrando.tabla_fisica}. Las columnas que hayas agregado se conservan, pero los datos de este archivo desapareceran de ahi.`
              : "Los datos dejaran de estar disponibles para comparar. La operacion no se puede deshacer."
          }
          confirmLabel="Eliminar"
          danger
          loading={eliminando}
          onCancel={() => setBorrando(null)}
          onConfirm={eliminar}
        />
      )}
    </>
  )
}

export default Importar
