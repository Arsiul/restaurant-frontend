import Modal from "./Modal"

const Confirm = ({
  title,
  message,
  detail,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  loading = false,
  onCancel,
  onConfirm
}) => (
  <Modal
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? "btn btn-danger" : "btn"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Procesando" : confirmLabel}
        </button>
      </>
    }
  >
    <p className="confirm-message">{message}</p>
    {detail && <p className="confirm-detail">{detail}</p>}
  </Modal>
)

export default Confirm
