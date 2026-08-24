import { useState, useEffect } from "react"
import api, { getMessage, getUserName, getInitials } from "../api"
import Table from "../components/Table"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"

const empty = { name: "", description: "", categoryId: "", isActive: true }

const Dishes = () => {
  const [dishes, setDishes] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [form, setForm] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const [importing, setImporting] = useState(false)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [removing, setRemoving] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const { data } = await api.get("/dishes", {
        params: { search, categoryId: category, status }
      })
      setDishes(data)
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api
      .get("/dishes/categories")
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [search, category, status])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setError("")
  }

  const openEdit = (dish) => {
    setEditing(dish.id)
    setForm({
      name: dish.name,
      description: dish.description || "",
      categoryId: dish.category_id || "",
      isActive: dish.is_active
    })
    setError("")
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      if (editing) {
        await api.put(`/dishes/${editing}`, form)
        setNotice("Plato actualizado")
      } else {
        await api.post("/dishes", form)
        setNotice("Plato registrado")
      }

      setForm(null)
      load()
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const activate = async (dish) => {
    setError("")

    try {
      await api.put(`/dishes/${dish.id}`, {
        name: dish.name,
        description: dish.description,
        categoryId: dish.category_id,
        isActive: true
      })
      setNotice("Plato activado")
      load()
    } catch (problem) {
      setError(getMessage(problem))
    }
  }

  const remove = async () => {
    setSaving(true)

    try {
      await api.delete(`/dishes/${removing.id}`)
      setNotice("Plato desactivado")
      setRemoving(null)
      load()
    } catch (problem) {
      setRemoving(null)
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const send = async (event) => {
    event.preventDefault()

    if (!file) {
      setError("Selecciona un archivo")
      return
    }

    setSaving(true)
    setError("")
    setResult(null)

    const body = new FormData()
    body.append("file", file)

    try {
      const { data } = await api.post("/dishes/import", body, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setResult(data)
      load()
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const closeImport = () => {
    setImporting(false)
    setFile(null)
    setResult(null)
    setError("")
  }

  const columns = [
    {
      key: "name",
      label: "Plato",
      render: (row) => (
        <div className="cell-main">
          <span className="bullet">{row.name.charAt(0)}</span>
          <span>{row.name}</span>
        </div>
      )
    },
    {
      key: "description",
      label: "Descripcion",
      render: (row) => (
        <div className="muted ellipsis">{row.description || "Sin descripcion"}</div>
      )
    },
    {
      key: "category",
      label: "Categoria",
      render: (row) => (row.dish_categories ? row.dish_categories.name : "Sin categoria")
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <span className="status">
          <span className={row.is_active ? "dot dot-green" : "dot dot-gray"} />
          {row.is_active ? "Activo" : "Inactivo"}
        </span>
      )
    },
    {
      key: "actions",
      label: "Accion",
      align: "right",
      render: (row) => (
        <div className="row-actions">
          <button
            type="button"
            className="action-edit"
            onClick={(event) => {
              event.stopPropagation()
              openEdit(row)
            }}
          >
            Editar
          </button>

          {row.is_active ? (
            <button
              type="button"
              className="action-danger"
              onClick={(event) => {
                event.stopPropagation()
                setRemoving(row)
              }}
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              className="action-success"
              onClick={(event) => {
                event.stopPropagation()
                activate(row)
              }}
            >
              Activar
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Platos</h1>
          <p>{dishes.length} platos en el catalogo</p>
        </div>

        <div className="topbar-actions">
          <button type="button" className="btn btn-light" onClick={() => setImporting(true)}>
            Importar
          </button>
          <button type="button" className="btn" onClick={openCreate}>
            Nuevo plato
          </button>
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && !form && !importing && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button
          type="button"
          className={status === "all" ? "active" : ""}
          onClick={() => setStatus("all")}
        >
          Todos
        </button>
        <button
          type="button"
          className={status === "active" ? "active" : ""}
          onClick={() => setStatus("active")}
        >
          Activos
        </button>
        <button
          type="button"
          className={status === "inactive" ? "active" : ""}
          onClick={() => setStatus("inactive")}
        >
          Inactivos
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar plato"
            />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">Todas las categorias</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando platos</div>
        ) : (
          <Table columns={columns} rows={dishes} empty="No hay platos que coincidan" />
        )}
      </div>

      {form && (
        <Modal
          title={editing ? "Editar plato" : "Nuevo plato"}
          onClose={() => setForm(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" form="dish-form" className="btn" disabled={saving}>
                {saving ? "Guardando" : "Guardar"}
              </button>
            </>
          }
        >
          <form id="dish-form" onSubmit={save}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ceviche"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="description">Descripcion</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Pescado fresco con limon y aji"
              />
            </div>

            <div className="field">
              <label htmlFor="category">Categoria</label>
              <select
                id="category"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                <option value="">Sin categoria</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Plato activo
            </label>
          </form>
        </Modal>
      )}

      {importing && (
        <Modal
          title="Importar platos"
          onClose={closeImport}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={closeImport}>
                Cerrar
              </button>
              {!result && (
                <button type="submit" form="import-form" className="btn" disabled={saving}>
                  {saving ? "Importando" : "Importar"}
                </button>
              )}
            </>
          }
        >
          <form id="import-form" onSubmit={send}>
            {error && <div className="alert alert-error">{error}</div>}

            {result ? (
              <>
                <div className="alert alert-success">
                  {result.imported} de {result.total} filas procesadas correctamente
                </div>

                {result.errors && result.errors.length > 0 && (
                  <>
                    <div className="alert alert-error">
                      {result.errors.length} filas no se pudieron procesar
                    </div>
                    <ul style={{ paddingLeft: "18px", color: "var(--muted)", lineHeight: 1.8 }}>
                      {result.errors.slice(0, 10).map((item) => (
                        <li key={item.line}>
                          Fila {item.line}: {item.reason}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="file">Archivo CSV o Excel</label>
                  <input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event) => setFile(event.target.files[0])}
                  />
                </div>

                <p className="muted" style={{ lineHeight: 1.7 }}>
                  Columnas esperadas: name, description, category. La categoria
                  puede ir por nombre o por su identificador. Las filas repetidas
                  se actualizan en lugar de duplicarse.
                </p>
              </>
            )}
          </form>
        </Modal>
      )}

      {removing && (
        <Confirm
          title="Desactivar plato"
          message={`Estas seguro de desactivar ${removing.name}?`}
          detail="El plato dejara de estar disponible para nuevos menus, pero se conserva su historial de precios."
          confirmLabel="Desactivar"
          danger
          loading={saving}
          onCancel={() => setRemoving(null)}
          onConfirm={remove}
        />
      )}
    </>
  )
}

export default Dishes
