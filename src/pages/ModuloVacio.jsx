import { useParams, Link } from "react-router-dom"
import { getUserName, getInitials, getErp } from "../api"

/**
 * Un modulo del ERP al que se tiene acceso pero que todavia no tiene
 * pantallas. Es el estado de tres de los cuatro: existen en la estructura,
 * y lo honesto es decir que estan por construirse en vez de dejar la
 * tarjeta muerta al hacerle clic.
 */
const ModuloVacio = () => {
  const { slug } = useParams()
  const curso = getErp().find((item) => item.slug === slug)

  const nombre = curso ? curso.nombre : "Modulo"

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{nombre}</h1>
          <p>{curso ? curso.descripcion : "Este modulo todavia no esta disponible"}</p>
        </div>

        <div className="topbar-actions">
          <div className="topbar-user">
            <span className="avatar">{getInitials()}</span>
            <span>{getUserName()}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="empty empty-grande">
          <strong>Todavia no tiene pantallas</strong>
          <p>
            {nombre} ya existe dentro del sistema y se le puede dar acceso a quien corresponda,
            pero sus pantallas estan por construirse.
          </p>
          <p className="muted">
            Mientras tanto, el modulo <strong>Big Data</strong> tiene todo lo desarrollado hasta
            ahora.
          </p>

          <Link to="/inicio">
            <button type="button" className="btn" style={{ marginTop: "18px" }}>
              Volver al inicio
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}

export default ModuloVacio
