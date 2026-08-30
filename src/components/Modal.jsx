import { useState } from "react"

// "ancho" ensancha el modal para el contenido tabular, donde 460px obligan
// a desplazarse en horizontal para leer cualquier archivo de varias columnas.
const Modal = ({ title, onClose, children, footer, ancho = false }) => {
  const [closing, setClosing] = useState(false)

  const close = () => {
    setClosing(true)
    setTimeout(onClose, 180)
  }

  const actions = typeof footer === "function" ? footer(close) : footer

  return (
    <div className={closing ? "overlay closing" : "overlay"} onClick={close}>
      <div
        className={ancho ? "modal modal-ancho" : "modal"}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" onClick={close}>
            &times;
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {actions && <div className="modal-foot">{actions}</div>}
      </div>
    </div>
  )
}

export default Modal
