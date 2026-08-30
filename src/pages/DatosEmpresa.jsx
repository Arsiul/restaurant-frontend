import { useState, useEffect } from "react"
import api, { getMessage, getUserName, getInitials, getEmpresa, miles } from "../api"
import * as db from "../empresaDb"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"

const PAGINA = 25

/**
 * Modulo 2 del trabajador.
 *
 * Todas las operaciones sobre la base salen de aqui, del navegador, sin
 * pasar por el backend: son llamadas RPC contra Postgres. Lo unico que
 * sigue viniendo de la API son las sugerencias, porque son un analisis
 * sobre los archivos importados y no una operacion de base de datos.
 */
const DatosEmpresa = () => {
  const [tabla, setTabla] = useState("empresa_datos")
  const [tablas, setTablas] = useState([])
  const [datos, setDatos] = useState(null)
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")

  const [sugerencias, setSugerencias] = useState([])
  const [cambios, setCambios] = useState([])
  const [tareas, setTareas] = useState([])
  const [verTareas, setVerTareas] = useState(false)

  const [formColumna, setFormColumna] = useState(null)
  const [formTabla, setFormTabla] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = async (destino = tabla, desde = 0) => {
    setCargando(true)
    setError("")

    try {
      setDatos(await db.leer(destino, PAGINA, desde))
    } catch (problema) {
      setError(problema.message)
    } finally {
      setCargando(false)
    }
  }

  const cargarContexto = async () => {
    try {
      setTablas(await db.tablas())
      setCambios(await db.cambios())
      setTareas(await db.tareas())
    } catch (problema) {
      setError(problema.message)
    }

    api
      .get("/empresa/sugerencias")
      .then((r) => setSugerencias(r.data.sugerencias || []))
      .catch(() => {})
  }

  useEffect(() => {
    cargarDatos(tabla, 0)
    setPagina(0)
  }, [tabla])

  useEffect(() => {
    cargarContexto()
  }, [])

  const refrescar = () => {
    cargarDatos(tabla, pagina * PAGINA)
    cargarContexto()
  }

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(""), 6000)
  }

  const agregarColumna = async () => {
    setGuardando(true)

    try {
      const r = await db.agregarColumna({ ...formColumna, tabla })
      setFormColumna(null)

      // El cierre de la tarea lo hace la propia funcion en la base, asi
      // que aqui solo se avisa de lo que ya paso.
      mostrarAviso(
        `Se agrego la columna "${r.columna}" (${r.tipo}) a ${r.tabla}` +
          (r.tareasCerradas > 0
            ? `. Se cerro ${r.tareasCerradas === 1 ? "la tarea que la pedia" : `${r.tareasCerradas} tareas que la pedian`}`
            : "")
      )

      refrescar()
    } catch (problema) {
      setFormColumna({ ...formColumna, error: problema.message })
    } finally {
      setGuardando(false)
    }
  }

  const completarTarea = async (id) => {
    try {
      await db.completarTarea(id)
      setTareas(await db.tareas())
    } catch (problema) {
      setError(problema.message)
    }
  }

  const crearTabla = async () => {
    const limpias = formTabla.columnas.filter((c) => c.nombre.trim())

    if (limpias.length === 0) {
      return setFormTabla({ ...formTabla, error: "Define al menos una columna" })
    }

    setGuardando(true)

    try {
      const r = await db.crearTabla({ ...formTabla, columnas: limpias })
      setFormTabla(null)
      mostrarAviso(`Se creo la tabla "${r.tabla}" con ${r.columnas} columnas`)
      await cargarContexto()
      setTabla(r.tabla)
    } catch (problema) {
      setFormTabla({ ...formTabla, error: problema.message })
    } finally {
      setGuardando(false)
    }
  }

  const eliminarColumna = async () => {
    try {
      await db.eliminarColumna({ tabla, nombre: borrando })
      mostrarAviso(`Se elimino la columna "${borrando}"`)
      setBorrando(null)
      refrescar()
    } catch (problema) {
      setError(problema.message)
      setBorrando(null)
    }
  }

  const guardarCelda = async () => {
    try {
      await db.actualizarCelda({ tabla, id: editando.id, columna: editando.columna, valor: editando.valor })
      setEditando(null)
      cargarDatos(tabla, pagina * PAGINA)
    } catch (problema) {
      setEditando({ ...editando, error: problema.message })
    }
  }

  const cambiarPagina = (siguiente) => {
    setPagina(siguiente)
    cargarDatos(tabla, siguiente * PAGINA)
  }

  const columnasVisibles =
    datos && datos.existe ? datos.columnas.filter((c) => c.columna !== "created_at") : []

  // Una columna que el trabajador ya creo deja de ser una sugerencia.
  const existentes = columnasVisibles.map((c) => c.columna)
  const sinAtender = sugerencias.filter((s) => !existentes.includes(s.columna))

  const pendientes = tareas.filter((t) => t.estado === "pendiente")
  const completadas = tareas.filter((t) => t.estado === "completada")

  const totalPaginas = datos && datos.total ? Math.ceil(datos.total / PAGINA) : 1

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Datos de la empresa</h1>
          <p>
            Informacion de {getEmpresa()}. Agrega las columnas que hagan falta para registrar lo que
            hoy no se mide
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

      {sinAtender.length > 0 && (
        <div className="card sugerencias">
          <div className="chart-title">Lo que la competencia registra y nosotros no</div>

          <div className="sugerencia-lista">
            {sinAtender.map((s) => (
              <div className="sugerencia" key={s.columna}>
                <div>
                  <h4>{s.columna}</h4>
                  <p>
                    <span className="chip chip-tipo">{s.tipoDato}</span> {s.ejemplo}
                  </p>
                  <span className="muted">Visto en {s.origen}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() =>
                    setFormColumna({
                      nombre: s.columna,
                      tipo: s.tipoDato,
                      valorDefecto: "",
                      motivo: `Detectado en ${s.origen}: ${s.titulo}`
                    })
                  }
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <select value={tabla} onChange={(e) => setTabla(e.target.value)}>
            {tablas.map((t) => (
              <option key={t.tabla} value={t.tabla}>
                {t.tabla}
              </option>
            ))}
          </select>

          {datos && datos.existe && (
            <span className="muted">
              {miles(datos.total)} filas &middot; {datos.columnas.length} columnas
            </span>
          )}
        </div>

        <div className="row-actions">
          <button
            type="button"
            className={`btn btn-ghost btn-tareas ${pendientes.length > 0 ? "con-pendientes" : ""}`}
            onClick={() => setVerTareas(true)}
          >
            Mis tareas
            {pendientes.length > 0 && <span className="badge">{pendientes.length}</span>}
          </button>

          <button
            type="button"
            className="btn btn-light"
            onClick={() =>
              setFormTabla({ nombre: "", motivo: "", columnas: [{ nombre: "", tipo: "texto" }] })
            }
          >
            Crear tabla
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setFormColumna({ nombre: "", tipo: "texto", valorDefecto: "", motivo: "" })}
            disabled={!datos || !datos.existe}
          >
            Agregar columna
          </button>
        </div>
      </div>

      <div className="card">
        {cargando && <div className="loading">Cargando datos</div>}

        {!cargando && datos && !datos.existe && (
          <div className="empty">
            Todavia no hay datos de la empresa. Importa un archivo en la seccion &quot;CSV o Excel de
            la empresa&quot; y la tabla se crea sola.
          </div>
        )}

        {!cargando && datos && datos.existe && datos.filas.length === 0 && (
          <div className="empty">La tabla existe pero todavia no tiene filas</div>
        )}

        {!cargando && datos && datos.existe && datos.filas.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="tabla-dinamica">
                <thead>
                  <tr>
                    {columnasVisibles.map((columna) => (
                      <th key={columna.columna}>
                        <span>{columna.columna}</span>
                        {!db.COLUMNAS_SISTEMA.includes(columna.columna) && (
                          <button
                            type="button"
                            className="col-borrar"
                            title={`Eliminar la columna ${columna.columna}`}
                            onClick={() => setBorrando(columna.columna)}
                          >
                            &times;
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {datos.filas.map((fila) => (
                    <tr key={fila.id}>
                      {columnasVisibles.map((columna) => {
                        const valor = fila[columna.columna]
                        const editable = !db.COLUMNAS_SISTEMA.includes(columna.columna)

                        return (
                          <td
                            key={columna.columna}
                            className={editable ? "celda-editable" : ""}
                            onClick={() =>
                              editable &&
                              setEditando({
                                id: fila.id,
                                columna: columna.columna,
                                tipo: columna.tipo,
                                valor: valor === null || valor === undefined ? "" : String(valor)
                              })
                            }
                          >
                            {valor === null || valor === undefined || valor === "" ? (
                              <span className="vacio">&mdash;</span>
                            ) : typeof valor === "boolean" ? (
                              valor ? "Si" : "No"
                            ) : (
                              String(valor)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-foot">
              <span>
                Mostrando {pagina * PAGINA + 1} a {Math.min((pagina + 1) * PAGINA, datos.total)} de{" "}
                {miles(datos.total)}
              </span>

              <div className="pagination">
                <button type="button" onClick={() => cambiarPagina(pagina - 1)} disabled={pagina === 0}>
                  &lsaquo;
                </button>
                <button type="button" className="active">
                  {pagina + 1}
                </button>
                <button
                  type="button"
                  onClick={() => cambiarPagina(pagina + 1)}
                  disabled={pagina + 1 >= totalPaginas}
                >
                  &rsaquo;
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {cambios.length > 0 && (
        <div className="card">
          <div className="chart-title">Cambios de estructura aplicados</div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Operacion</th>
                  <th>Tabla</th>
                  <th>Detalle</th>
                  <th>Motivo</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cambios.map((cambio) => (
                  <tr key={cambio.id}>
                    <td>
                      <span className={`chip chip-${cambio.operacion}`}>
                        {cambio.operacion === "add_column"
                          ? "Columna agregada"
                          : cambio.operacion === "create_table"
                            ? "Tabla creada"
                            : "Columna eliminada"}
                      </span>
                    </td>
                    <td className="cell-main">{cambio.tabla}</td>
                    <td className="muted ellipsis">
                      {cambio.detalle.columna ||
                        (Array.isArray(cambio.detalle.columnas)
                          ? cambio.detalle.columnas.map((c) => c.columna || c.nombre).join(", ")
                          : "-")}
                    </td>
                    <td className="muted ellipsis">{cambio.motivo || "-"}</td>
                    <td className="muted">{new Date(cambio.created_at).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formColumna && (
        <Modal
          title="Agregar columna"
          onClose={() => setFormColumna(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={agregarColumna} disabled={guardando}>
                {guardando ? "Aplicando..." : "Agregar a la tabla"}
              </button>
            </>
          )}
        >
          <p className="muted" style={{ marginBottom: "16px" }}>
            Se ejecuta un <code>ALTER TABLE</code> real sobre <strong>{tabla}</strong>, desde el
            navegador.
          </p>

          <div className="field">
            <label>Nombre de la columna</label>
            <input
              value={formColumna.nombre}
              onChange={(e) => setFormColumna({ ...formColumna, nombre: e.target.value })}
              placeholder="Ej. canal_venta"
              autoFocus
            />
            {formColumna.nombre && db.aIdentificador(formColumna.nombre) !== formColumna.nombre && (
              <span className="muted">
                Se guardara como <code>{db.aIdentificador(formColumna.nombre) || "(invalido)"}</code>
              </span>
            )}
          </div>

          <div className="field-row">
            <div className="field">
              <label>Tipo de dato</label>
              <select
                value={formColumna.tipo}
                onChange={(e) => setFormColumna({ ...formColumna, tipo: e.target.value })}
              >
                {db.TIPOS.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Valor por defecto (opcional)</label>
              <input
                value={formColumna.valorDefecto}
                onChange={(e) => setFormColumna({ ...formColumna, valorDefecto: e.target.value })}
                placeholder="Ej. Salon"
              />
            </div>
          </div>

          <div className="field">
            <label>Por que se agrega</label>
            <textarea
              rows="2"
              value={formColumna.motivo}
              onChange={(e) => setFormColumna({ ...formColumna, motivo: e.target.value })}
              placeholder="Ej. La competencia saca el 40 por ciento de sus ventas del delivery"
            />
          </div>

          {formColumna.error && <div className="alert alert-error">{formColumna.error}</div>}
        </Modal>
      )}

      {formTabla && (
        <Modal
          title="Crear tabla nueva"
          onClose={() => setFormTabla(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={crearTabla} disabled={guardando}>
                {guardando ? "Creando..." : "Crear tabla"}
              </button>
            </>
          )}
        >
          <p className="muted" style={{ marginBottom: "16px" }}>
            Para registrar algo que hoy no existe en la base. El nombre lleva el prefijo{" "}
            <code>emp_</code> automaticamente.
          </p>

          <div className="field">
            <label>Nombre de la tabla</label>
            <input
              value={formTabla.nombre}
              onChange={(e) => setFormTabla({ ...formTabla, nombre: e.target.value })}
              placeholder="Ej. programa_fidelidad"
              autoFocus
            />
          </div>

          <label className="etiqueta-bloque">Columnas</label>

          {formTabla.columnas.map((columna, indice) => (
            <div className="field-row" key={indice}>
              <div className="field">
                <input
                  value={columna.nombre}
                  onChange={(e) => {
                    const copia = [...formTabla.columnas]
                    copia[indice] = { ...copia[indice], nombre: e.target.value }
                    setFormTabla({ ...formTabla, columnas: copia })
                  }}
                  placeholder="nombre_columna"
                />
              </div>

              <div className="field">
                <select
                  value={columna.tipo}
                  onChange={(e) => {
                    const copia = [...formTabla.columnas]
                    copia[indice] = { ...copia[indice], tipo: e.target.value }
                    setFormTabla({ ...formTabla, columnas: copia })
                  }}
                >
                  {db.TIPOS.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setFormTabla({
                    ...formTabla,
                    columnas: formTabla.columnas.filter((c, i) => i !== indice)
                  })
                }
                disabled={formTabla.columnas.length === 1}
              >
                Quitar
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-light btn-sm"
            onClick={() =>
              setFormTabla({
                ...formTabla,
                columnas: [...formTabla.columnas, { nombre: "", tipo: "texto" }]
              })
            }
          >
            Anadir otra columna
          </button>

          <div className="field" style={{ marginTop: "16px" }}>
            <label>Por que se crea</label>
            <textarea
              rows="2"
              value={formTabla.motivo}
              onChange={(e) => setFormTabla({ ...formTabla, motivo: e.target.value })}
              placeholder="Ej. La Buena Mesa tiene club de socios y nosotros no"
            />
          </div>

          {formTabla.error && <div className="alert alert-error">{formTabla.error}</div>}
        </Modal>
      )}

      {editando && (
        <Modal
          title={`Editar ${editando.columna}`}
          onClose={() => setEditando(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={guardarCelda}>
                Guardar
              </button>
            </>
          )}
        >
          <div className="field">
            <label>
              Valor <span className="muted">({editando.tipo})</span>
            </label>
            <input
              value={editando.valor}
              onChange={(e) => setEditando({ ...editando, valor: e.target.value })}
              autoFocus
            />
          </div>

          {editando.error && <div className="alert alert-error">{editando.error}</div>}
        </Modal>
      )}

      {verTareas && (
        <Modal ancho title="Mis tareas" onClose={() => setVerTareas(false)}>
          {tareas.length === 0 && (
            <div className="empty">El administrador todavia no te asigno ninguna tarea</div>
          )}

          {pendientes.length > 0 && (
            <>
              <div className="chart-title">Pendientes ({pendientes.length})</div>

              {pendientes.map((tarea) => (
                <div className="tarea" key={tarea.id}>
                  <div className={`insight-bar ${tarea.nivel}`} />

                  <div className="tarea-cuerpo">
                    <h4>{tarea.titulo}</h4>
                    <p>{tarea.mensaje}</p>

                    {tarea.columna_sugerida ? (
                      <div className="tarea-instruccion">
                        Crea la columna <code>{tarea.columna_sugerida}</code> de tipo{" "}
                        <strong>{tarea.tipo_sugerido}</strong> en{" "}
                        <code>{tarea.tabla_destino}</code>
                        {tarea.ejemplo && <> &mdash; {tarea.ejemplo}</>}
                        <span className="muted">
                          Usa el boton &quot;Agregar columna&quot;. La tarea se cierra sola cuando la
                          columna exista.
                        </span>
                      </div>
                    ) : (
                      <div className="tarea-instruccion tarea-lectura">
                        Esta tarea no pide crear ninguna columna. Marcala como hecha cuando hayas
                        actuado sobre lo que indica.
                      </div>
                    )}

                    <div className="tarea-pie">
                      <span className="muted">
                        {tarea.origen && `Detectado en ${tarea.origen} · `}
                        {new Date(tarea.created_at).toLocaleDateString("es-PE")}
                      </span>

                      {!tarea.columna_sugerida && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => completarTarea(tarea.id)}
                        >
                          Marcar como hecha
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {completadas.length > 0 && (
            <>
              <div className="chart-title" style={{ marginTop: "24px" }}>
                Completadas ({completadas.length})
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tarea</th>
                      <th>Columna</th>
                      <th>Cierre</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completadas.map((tarea) => (
                      <tr key={tarea.id}>
                        <td className="cell-main ellipsis">{tarea.titulo}</td>
                        <td className="muted">{tarea.columna_sugerida || "-"}</td>
                        <td>
                          <span className="chip chip-tipo">
                            {tarea.cierre === "automatico" ? "Automatico" : "Manual"}
                          </span>
                        </td>
                        <td className="muted">
                          {tarea.completada_at
                            ? new Date(tarea.completada_at).toLocaleDateString("es-PE")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal>
      )}

      {borrando && (
        <Confirm
          title="Eliminar columna"
          message={`Se eliminara la columna "${borrando}" de ${tabla}.`}
          detail="Los datos que contenga se pierden y la operacion no se puede deshacer."
          confirmLabel="Eliminar"
          danger
          onCancel={() => setBorrando(null)}
          onConfirm={eliminarColumna}
        />
      )}
    </>
  )
}

export default DatosEmpresa
