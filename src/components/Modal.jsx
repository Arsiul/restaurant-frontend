const Modal = ({ title, onClose, children, footer }) => (
  <div className="overlay" onClick={onClose}>
    <div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button type="button" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="modal-body">{children}</div>

      {footer && <div className="modal-foot">{footer}</div>}
    </div>
  </div>
)

export default Modal
