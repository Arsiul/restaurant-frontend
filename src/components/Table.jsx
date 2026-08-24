import { useState, useEffect } from "react"

const SIZE = 8

const Table = ({ columns, rows, empty }) => {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [rows.length])

  const pages = Math.max(1, Math.ceil(rows.length / SIZE))
  const start = (page - 1) * SIZE
  const visible = rows.slice(start, start + SIZE)

  if (rows.length === 0) {
    return <div className="empty">{empty}</div>
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} style={column.align ? { textAlign: column.align } : null}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className={selected === row.id ? "selected" : ""}
                onClick={() => setSelected(selected === row.id ? null : row.id)}
              >
                {columns.map((column) => (
                  <td key={column.key} style={column.align ? { textAlign: column.align } : null}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <span>
          Mostrando {start + 1} a {Math.min(start + SIZE, rows.length)} de {rows.length}
        </span>

        <div className="pagination">
          <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>
            &lsaquo;
          </button>

          {Array.from({ length: pages }, (item, index) => index + 1)
            .filter((item) => Math.abs(item - page) < 3 || item === 1 || item === pages)
            .map((item) => (
              <button
                key={item}
                type="button"
                className={item === page ? "active" : ""}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}

          <button type="button" onClick={() => setPage(page + 1)} disabled={page === pages}>
            &rsaquo;
          </button>
        </div>
      </div>
    </>
  )
}

export default Table
