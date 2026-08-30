import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import api, { getMessage, getUserName, getInitials, soles, miles } from "../api"
import Modal from "../components/Modal"

/**
 * Paleta de series validada para daltonismo sobre fondo claro:
 * delta E 28 en vision normal y 20.8 en protanopia. El oxido es el color de
 * marca y siempre representa a nuestra empresa; el azul, a la competencia.
 */
const SERIE_PROPIA = "#c1541f"
const SERIE_OTRA = "#1a6fb0"

const EJE = "#8d7663"
const GRID = "#efe4d8"

/** Escala corta para los ejes: S/ 4.2M entra donde 4156307.90 no. */
const corto = (valor) => {
  const n = Number(valor) || 0
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`
  return String(Math.round(n))
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="tooltip">
      <strong>{label}</strong>
      {payload.map((serie) => (
        <div key={serie.name} className="tooltip-fila">
          <span className="tooltip-punto" style={{ background: serie.color }} />
          <span>{serie.name}</span>
          <b>{soles(serie.value)}</b>
        </div>
      ))}
    </div>
  )
}

const Comparar = () => {
  const [lista, setLista] = useState([])
  const [elegidos, setElegidos] = useState([])
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [analizando, setAnalizando] = useState(false)
  const [error, setError] = useState("")

  const [trabajadores, setTrabajadores] = useState([])
  const [asignando, setAsignando] = useState(null)
  const [guardando, setGuardando] = useState(false)

  // Titulo del insight -> nombre de quien lo recibio, para no asignar
  // dos veces lo mismo sin darse cuenta.
  const [asignadas, setAsignadas] = useState({})

  useEffect(() => {
    api
      .get("/imports")
      .then((respuesta) => setLista(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))

    api
      .get("/tareas/trabajadores")
      .then((respuesta) => setTrabajadores(respuesta.data))
      .catch(() => {})
  }, [])

  const asignar = async () => {
    if (!asignando.trabajador) {
      return setAsignando({ ...asignando, error: "Elige a que trabajador se le asigna" })
    }

    setGuardando(true)

    try {
      const { insight } = asignando

      await api.post("/tareas", {
        titulo: insight.titulo,
        mensaje: insight.mensaje,
        nivel: insight.nivel,
        accion: insight.accion || null,
        origen: segunda ? segunda.empresa : primera.empresa,
        asignadaA: asignando.trabajador
      })

      const nombre = trabajadores.find((t) => t.id === asignando.trabajador)?.nombre || "el trabajador"

      setAsignadas({ ...asignadas, [insight.titulo]: nombre })
      setAsignando(null)
    } catch (problema) {
      setAsignando({ ...asignando, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  const alternar = (id) => {
    setResultado(null)

    setElegidos((actuales) => {
      if (actuales.includes(id)) return actuales.filter((item) => item !== id)
      if (actuales.length === 2) return [actuales[1], id]
      return [...actuales, id]
    })
  }

  const analizar = async () => {
    setAnalizando(true)
    setError("")

    try {
      const { data } = await api.post("/comparar", { ids: elegidos })
      setResultado(data)
    } catch (problema) {
      setError(getMessage(problema))
    } finally {
      setAnalizando(false)
    }
  }

  const empresas = resultado ? resultado.empresas : []
  const [primera, segunda] = empresas
  const colorDe = (indice) => (indice === 0 ? SERIE_PROPIA : SERIE_OTRA)

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Comparar restaurantes</h1>
          <p>Elige uno o dos archivos para graficarlos y ver que explica la diferencia</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="chart-title">
          Archivos disponibles
          <span className="muted"> — seleccionados {elegidos.length} de 2</span>
        </div>

        {cargando && <div className="loading">Cargando</div>}

        {!cargando && lista.length === 0 && (
          <div className="empty">No hay archivos importados todavia</div>
        )}

        <div className="seleccion">
          {lista.map((item) => {
            const activo = elegidos.includes(item.id)
            const orden = elegidos.indexOf(item.id)

            return (
              <button
                type="button"
                key={item.id}
                className={`seleccion-item ${activo ? "activo" : ""}`}
                style={activo ? { borderColor: colorDe(orden), boxShadow: `inset 0 0 0 1px ${colorDe(orden)}` } : null}
                onClick={() => alternar(item.id)}
              >
                {activo && (
                  <span className="seleccion-orden" style={{ background: colorDe(orden) }}>
                    {orden + 1}
                  </span>
                )}

                <div>
                  <strong>{item.empresa}</strong>
                  <span className="muted">{item.archivo}</span>
                </div>

                <div className="seleccion-meta">
                  <span className={`chip ${item.es_propia ? "chip-propia" : "chip-externa"}`}>
                    {item.es_propia ? "Nuestra" : "Competencia"}
                  </span>
                  <span className="muted">{miles(item.total_filas)} filas</span>
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn"
          onClick={analizar}
          disabled={elegidos.length === 0 || analizando}
          style={{ marginTop: "18px" }}
        >
          {analizando
            ? "Analizando..."
            : elegidos.length === 2
              ? "Comparar los dos archivos"
              : "Analizar archivo"}
        </button>
      </div>

      {resultado && (
        <>
          {resultado.advertencia && <div className="alert alert-info">{resultado.advertencia}</div>}

          {/* Indicadores en tarjetas y no en un grafico: ingresos, unidades y
              ticket tienen escalas incomparables entre si. */}
          <div className="comparativa">
            {[
              { clave: "ingresos", label: "Ingresos", formato: soles },
              { clave: "unidades", label: "Unidades vendidas", formato: miles },
              { clave: "ticketPromedio", label: "Ticket promedio", formato: soles },
              { clave: "productos", label: "Productos distintos", formato: miles }
            ].map((fila) => {
              const valorA = primera[fila.clave]
              const valorB = segunda ? segunda[fila.clave] : null
              const maximo = Math.max(valorA, valorB || 0) || 1

              return (
                <div className="comparativa-fila" key={fila.clave}>
                  <span className="comparativa-label">{fila.label}</span>

                  <div className="comparativa-barras">
                    {empresas.map((empresa, indice) => {
                      const valor = empresa[fila.clave]

                      return (
                        <div className="comparativa-barra" key={empresa.id}>
                          <div className="comparativa-nombre">
                            <span className="punto" style={{ background: colorDe(indice) }} />
                            {empresa.empresa}
                          </div>

                          <div className="comparativa-pista">
                            <div
                              className="comparativa-relleno"
                              style={{
                                width: `${Math.max((valor / maximo) * 100, 2)}%`,
                                background: colorDe(indice)
                              }}
                            />
                          </div>

                          <strong>{fila.formato(valor)}</strong>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="chart-title">Ingresos por categoria</div>

              {resultado.series.categorias.length === 0 ? (
                <div className="empty">Los archivos no traen una columna de categoria</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={resultado.series.categorias} barGap={2}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: EJE }}
                      axisLine={{ stroke: GRID }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={corto}
                      tick={{ fontSize: 11, fill: EJE }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(38,23,15,0.04)" }} />
                    {empresas.length > 1 && <Legend iconType="circle" iconSize={8} />}

                    {empresas.map((empresa, indice) => (
                      <Bar
                        key={empresa.id}
                        dataKey={empresa.empresa}
                        fill={colorDe(indice)}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <div className="chart-title">Evolucion de ingresos</div>

              {resultado.series.periodos.length === 0 ? (
                <div className="empty">Los archivos no traen una columna de fecha o mes</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={resultado.series.periodos}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: EJE }}
                      axisLine={{ stroke: GRID }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={corto}
                      tick={{ fontSize: 11, fill: EJE }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<Tip />} />
                    {empresas.length > 1 && <Legend iconType="circle" iconSize={8} />}

                    {empresas.map((empresa, indice) => (
                      <Line
                        key={empresa.id}
                        type="monotone"
                        dataKey={empresa.empresa}
                        stroke={colorDe(indice)}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="chart-title">
              {segunda ? "Por que vende mas" : "Lectura del archivo"}
            </div>

            {resultado.insights.map((insight) => {
              const asignada = asignadas[insight.titulo]

              return (
                <div className="insight" key={insight.titulo}>
                  <div className={`insight-bar ${insight.nivel}`} />

                  <div>
                    <h4>{insight.titulo}</h4>
                    <p>{insight.mensaje}</p>

                    {insight.accion && (
                      <div className="insight-accion">
                        Accion sugerida: agregar la columna <code>{insight.accion.columna}</code> (
                        {insight.accion.tipoDato}) a la tabla de la empresa.
                      </div>
                    )}

                    {/* Solo se asigna lo que se puede ejecutar. Al analizar
                        un archivo suelto no hay columna que pedir, asi que
                        ahi no aparece el boton. */}
                    {insight.accion && (
                      <div className="insight-pie">
                        {asignada ? (
                          <span className="asignada-ok">Asignada a {asignada}</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setAsignando({ insight, trabajador: "", error: "" })}
                          >
                            Asignar tarea al trabajador
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid-2">
            {empresas.map((empresa, indice) => (
              <div className="card" key={empresa.id}>
                <div className="chart-title">
                  <span className="punto" style={{ background: colorDe(indice) }} /> {empresa.empresa}
                  <span className="muted"> — productos con mas ingreso</span>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th style={{ textAlign: "right" }}>Unidades</th>
                        <th style={{ textAlign: "right" }}>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empresa.topProductos.slice(0, 8).map((producto) => (
                        <tr key={producto.nombre}>
                          <td className="cell-main">{producto.nombre}</td>
                          <td style={{ textAlign: "right" }}>{miles(producto.unidades)}</td>
                          <td style={{ textAlign: "right" }}>{soles(producto.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {empresa.capacidades.length > 0 && (
                  <div className="capacidades">
                    <span className="muted">Registra ademas:</span>
                    {empresa.capacidades.map((capacidad) => (
                      <span className="chip chip-capacidad" key={capacidad.clave}>
                        {capacidad.etiqueta}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {asignando && (
        <Modal
          title="Asignar tarea al trabajador"
          onClose={() => setAsignando(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={asignar} disabled={guardando}>
                {guardando ? "Asignando..." : "Asignar tarea"}
              </button>
            </>
          )}
        >
          <div className="tarea-previa">
            <div className={`insight-bar ${asignando.insight.nivel}`} />
            <div>
              <h4>{asignando.insight.titulo}</h4>
              <p>{asignando.insight.mensaje}</p>
            </div>
          </div>

          <div className="insight-accion" style={{ marginBottom: "18px" }}>
            La tarea le va a indicar que cree la columna{" "}
            <code>{asignando.insight.accion.columna}</code> de tipo{" "}
            <strong>{asignando.insight.accion.tipoDato}</strong> en la tabla de la empresa. Se
            cerrara sola cuando esa columna exista.
          </div>

          <div className="field">
            <label>Trabajador que la recibe</label>
            <select
              value={asignando.trabajador}
              onChange={(e) => setAsignando({ ...asignando, trabajador: e.target.value })}
              autoFocus
            >
              <option value="">Elegir trabajador...</option>
              {trabajadores.map((trabajador) => (
                <option key={trabajador.id} value={trabajador.id}>
                  {trabajador.nombre} ({trabajador.email})
                </option>
              ))}
            </select>
          </div>

          {trabajadores.length === 0 && (
            <div className="alert alert-error">No hay trabajadores registrados</div>
          )}

          {asignando.error && <div className="alert alert-error">{asignando.error}</div>}
        </Modal>
      )}
    </>
  )
}

export default Comparar
