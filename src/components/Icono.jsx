/**
 * Iconos del riel de navegacion.
 *
 * Van como SVG en linea y no como libreria: son ocho trazos simples, y
 * cualquier paquete de iconos pesaria mas que todo el resto del bundle
 * junto para lo que se usa aca. Heredan el color del contenedor con
 * `currentColor`, asi el estado activo no necesita una version aparte.
 */
const TRAZOS = {
  inicio: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  importar: (
    <>
      <path d="M12 15V3" />
      <path d="m7 8 5-5 5 5" />
      <path d="M3 15v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
    </>
  ),
  estructura: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 10v10" />
    </>
  ),
  datasets: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  comparar: (
    <>
      <path d="M5 20V10" />
      <path d="M12 20V4" />
      <path d="M19 20v-6" />
    </>
  ),
  usuarios: (
    <>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.87" />
    </>
  ),
  modulo: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7z" />
      <path d="m3 7 9 5 9-5" />
      <path d="M12 12v10" />
    </>
  ),
  salir: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  )
}

const Icono = ({ nombre, size = 20 }) => (
  <svg
    className="icono"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {TRAZOS[nombre] || TRAZOS.modulo}
  </svg>
)

export default Icono
