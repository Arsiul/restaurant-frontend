import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import api, { getMessage, getUserName, getInitials } from "../api"

const COLORS = ["#3b45e8", "#17c964", "#f5a524", "#f0514a", "#6b3fd6", "#00b8d9"]

const Report = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .get("/report")
      .then((response) => setData(response.data))
      .catch((problem) => setError(getMessage(problem)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando reportes</div>

  if (error) return <div className="alert alert-error">{error}</div>

  if (!data) return null

  const { summary, byCategory, topDishes, salesByDate, priceRange, insights } = data

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Reporte</h1>
          <p>Metricas del catalogo y de las cartas publicadas</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Platos activos</span>
          <strong>{summary.dishes}</strong>
        </div>
        <div className="metric">
          <span>Menus publicados</span>
          <strong>{summary.menus}</strong>
        </div>
        <div className="metric">
          <span>Platos en carta</span>
          <strong>{summary.items}</strong>
        </div>
        <div className="metric">
          <span>Precio promedio</span>
          <strong>{summary.averagePrice}</strong>
        </div>
        <div className="metric">
          <span>Unidades vendidas</span>
          <strong>{summary.units}</strong>
        </div>
        <div className="metric">
          <span>Ingresos</span>
          <strong>{summary.revenue}</strong>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="chart-title">Platos por categoria</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCategory} dataKey="total" nameKey="name" outerRadius={95} label>
                {byCategory.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="chart-title">Platos con mas apariciones en cartas</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topDishes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebedf4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b45e8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "22px" }}>
        <div className="chart-title">Ingresos por fecha</div>
        {salesByDate.length === 0 ? (
          <div className="empty">Aun no hay ventas registradas</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesByDate}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebedf4" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b45e8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="chart-title">Rango de precios por plato</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plato</th>
                  <th>Minimo</th>
                  <th>Maximo</th>
                  <th>Cartas</th>
                </tr>
              </thead>
              <tbody>
                {priceRange.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.lowest}</td>
                    <td>{row.highest}</td>
                    <td>{row.times}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="chart-title">Recomendaciones</div>
          {insights.map((insight) => (
            <div className="insight" key={insight.title}>
              <div className={`insight-bar ${insight.level}`} />
              <div>
                <h4>{insight.title}</h4>
                <p>{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Report
