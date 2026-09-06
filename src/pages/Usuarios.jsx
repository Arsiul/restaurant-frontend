import { useState, useEffect } from "react"
import api, { getMessage, getUserName, getInitials, getEmpresa, getDominio, aUsuario } from "../api"
import Modal from "../components/Modal"
import Confirm from "../components/Confirm"

const ROLES = [
  { valor: "trabajador", label: "Trabajador" },
  { valor: "admin", label: "Administrador" }
]

/**
 * Modulo del administrador: da de alta a la gente y reparte a que puede
 * entrar cada quien.
 *
 * El reparto tiene dos niveles, que es como lo resuelve la base:
 *
 *   entrar a una pantalla  =  tener el modulo del ERP  Y  tener la pantalla
 *
 * Por eso el formulario no es una lista plana de casillas: primero se
 * concede el modulo del ERP, y dentro se elige si van todas sus pantallas,
 * algunas o una sola.
 *
 * Al administrador no se le reparte nada. Entra a todo por su rol, igual
 * que lo resuelve la base, asi que mostrarle casillas seria mentir.
 */
const Usuarios = () => {
  const [lista, setLista] = useState([])
  const [erp, setErp] = useState([])
  const [cargando, setCargando] = useState(true)
  const [dominio, setDominio] = useState("")
  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")
  const [busqueda, setBusqueda] = useState("")
  const [filtro, setFiltro] = useState("todos")

  const [formulario, setFormulario] = useState(null)
  const [accesos, setAccesos] = useState(null)
  const [clave, setClave] = useState(null)
  const [borrando, setBorrando] = useState(null)
  const [rolPendiente, setRolPendiente] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setCargando(true)

    api
      .get("/usuarios")
      .then((respuesta) => setLista(respuesta.data))
      .catch((problema) => setError(getMessage(problema)))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
    getDominio().then(setDominio)

    api
      .get("/usuarios/catalogo")
      .then((respuesta) => setErp(respuesta.data))
      .catch(() => {})
  }, [])

  const mostrarAviso = (texto) => {
    setAviso(texto)
    setTimeout(() => setAviso(""), 6000)
  }

  const abrirFormulario = () =>
    setFormulario({
      fullName: "",
      usuario: "",
      usuarioTocado: false,
      role: "trabajador",
      empresa: getEmpresa(),
      password: "",
      cursos: [],
      modulos: [],
      error: ""
    })

  /** El usuario se propone a partir del nombre hasta que se edita a mano. */
  const cambiarNombre = (valor) =>
    setFormulario({
      ...formulario,
      fullName: valor,
      usuario: formulario.usuarioTocado ? formulario.usuario : sugerir(valor)
    })

  const crear = async () => {
    setGuardando(true)

    try {
      const { data } = await api.post("/usuarios", {
        fullName: formulario.fullName,
        usuario: formulario.usuario,
        role: formulario.role,
        empresa: formulario.empresa,
        password: formulario.password,
        cursos: formulario.cursos,
        modulos: formulario.modulos
      })

      setFormulario(null)
      mostrarAviso(`Cuenta creada para ${data.full_name}. Ya puede entrar con ${data.email}`)
      cargar()
    } catch (problema) {
      setFormulario({ ...formulario, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  const guardarAccesos = async () => {
    setGuardando(true)

    try {
      const { data } = await api.put(`/usuarios/${accesos.usuario.id}/modulos`, {
        cursos: accesos.cursos,
        modulos: accesos.modulos
      })

      mostrarAviso(
        data.cursos.length === 0
          ? `@${accesos.usuario.usuario} se quedo sin acceso a ningun modulo`
          : `@${accesos.usuario.usuario}: ${data.cursos.length} ${
              data.cursos.length === 1 ? "modulo" : "modulos"
            } del ERP, ${data.modulos.length} ${
              data.modulos.length === 1 ? "pantalla" : "pantallas"
            }`
      )

      setAccesos(null)
      cargar()
    } catch (problema) {
      setAccesos({ ...accesos, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  /**
   * Cambiar el rol no se aplica al soltar el desplegable: se confirma.
   *
   * Es la accion mas consecuente del panel y la mas facil de disparar sin
   * querer, porque basta rozar un desplegable. Ademas cambia lo que la
   * persona ve y lo que puede hacer sobre las cuentas de los demas.
   *
   * Al cancelar no hay que revertir nada: el desplegable esta gobernado
   * por el rol de la lista, que no se toca hasta que el servidor responde.
   */
  const cambiarRol = async () => {
    const { usuario, role } = rolPendiente

    setGuardando(true)
    setError("")

    try {
      await api.patch(`/usuarios/${usuario.id}`, { role })
      mostrarAviso(
        `${usuario.full_name || usuario.usuario} ahora es ${
          role === "admin" ? "administrador" : "trabajador"
        }`
      )
      setRolPendiente(null)
      cargar()
    } catch (problema) {
      setError(getMessage(problema))
      setRolPendiente(null)
    } finally {
      setGuardando(false)
    }
  }

  const restablecer = async () => {
    setGuardando(true)

    try {
      await api.post(`/usuarios/${clave.usuario.id}/clave`, { password: clave.password })
      mostrarAviso(`Contrasena restablecida para @${clave.usuario.usuario}`)
      setClave(null)
    } catch (problema) {
      setClave({ ...clave, error: getMessage(problema) })
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    setGuardando(true)

    try {
      await api.delete(`/usuarios/${borrando.id}`)
      mostrarAviso(`Se elimino la cuenta de @${borrando.usuario}`)
      setBorrando(null)
      cargar()
    } catch (problema) {
      setError(getMessage(problema))
      setBorrando(null)
    } finally {
      setGuardando(false)
    }
  }

  const visibles = lista
    .filter((item) => (filtro === "todos" ? true : item.role === filtro))
    .filter((item) => {
      const texto = busqueda.trim().toLowerCase()
      if (!texto) return true

      return (
        (item.full_name || "").toLowerCase().includes(texto) ||
        (item.usuario || "").toLowerCase().includes(texto) ||
        (item.email || "").toLowerCase().includes(texto)
      )
    })

  const totales = {
    todos: lista.length,
    admin: lista.filter((i) => i.role === "admin").length,
    trabajador: lista.filter((i) => i.role === "trabajador").length,
    sinAcceso: lista.filter((i) => i.role !== "admin" && (i.cursos || []).length === 0).length
  }

  /** Los modulos del ERP que tiene una cuenta, con cuantas pantallas dentro. */
  const resumenDe = (usuario) =>
    erp
      .filter((curso) => (usuario.cursos || []).includes(curso.id))
      .map((curso) => {
        const dentro = curso.modulos.filter(
          (modulo) => modulo.disponible && (usuario.modulos || []).includes(modulo.clave)
        )

        const totalPantallas = curso.modulos.filter((modulo) => modulo.disponible).length

        return { curso, dentro: dentro.length, total: totalPantallas }
      })

  const correoPrevio = formulario && formulario.usuario ? aUsuario(formulario.usuario) : ""

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Usuarios</h1>
          <p>Cuentas de la empresa y a que parte del sistema entra cada una</p>
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

      <div className="metrics metrics-4">
        <div className="metric">
          <span>Cuentas</span>
          <strong>{totales.todos}</strong>
        </div>
        <div className="metric">
          <span>Administradores</span>
          <strong>{totales.admin}</strong>
        </div>
        <div className="metric">
          <span>Trabajadores</span>
          <strong>{totales.trabajador}</strong>
        </div>
        <div className="metric">
          <span>Sin ningun modulo</span>
          <strong>{totales.sinAcceso}</strong>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, usuario o correo"
          />
        </div>

        <div className="row-actions">
          <div className="tabs">
            {[
              { valor: "todos", label: "Todos" },
              { valor: "admin", label: "Administradores" },
              { valor: "trabajador", label: "Trabajadores" }
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

          <button type="button" className="btn" onClick={abrirFormulario}>
            Crear usuario
          </button>
        </div>
      </div>

      <div className="card">
        {cargando && <div className="loading">Cargando usuarios</div>}

        {!cargando && visibles.length === 0 && (
          <div className="empty">
            {lista.length === 0
              ? "Todavia no hay cuentas creadas"
              : "Ninguna cuenta coincide con la busqueda"}
          </div>
        )}

        {!cargando && visibles.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Correo de acceso</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((usuario) => {
                  const resumen = usuario.role === "admin" ? [] : resumenDe(usuario)

                  return (
                    <tr key={usuario.id}>
                      <td>
                        <span className="cell-main">{usuario.full_name || "Sin nombre"}</span>
                        <span className="muted">@{usuario.usuario}</span>
                      </td>
                      <td className="muted">{usuario.email}</td>
                      <td>
                        <select
                          className="select-rol"
                          value={usuario.role}
                          disabled={usuario.esYo}
                          title={
                            usuario.esYo ? "No puedes cambiarte el rol a ti mismo" : "Cambiar el rol"
                          }
                          onChange={(e) =>
                            setRolPendiente({ usuario, role: e.target.value })
                          }
                        >
                          {ROLES.map((rol) => (
                            <option key={rol.valor} value={rol.valor}>
                              {rol.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {usuario.role === "admin" ? (
                          <span className="chip chip-propia">Todo el ERP, por su rol</span>
                        ) : resumen.length === 0 ? (
                          <span className="chip chip-vacio">Ningun modulo</span>
                        ) : (
                          <div className="modulos-chips">
                            {resumen.map(({ curso, dentro, total }) => (
                              <span className="chip chip-tipo" key={curso.id}>
                                {curso.nombre}
                                {total > 0 && (
                                  <b>
                                    {" "}
                                    {dentro}/{total}
                                  </b>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="acciones-fila">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            disabled={usuario.role === "admin"}
                            title={
                              usuario.role === "admin"
                                ? "Un administrador ya entra a todo el ERP"
                                : "Elegir a que entra"
                            }
                            onClick={() =>
                              setAccesos({
                                usuario,
                                cursos: [...(usuario.cursos || [])],
                                modulos: [...(usuario.modulos || [])],
                                error: ""
                              })
                            }
                          >
                            Accesos
                          </button>

                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setClave({ usuario, password: "", error: "" })}
                          >
                            Clave
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={usuario.esYo}
                            title={usuario.esYo ? "No puedes eliminar tu propia cuenta" : "Eliminar"}
                            onClick={() => setBorrando(usuario)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formulario && (
        <Modal
          ancho
          title="Crear usuario"
          onClose={() => setFormulario(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={crear} disabled={guardando}>
                {guardando ? "Creando..." : "Crear cuenta"}
              </button>
            </>
          )}
        >
          <p className="muted" style={{ marginBottom: "16px" }}>
            La cuenta queda activa de inmediato, sin codigo de verificacion. Entregale la
            contrasena a la persona para que entre y la cambie.
          </p>

          <div className="field">
            <label>Nombre completo</label>
            <input
              value={formulario.fullName}
              onChange={(e) => cambiarNombre(e.target.value)}
              placeholder="Ej. Juana Perez"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Usuario</label>
            <div className="input-dominio">
              <input
                value={formulario.usuario}
                onChange={(e) =>
                  setFormulario({ ...formulario, usuario: e.target.value, usuarioTocado: true })
                }
                placeholder="jperez"
              />
              {dominio && <span>@{dominio}</span>}
            </div>
            <span className="muted">
              {correoPrevio
                ? `Iniciara sesion como ${correoPrevio}${dominio ? `@${dominio}` : ""}`
                : "Solo letras, numeros, punto y guion bajo"}
            </span>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Rol</label>
              <select
                value={formulario.role}
                onChange={(e) => setFormulario({ ...formulario, role: e.target.value })}
              >
                {ROLES.map((rol) => (
                  <option key={rol.valor} value={rol.valor}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Empresa</label>
              <input
                value={formulario.empresa}
                onChange={(e) => setFormulario({ ...formulario, empresa: e.target.value })}
                placeholder="Ej. Rimberio"
              />
            </div>
          </div>

          <div className="field">
            <label>Contrasena inicial</label>
            <input
              type="password"
              value={formulario.password}
              onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
            />
          </div>

          {formulario.role === "admin" ? (
            <div className="alert alert-info">
              Un administrador entra a todos los modulos del ERP por su rol, y ademas puede crear y
              eliminar cuentas. No hace falta asignarle nada.
            </div>
          ) : (
            <Accesos erp={erp} estado={formulario} ponerEstado={setFormulario} />
          )}

          {formulario.error && <div className="alert alert-error">{formulario.error}</div>}
        </Modal>
      )}

      {accesos && (
        <Modal
          ancho
          title={`Accesos de @${accesos.usuario.usuario}`}
          onClose={() => setAccesos(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={guardarAccesos} disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar accesos"}
              </button>
            </>
          )}
        >
          <p className="muted" style={{ marginBottom: "18px" }}>
            Lo que marques es lo que la base va a verificar en cada operacion, no solo lo que se
            dibuja en pantalla. Los cambios se ven cuando la persona recargue o vuelva a entrar.
          </p>

          <Accesos erp={erp} estado={accesos} ponerEstado={setAccesos} />

          {accesos.error && <div className="alert alert-error">{accesos.error}</div>}
        </Modal>
      )}

      {clave && (
        <Modal
          title={`Restablecer la clave de @${clave.usuario.usuario}`}
          onClose={() => setClave(null)}
          footer={(cerrar) => (
            <>
              <button type="button" className="btn btn-ghost" onClick={cerrar}>
                Cancelar
              </button>
              <button type="button" className="btn" onClick={restablecer} disabled={guardando}>
                {guardando ? "Guardando..." : "Cambiar contrasena"}
              </button>
            </>
          )}
        >
          <p className="muted" style={{ marginBottom: "16px" }}>
            La persona tambien puede recuperarla sola desde la pantalla de inicio de sesion. Esta
            via es la salida cuando no tiene acceso a la bandeja de {clave.usuario.email}.
          </p>

          <div className="field">
            <label>Contrasena nueva</label>
            <input
              type="password"
              value={clave.password}
              onChange={(e) => setClave({ ...clave, password: e.target.value })}
              placeholder="Minimo 8 caracteres"
              autoComplete="new-password"
              autoFocus
            />
          </div>

          {clave.error && <div className="alert alert-error">{clave.error}</div>}
        </Modal>
      )}

      {rolPendiente && <ConfirmarRol
        pendiente={rolPendiente}
        guardando={guardando}
        onCancel={() => setRolPendiente(null)}
        onConfirm={cambiarRol}
      />}

      {borrando && (
        <Confirm
          title="Eliminar cuenta"
          message={`Se eliminara la cuenta de ${borrando.full_name || borrando.usuario} (@${borrando.usuario}).`}
          detail="Se pierden tambien sus archivos importados y sus tareas. La operacion no se puede deshacer."
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

/**
 * El reparto en sus dos niveles: el modulo del ERP arriba, y dentro sus
 * pantallas. Se define fuera del componente para que React no lo trate
 * como un tipo nuevo en cada render, que es lo que haria perder el foco
 * al marcar una casilla.
 */
const Accesos = ({ erp, estado, ponerEstado }) => {
  /** Marca o desmarca una pantalla suelta. */
  const alternarPantalla = (curso, clave) => {
    const tenia = estado.modulos.includes(clave)

    ponerEstado({
      ...estado,
      modulos: tenia
        ? estado.modulos.filter((item) => item !== clave)
        : [...estado.modulos, clave],
      // Conceder una pantalla arrastra a su modulo del ERP: sin el, la base
      // niega igual y el panel mostraria un permiso que no existe.
      cursos: tenia ? estado.cursos : [...new Set([...estado.cursos, curso.id])]
    })
  }

  /**
   * Marca o desmarca un modulo del ERP entero. Quitarlo se lleva sus
   * pantallas: dejarlas marcadas sin el modulo mostraria un acceso que la
   * base no concede.
   */
  const alternarModulo = (curso) => {
    const tenia = estado.cursos.includes(curso.id)
    const claves = curso.modulos.filter((m) => m.disponible).map((m) => m.clave)

    ponerEstado({
      ...estado,
      cursos: tenia
        ? estado.cursos.filter((id) => id !== curso.id)
        : [...new Set([...estado.cursos, curso.id])],
      modulos: tenia
        ? estado.modulos.filter((clave) => !claves.includes(clave))
        : [...new Set([...estado.modulos, ...claves])]
    })
  }

  return (
    <>
      <span className="etiqueta-bloque">A que parte del sistema entra</span>

      <div className="acceso-lista">
        {erp.map((curso) => {
          const dado = estado.cursos.includes(curso.id)
          const pantallas = curso.modulos.filter((modulo) => modulo.disponible)
          const pendientes = curso.modulos.filter((modulo) => !modulo.disponible)

          return (
            <div className={`acceso-curso ${dado ? "activo" : ""}`} key={curso.id}>
              <label className="acceso-cabecera">
                <input type="checkbox" checked={dado} onChange={() => alternarModulo(curso)} />

                <span className="modulo-texto">
                  <strong>{curso.nombre}</strong>
                  <span className="muted">
                    {pantallas.length === 0
                      ? "Todavia no tiene pantallas"
                      : `${pantallas.length} pantallas`}
                  </span>
                </span>
              </label>

              {dado && pantallas.length > 0 && (
                <div className="acceso-pantallas">
                  {pantallas.map((modulo) => (
                    <label
                      key={modulo.clave}
                      className={`modulo-opcion ${
                        estado.modulos.includes(modulo.clave) ? "activa" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={estado.modulos.includes(modulo.clave)}
                        onChange={() => alternarPantalla(curso, modulo.clave)}
                      />

                      <span className="modulo-texto">
                        <strong>{modulo.nombre}</strong>
                        <span className="muted">{modulo.descripcion}</span>
                      </span>
                    </label>
                  ))}

                  {pendientes.length > 0 && (
                    <p className="muted acceso-pendientes">
                      {pendientes.map((modulo) => modulo.nombre).join(", ")}
                      {pendientes.length === 1 ? " esta" : " estan"} en el plan del modulo pero
                      todavia sin construir.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {estado.cursos.length === 0 && (
        <p className="muted" style={{ marginTop: "12px" }}>
          Sin ningun modulo marcado la cuenta entra al sistema, pero no ve ninguna seccion.
        </p>
      )}
    </>
  )
}

/**
 * Confirmacion del cambio de rol.
 *
 * El texto cambia segun la direccion, porque las consecuencias no son
 * simetricas: promover concede todo el sistema, y degradar puede dejar a
 * alguien sin acceso a nada si nunca se le asigno ningun modulo.
 */
const ConfirmarRol = ({ pendiente, guardando, onCancel, onConfirm }) => {
  const { usuario, role } = pendiente
  const nombre = usuario.full_name || `@${usuario.usuario}`
  const promueve = role === "admin"
  const asignados = (usuario.asignado && usuario.asignado.modulos.length) || 0
  const quedaSinNada = !promueve && asignados === 0

  const detalle = promueve
    ? "Entrara a todos los modulos del sistema por su rol, y ademas podra crear cuentas, cambiar roles y repartir accesos. Los modulos que tenga asignados dejan de influir mientras sea administrador."
    : quedaSinNada
      ? "No tiene ningun modulo asignado, asi que se quedara sin acceso a ninguna pantalla. Tendras que darselos desde Accesos."
      : `Pasara a ver unicamente ${asignados === 1 ? "el modulo que tiene asignado" : `los ${asignados} modulos que tiene asignados`}, y dejara de poder administrar cuentas.`

  return (
    <Confirm
      title={promueve ? "Promover a administrador" : "Quitar el rol de administrador"}
      message={`${nombre} ${promueve ? "pasara a ser administrador" : "dejara de ser administrador"}.`}
      detail={detalle}
      confirmLabel={promueve ? "Promover" : "Quitar el rol"}
      danger={!promueve}
      loading={guardando}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

/** Juana Perez -> jperez. Es solo una propuesta, el campo sigue editable. */
const sugerir = (nombre) => {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean)

  if (partes.length === 0) return ""
  if (partes.length === 1) return aUsuario(partes[0])

  return aUsuario(partes[0].charAt(0) + partes[1])
}

export default Usuarios
