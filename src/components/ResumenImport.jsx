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
  ResponsiveContainer
} from "recharts"
import api, { getMessage, soles, miles } from "../api"
import Modal from "./Modal"

const SERIE = "#ef5a3d"
const EJE = "#8b8b98"
const GRID = "#2a2a33"

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

/**
 * Resumen de un archivo importado: sus cifras, como se reparten y que se
 * lee de ellas.
 *
 * Es el mismo analisis que hace la pantalla de comparacion cuando se elige
 * un solo archivo, pero pedido a `/api/imports/:id/resumen`, que no exige
 * el modulo de comparacion: mirar lo que uno acaba de importar es parte de
 * importar.
 */
const ResumenImport = ({ importacion, onClose }) => {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api
      .get(`/imports/${importacion.id}/resumen`)
      .then((respuesta) => setDatos(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))
  }, [importacion.id])

  const empresa = datos ? datos.empresa : null

  return (
    <Modal ancho title={`${importacion.empresa} — ${importacion.archivo}`} onClose={onClose}>
      {cargando && <div className="loading">Analizando el archivo</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {empresa && (
        <>
          <div className="metrics metrics-4">
            <div className="metric">
              <span>Ingresos</span>
              <strong>{soles(empresa.ingresos)}</strong>
            </div>
            <div className="metric">
              <span>Unidades vendidas</span>
              <strong>{miles(empresa.unidades)}</strong>
            </div>
            <div className="metric">
              <span>Ticket promedio</span>
              <strong>{soles(empresa.ticketPromedio)}</strong>
            </div>
            <div className="metric">
              <span>Productos distintos</span>
              <strong>{miles(empresa.productos)}</strong>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: "18px" }}>
            <div className="resumen-bloque">
              <div className="chart-title">Ingresos por categoria</div>

              {datos.series.categorias.length === 0 ? (
                <div className="empty">El archivo no trae una columna de categoria</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={datos.series.categorias} barGap={2}>
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
                    <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar
                      dataKey={empresa.empresa}
                      fill={SERIE}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="resumen-bloque">
              <div className="chart-title">Evolucion de ingresos</div>

              {datos.series.periodos.length === 0 ? (
                <div className="empty">El archivo no trae una columna de fecha o mes</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={datos.series.periodos}>
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
                    <Line
                      type="monotone"
                      dataKey={empresa.empresa}
                      stroke={SERIE}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2, fill: "#17171c" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: "18px" }}>
            <div className="resumen-bloque">
              <div className="chart-title">Productos con mas ingreso</div>

              {empresa.topProductos.length === 0 ? (
                <div className="empty">El archivo no trae una columna de producto</div>
              ) : (
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
              )}
            </div>

            <div className="resumen-bloque">
              <div className="chart-title">Lectura del archivo</div>

              {datos.insights.map((insight) => (
                <div className="insight" key={insight.titulo}>
                  <div className={`insight-bar ${insight.nivel}`} />
                  <div>
                    <h4>{insight.titulo}</h4>
                    <p>{insight.mensaje}</p>
                  </div>
                </div>
              ))}

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
          </div>

          <div className="resumen-bloque" style={{ marginTop: "18px" }}>
            <div className="chart-title">
              Columnas del archivo
              <span className="muted"> — {empresa.columnas.length} detectadas</span>
            </div>

            <div className="columnas-detectadas">
              {empresa.columnas.map((columna) => {
                const rol = Object.keys(empresa.roles).find(
                  (clave) => empresa.roles[clave] === columna
                )

                return (
                  <span key={columna} className={rol ? "columna-rol" : ""}>
                    {columna}
                    {rol && <b>{rol}</b>}
                  </span>
                )
              })}
            </div>

            <p className="muted" style={{ marginTop: "10px" }}>
              Las marcadas son las que el sistema reconocio para poder calcular. Las demas se
              guardaron igual, pero no entran en las cifras.
            </p>
          </div>
        </>
      )}
    </Modal>
  )
}

export default ResumenImport
