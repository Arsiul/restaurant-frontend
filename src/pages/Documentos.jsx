import { useState, useEffect, useRef } from "react"
import api, { getMessage, getUserName, getInitials, miles } from "../api"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"

const MAXIMO_MB = 25

const ICONO_TIPO = {
  pdf: "PDF",
  doc: "DOC",
  docx: "DOC",
  xls: "XLS",
  xlsx: "XLS",
  ppt: "PPT",
  pptx: "PPT"
}

/** El unico formato que el navegador sabe dibujar sin ayuda de nadie. */
const esPdf = (nombre) => /\.pdf$/i.test(String(nombre || ""))

const peso = (bytes) => {
  const kb = Number(bytes || 0) / 1024
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${Math.round(kb)} KB`
}

/**
 * Documentacion de respaldo del curso: manuales, informes y anexos.
 *
 * Se apoya en infraestructura que ya existia en la plataforma, el bucket
 * privado `documentos-cursos` y la tabla `documentos_curso`. Como el bucket
 * es privado, ver un archivo no es abrir su URL: hay que pedirle al backend
 * un enlace firmado que caduca a los cinco minutos.
 *
 * Un documento puede quedar general del curso o clasificarse en uno de sus
 * modulos. Esa columna ya estaba prevista y sin usar.
 */
const Documentos = () => {
  const input = useRef(null)

  const [curso, setCurso] = useState(null)
  const [modulos, setModulos] = useState([])
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")

  const [formulario, setFormulario] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [editando, setEditando] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [abriendo, setAbriendo] = useState(null)

  // Vista previa del archivo elegido, antes de subirlo, y la del que ya
  // esta guardado. Son dos porque una apunta a un archivo del disco y la
  // otra a un enlace firmado que caduca.
  const [previa, setPrevia] = useState("")
  const [viendo, setViendo] = useState(null)

  const cargar = () => {
    setCargando(true)

    api
      .get("/documentos")
      .then(({ data }) => {
        setCurso(data.curso)
        setModulos(data.modulos)
        setDocumentos(data.documentos)
      })
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  /**
   * El PDF se previsualiza con el archivo del disco, sin subir nada: el
   * navegador trae su propio visor y solo hace falta darle una direccion
   * temporal al fichero.
   *
   * Esa direccion hay que revocarla a mano. Si no, cada archivo que se
   * abra deja su copia retenida en memoria hasta recargar la pagina.
   */
  useEffect(() => {
    if (!formulario || !esPdf(formulario.archivo.name)) {
      setPrevia("")
      return undefined
    }

    const url = URL.createObjectURL(formulario.archivo)
    setPrevia(url)

    return () => URL.revokeObjectURL(url)
  }, [formulario?.archivo])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(""), 6000)
  }

  const tomar = (lista) => {
    const elegido = lista && lista[0]
    if (!elegido) return

    if (elegido.size > MAXIMO_MB * 1024 * 1024) {
      setError(`El documento supera los ${MAXIMO_MB} MB permitidos`)
      return
    }

    setError("")
    setFormulario({ archivo: elegido, moduloId: "general", descripcion: "", error: "" })
  }

  const subir = async () => {
    setGuardando(true)

    const cuerpo = new FormData()
    cuerpo.append("file", formulario.archivo)
    cuerpo.append("moduloId", formulario.moduloId)
    cuerpo.append("descripcion", formulario.descripcion)

    try {
      const { data } = await api.post("/documentos", cuerpo)

      setFormulario(null)
      if (input.current) input.current.value = ""
      mostrarAviso(`Se subio "${data.nombre_original}"`)
      cargar()
    } catch (problema) {
      setFormulario({ ...formulario, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  /**
   * El bucket es privado, asi que ver un documento empieza por pedir un
   * enlace firmado. Si es PDF se muestra dentro de la aplicacion; el resto
   * se delega al navegador, que sabra descargarlo o abrirlo con su programa.
   */
  const abrir = async (documento) => {
    setAbriendo(documento.id)
    setError("")

    try {
      const { data } = await api.get(`/documentos/${documento.id}/enlace`)

      if (esPdf(documento.nombre_original)) {
        setViendo({ documento, url: data.url })
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer")
      }
    } catch (problema) {
      setError(getMessage(problema))
    } finally {
      setAbriendo(null)
    }
  }

  const guardarEdicion = async () => {
    setGuardando(true)

    try {
      await api.patch(`/documentos/${editando.id}`, {
        descripcion: editando.descripcion,
        moduloId: editando.moduloId
      })

      setEditando(null)
      mostrarAviso("Documento actualizado")
      cargar()
    } catch (problema) {
      setEditando({ ...editando, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    setGuardando(true)

    try {
      await api.delete(`/documentos/${borrando.id}`)
      mostrarAviso(`Se elimino "${borrando.nombre_original}"`)
      setBorrando(null)
      cargar()
    } catch (problema) {
      setError(getMessage(problema))
      setBorrando(null)
    } finally {
      setGuardando(false)
    }
  }

  const nombreModulo = (id) => {
    const modulo = modulos.find((m) => m.id === id)
    return modulo ? modulo.nombre : "General"
  }

  const visibles = documentos
    .filter((doc) => {
      if (filtro === "todos") return true
      if (filtro === "general") return !doc.modulo_id
      return doc.modulo_id === Number(filtro)
    })
    .filter((doc) => {
      const texto = busqueda.trim().toLowerCase()
      if (!texto) return true

      return (
        doc.nombre_original.toLowerCase().includes(texto) ||
        (doc.descripcion || "").toLowerCase().includes(texto)
      )
    })

  const ocupado = documentos.reduce((total, doc) => total + Number(doc.tamano_bytes || 0), 0)

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Documentos</h1>
          <p>
            Documentacion de respaldo{curso ? ` de ${curso.nombre}` : ""}: manuales, informes y
            anexos
          </p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      {aviso && <div className="alert alert-success">{aviso}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="metrics metrics-3">
        <div className="metric">
          <span>Documentos</span>
          <strong>{miles(documentos.length)}</strong>
        </div>
        <div className="metric">
          <span>Espacio ocupado</span>
          <strong>{peso(ocupado)}</strong>
        </div>
        <div className="metric">
          <span>Sin clasificar</span>
          <strong>{documentos.filter((d) => !d.modulo_id).length}</strong>
        </div>
      </div>

      <div
        className={`dropzone dropzone-doc ${arrastrando ? "activa" : ""}`}
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          hidden
          onChange={(e) => tomar(e.target.files)}
        />

        <strong>Arrastra un documento o haz clic</strong>
        <span>PDF, Word, Excel o PowerPoint &middot; hasta {MAXIMO_MB} MB</span>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripcion"
          />

          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos los modulos</option>
            <option value="general">Sin clasificar</option>
            {modulos.map((modulo) => (
              <option key={modulo.id} value={modulo.id}>
                {modulo.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {cargando && <div className="loading">Cargando documentos</div>}

        {!cargando && visibles.length === 0 && (
          <div className="empty">
            {documentos.length === 0
              ? "Todavia no hay documentos cargados"
              : "Ningun documento coincide con la busqueda"}
          </div>
        )}

        {!cargando && visibles.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Clasificado en</th>
                  <th style={{ textAlign: "right" }}>Tamano</th>
                  <th>Subido por</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="doc-nombre">
                        <span className={`doc-tipo doc-${doc.extension}`}>
                          {ICONO_TIPO[doc.extension] || doc.extension.toUpperCase()}
                        </span>
                        <span>
                          <span className="cell-main">{doc.nombre_original}</span>
                          {doc.descripcion && <span className="muted">{doc.descripcion}</span>}
                        </span>
                      </div>
                    </td>
                    <td>
                      {doc.modulo_id ? (
                        <span className="chip chip-tipo">{nombreModulo(doc.modulo_id)}</span>
                      ) : (
                        <span className="chip chip-vacio">Sin clasificar</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }} className="muted">
                      {peso(doc.tamano_bytes)}
                    </td>
                    <td className="muted ellipsis">{doc.autor}</td>
                    <td className="muted">
                      {new Date(doc.created_at).toLocaleDateString("es-PE")}
                    </td>
                    <td>
                      <div className="acciones-fila">
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => abrir(doc)}
                          disabled={abriendo === doc.id}
                        >
                          {abriendo === doc.id ? "Abriendo..." : "Ver"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() =>
                            setEditando({
                              id: doc.id,
                              nombre: doc.nombre_original,
                              descripcion: doc.descripcion || "",
                              moduloId: doc.modulo_id ? String(doc.modulo_id) : "general",
                              error: ""
                            })
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setBorrando(doc)}
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

      {formulario && (
        <Modal
          ancho={Boolean(previa)}
          title="Subir documento"
          onClose={() => setFormulario(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={subir} disabled={guardando}>
                {guardando ? "Subiendo..." : "Subir documento"}
              </button>
            </>
          )}
        >
          <div className={previa ? "subida-con-previa" : ""}>
            {/* La previsualizacion a la izquierda y el formulario a la
                derecha: asi se decide como clasificar el documento
                mirandolo, que es justamente para lo que sirve verlo antes. */}
            {previa && (
              <div className="previa">
                <div className="previa-marco">
                  <iframe src={previa} title={formulario.archivo.name} />
                </div>
                <span className="muted">
                  Vista previa del archivo en tu equipo. Todavia no se subio nada.
                </span>
              </div>
            )}

            <div className="subida-datos">
          <div className="doc-resumen">
            <span className={`doc-tipo doc-${(formulario.archivo.name.split(".").pop() || "").toLowerCase()}`}>
              {(formulario.archivo.name.split(".").pop() || "").toUpperCase()}
            </span>
            <div>
              <strong>{formulario.archivo.name}</strong>
              <span className="muted">{peso(formulario.archivo.size)}</span>
            </div>
          </div>

          {!previa && !esPdf(formulario.archivo.name) && (
            <p className="muted" style={{ marginBottom: "16px" }}>
              Este formato no se puede previsualizar en el navegador. Se subira tal cual.
            </p>
          )}

          <div className="field">
            <label>Clasificar en</label>
            <select
              value={formulario.moduloId}
              onChange={(e) => setFormulario({ ...formulario, moduloId: e.target.value })}
            >
              <option value="general">General del curso</option>
              {modulos.map((modulo) => (
                <option key={modulo.id} value={modulo.id}>
                  {modulo.nombre}
                </option>
              ))}
            </select>
            <span className="muted">
              Dejalo en general si el documento no pertenece a un modulo concreto.
            </span>
          </div>

          <div className="field">
            <label>De que trata (opcional)</label>
            <textarea
              rows="2"
              value={formulario.descripcion}
              onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
              placeholder="Ej. Informe de ventas del primer trimestre"
            />
          </div>

          {formulario.error && <div className="alert alert-error">{formulario.error}</div>}
            </div>
          </div>
        </Modal>
      )}

      {viendo && (
        <Modal
          ancho
          title={viendo.documento.nombre_original}
          onClose={() => setViendo(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={() => window.open(viendo.url, "_blank", "noopener,noreferrer")}
              >
                Abrir en otra pestana
              </button>
            </>
          )}
        >
          {viendo.documento.descripcion && (
            <p className="muted" style={{ marginBottom: "14px" }}>
              {viendo.documento.descripcion}
            </p>
          )}

          <div className="previa-marco previa-grande">
            <iframe src={viendo.url} title={viendo.documento.nombre_original} />
          </div>

          <span className="muted">
            El enlace de este documento caduca a los cinco minutos. Si deja de verse, cierra y
            vuelve a abrirlo.
          </span>
        </Modal>
      )}

      {editando && (
        <Modal
          title={`Editar ${editando.nombre}`}
          onClose={() => setEditando(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={guardarEdicion} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
        >
          <div className="field">
            <label>Clasificar en</label>
            <select
              value={editando.moduloId}
              onChange={(e) => setEditando({ ...editando, moduloId: e.target.value })}
            >
              <option value="general">General del curso</option>
              {modulos.map((modulo) => (
                <option key={modulo.id} value={modulo.id}>
                  {modulo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>De que trata</label>
            <textarea
              rows="2"
              value={editando.descripcion}
              onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
              placeholder="Ej. Informe de ventas del primer trimestre"
              autoFocus
            />
          </div>

          {editando.error && <div className="alert alert-error">{editando.error}</div>}
        </Modal>
      )}

      {borrando && (
        <Confirm
          title="Eliminar documento"
          message={`Se eliminara "${borrando.nombre_original}".`}
          detail="El archivo se borra del almacenamiento y no se puede recuperar."
          confirmLabel="Eliminar"
          danger
          loading={guardando}
          onCancel={() => setBorrando(null)}
          onConfirm={eliminar}
        />
      )}
    </>
  )
}

export default Documentos
