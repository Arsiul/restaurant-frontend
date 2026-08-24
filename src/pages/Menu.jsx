import { useState, useEffect } from "react"
import api, { getMessage, getUserName, getInitials } from "../api"
import Table from "../components/Table"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"

const emptyAssign = {
  dishId: "",
  menuId: "",
  pageId: "",
  price: "",
  highPrice: "",
  note: "",
  isFeatured: false
}

const Menu = () => {
  const [items, setItems] = useState([])
  const [menus, setMenus] = useState([])
  const [dishes, setDishes] = useState([])
  const [categories, setCategories] = useState([])
  const [sections, setSections] = useState([])
  const [filter, setFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [saving, setSaving] = useState(false)

  const [assign, setAssign] = useState(null)
  const [item, setItem] = useState(null)
  const [dish, setDish] = useState(null)
  const [removing, setRemoving] = useState(null)

  const load = async () => {
    setLoading(true)
    setError("")

    try {
      const { data } = await api.get("/menu", { params: { menuId: filter } })
      setItems(data)
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get("/menu/menus").then((response) => setMenus(response.data)).catch(() => setMenus([]))
    api
      .get("/dishes", { params: { status: "active" } })
      .then((response) => setDishes(response.data))
      .catch(() => setDishes([]))
    api
      .get("/dishes/categories")
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    load()
  }, [filter])

  const loadSections = async (menuId) => {
    if (!menuId) {
      setSections([])
      return
    }

    try {
      const { data } = await api.get(`/menu/sections/${menuId}`)
      setSections(data)
    } catch (problem) {
      setSections([])
    }
  }

  const openAssign = () => {
    setAssign(emptyAssign)
    setSections([])
    setError("")
  }

  const saveAssign = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      await api.post("/menu/assign", assign)
      setNotice("Plato asignado al menu")
      setAssign(null)
      load()
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const openItem = (row) => {
    setItem({
      id: row.id,
      name: row.dishes.name,
      price: row.price || "",
      highPrice: row.high_price || "",
      note: row.note || "",
      isFeatured: row.is_featured,
      position: row.position
    })
    setError("")
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      await api.put(`/menu/item/${item.id}`, item)
      setNotice("Datos del menu actualizados")
      setItem(null)
      load()
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const openDish = (row) => {
    setDish({
      id: row.dishes.id,
      name: row.dishes.name,
      description: row.dishes.description || "",
      categoryId: row.dishes.category_id || "",
      isActive: row.dishes.is_active
    })
    setError("")
  }

  const saveDish = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      await api.put(`/dishes/${dish.id}`, dish)
      setNotice("Plato actualizado. El cambio se refleja en el modulo de platos")
      setDish(null)
      load()
    } catch (problem) {
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)

    try {
      await api.delete(`/menu/item/${removing.id}`)
      setNotice("Plato retirado del menu")
      setRemoving(null)
      load()
    } catch (problem) {
      setRemoving(null)
      setError(getMessage(problem))
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: "dish",
      label: "Plato",
      render: (row) => (
        <div className="cell-main">
          <span className="bullet">{row.dishes.name.charAt(0)}</span>
          <div>
            <div>{row.dishes.name}</div>
            <div className="muted" style={{ fontSize: "12px" }}>
              {row.dishes.dish_categories ? row.dishes.dish_categories.name : "Sin categoria"}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "menu",
      label: "Menu",
      render: (row) => (
        <div>
          <div>{row.menu_pages.menus.name}</div>
          <div className="muted" style={{ fontSize: "12px" }}>
            {row.menu_pages.menus.menu_date}
          </div>
        </div>
      )
    },
    {
      key: "section",
      label: "Seccion",
      render: (row) => row.menu_pages.section
    },
    {
      key: "price",
      label: "Precio",
      render: (row) => {
        if (!row.price) return <span className="muted">Sin precio</span>
        if (row.high_price) return `${row.price} - ${row.high_price}`
        return row.price
      }
    },
    {
      key: "state",
      label: "Estado",
      render: (row) => (
        <span className="status">
          <span className={row.is_featured ? "dot dot-blue" : "dot dot-orange"} />
          {row.is_featured ? "Destacado" : "Regular"}
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
            className="action-price"
            onClick={(event) => {
              event.stopPropagation()
              openItem(row)
            }}
          >
            Precio
          </button>
          <button
            type="button"
            className="action-edit"
            onClick={(event) => {
              event.stopPropagation()
              openDish(row)
            }}
          >
            Editar
          </button>
          <button
            type="button"
            className="action-danger"
            onClick={(event) => {
              event.stopPropagation()
              setRemoving(row)
            }}
          >
            Quitar
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Menu</h1>
          <p>{items.length} platos asignados a cartas</p>
        </div>

        <div className="topbar-actions">
          <button type="button" className="btn" onClick={openAssign}>
            Asignar plato
          </button>
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && !assign && !item && !dish && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-left">
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="">Todos los menus</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando carta</div>
        ) : (
          <Table columns={columns} rows={items} empty="Aun no hay platos asignados a un menu" />
        )}
      </div>

      {assign && (
        <Modal
          title="Asignar plato a un menu"
          onClose={() => setAssign(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setAssign(null)}>
                Cancelar
              </button>
              <button type="submit" form="assign-form" className="btn" disabled={saving}>
                {saving ? "Guardando" : "Asignar"}
              </button>
            </>
          }
        >
          <form id="assign-form" onSubmit={saveAssign}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label htmlFor="dishId">Plato</label>
              <select
                id="dishId"
                value={assign.dishId}
                onChange={(event) => setAssign({ ...assign, dishId: event.target.value })}
                required
              >
                <option value="">Selecciona un plato</option>
                {dishes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="menuId">Menu</label>
              <select
                id="menuId"
                value={assign.menuId}
                onChange={(event) => {
                  setAssign({ ...assign, menuId: event.target.value, pageId: "" })
                  loadSections(event.target.value)
                }}
                required
              >
                <option value="">Selecciona un menu</option>
                {menus.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="pageId">Seccion</label>
              <select
                id="pageId"
                value={assign.pageId}
                onChange={(event) => setAssign({ ...assign, pageId: event.target.value })}
                disabled={!assign.menuId}
                required
              >
                <option value="">
                  {assign.menuId ? "Selecciona una seccion" : "Elige primero un menu"}
                </option>
                {sections.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.section}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="price">Precio</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={assign.price}
                  onChange={(event) => setAssign({ ...assign, price: event.target.value })}
                  placeholder="38.00"
                />
              </div>

              <div className="field">
                <label htmlFor="highPrice">Precio maximo</label>
                <input
                  id="highPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={assign.highPrice}
                  onChange={(event) => setAssign({ ...assign, highPrice: event.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="note">Nota</label>
              <input
                id="note"
                type="text"
                value={assign.note}
                onChange={(event) => setAssign({ ...assign, note: event.target.value })}
                placeholder="Sin gluten"
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={assign.isFeatured}
                onChange={(event) => setAssign({ ...assign, isFeatured: event.target.checked })}
              />
              Destacar en la carta
            </label>
          </form>
        </Modal>
      )}

      {item && (
        <Modal
          title={`Precio de ${item.name}`}
          onClose={() => setItem(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setItem(null)}>
                Cancelar
              </button>
              <button type="submit" form="item-form" className="btn" disabled={saving}>
                {saving ? "Guardando" : "Guardar"}
              </button>
            </>
          }
        >
          <form id="item-form" onSubmit={saveItem}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field-row">
              <div className="field">
                <label htmlFor="itemPrice">Precio</label>
                <input
                  id="itemPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.price}
                  onChange={(event) => setItem({ ...item, price: event.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="itemHigh">Precio maximo</label>
                <input
                  id="itemHigh"
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.highPrice}
                  onChange={(event) => setItem({ ...item, highPrice: event.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="itemPosition">Posicion</label>
              <input
                id="itemPosition"
                type="number"
                min="0"
                value={item.position}
                onChange={(event) => setItem({ ...item, position: event.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="itemNote">Nota</label>
              <input
                id="itemNote"
                type="text"
                value={item.note}
                onChange={(event) => setItem({ ...item, note: event.target.value })}
              />
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={item.isFeatured}
                onChange={(event) => setItem({ ...item, isFeatured: event.target.checked })}
              />
              Destacar en la carta
            </label>
          </form>
        </Modal>
      )}

      {dish && (
        <Modal
          title="Editar plato"
          onClose={() => setDish(null)}
          footer={
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setDish(null)}>
                Cancelar
              </button>
              <button type="submit" form="dish-edit" className="btn" disabled={saving}>
                {saving ? "Guardando" : "Guardar"}
              </button>
            </>
          }
        >
          <form id="dish-edit" onSubmit={saveDish}>
            {error && <div className="alert alert-error">{error}</div>}

            <div className="alert alert-info">
              Los cambios se reflejan tambien en el modulo de platos.
            </div>

            <div className="field">
              <label htmlFor="dishName">Nombre</label>
              <input
                id="dishName"
                type="text"
                value={dish.name}
                onChange={(event) => setDish({ ...dish, name: event.target.value })}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="dishDescription">Descripcion</label>
              <textarea
                id="dishDescription"
                value={dish.description}
                onChange={(event) => setDish({ ...dish, description: event.target.value })}
              />
            </div>

            <div className="field">
              <label htmlFor="dishCategory">Categoria</label>
              <select
                id="dishCategory"
                value={dish.categoryId}
                onChange={(event) => setDish({ ...dish, categoryId: event.target.value })}
              >
                <option value="">Sin categoria</option>
                {categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={dish.isActive}
                onChange={(event) => setDish({ ...dish, isActive: event.target.checked })}
              />
              Plato activo
            </label>
          </form>
        </Modal>
      )}

      {removing && (
        <Confirm
          title="Quitar de la carta"
          message={`Estas seguro de quitar ${removing.dishes.name} de ${removing.menu_pages.menus.name}?`}
          detail="El plato se mantiene en el catalogo y puede volver a asignarse cuando lo necesites."
          confirmLabel="Quitar"
          danger
          loading={saving}
          onCancel={() => setRemoving(null)}
          onConfirm={remove}
        />
      )}
    </>
  )
}

export default Menu
