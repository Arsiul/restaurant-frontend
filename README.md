# Frontend

Interfaz del sistema de menus de restaurante. React con Vite.

## Requisitos

Node.js 18 o superior y el backend en ejecucion.

## Instalacion

```
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

## Variables de entorno

Archivo `.env` en la raiz de esta carpeta.

| Variable | Descripcion |
|---|---|
| `VITE_API_URL` | Direccion base de la API |

La aplicacion no conoce las credenciales de Supabase. Solo se comunica con el
backend.

## Estructura de carpetas

```
frontend/
  index.html                   Documento base
  vite.config.js               Configuracion de Vite
  package.json
  .env
  src/
    main.jsx                   Punto de entrada y enrutador
    App.jsx                    Definicion de rutas publicas y privadas
    api.js                     Cliente Axios y manejo de sesion
    index.css                  Variables de diseno y estilos de toda la interfaz
    components/
      Layout.jsx               Barra lateral, datos del usuario y cierre de sesion
      Modal.jsx                Ventana modal reutilizable
      Table.jsx                Tabla con paginacion y seleccion de fila
    pages/
      Login.jsx                Inicio de sesion
      Register.jsx             Registro y verificacion por codigo
      Dishes.jsx               Modulo 1
      Menu.jsx                 Modulo 2
      Report.jsx               Modulo 3
```

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login` | Publica | Inicio de sesion |
| `/registro` | Publica | Registro y verificacion |
| `/platos` | Privada | Modulo 1 |
| `/menu` | Privada | Modulo 2 |
| `/reporte` | Privada | Modulo 3 |

Las rutas privadas verifican el token antes de mostrar el contenido. Sin sesion
redirigen a `/login`.

## Manejo de sesion

`api.js` concentra la comunicacion con el backend.

| Funcion | Descripcion |
|---|---|
| Interceptor de peticion | Agrega la cabecera `Authorization` en cada llamada |
| Interceptor de respuesta | Ante un codigo 401 limpia la sesion y redirige a `/login` |
| `saveSession` | Guarda token y datos del usuario |
| `getUser` | Devuelve los datos del usuario |
| `isLogged` | Indica si existe una sesion activa |
| `clearSession` | Elimina la sesion |

El token se almacena en `localStorage`.

## Modulos

### Modulo 1: Platos

Listado del catalogo con busqueda por nombre, filtro por categoria y pestanas
por estado. Incluye dos acciones principales:

| Accion | Descripcion |
|---|---|
| Nuevo plato | Abre un formulario modal para registrar un plato |
| Importar | Carga masiva desde archivo CSV o Excel con resumen de resultados |

Cada fila permite editar el plato o desactivarlo. La tabla no muestra
identificadores: la categoria aparece por nombre y el estado como indicador
visual.

### Modulo 2: Menu

Muestra los platos ya registrados junto con el menu y la seccion a la que
pertenecen, mas el precio de esa carta. Acciones disponibles:

| Accion | Descripcion |
|---|---|
| Asignar plato | Selecciona plato, menu y seccion, y define el precio |
| Precio | Edita precio, rango, posicion, nota y destacado |
| Plato | Edita el plato, reflejandose en el modulo 1 |
| Quitar | Retira el plato de la carta sin eliminarlo del catalogo |

El desplegable de secciones se completa segun el menu elegido.

### Modulo 3: Reporte

Solo lectura. Presenta seis indicadores, cuatro visualizaciones y un bloque de
recomendaciones generadas a partir de los datos.

| Elemento | Contenido |
|---|---|
| Indicadores | Platos activos, menus publicados, platos en carta, precio promedio, unidades vendidas e ingresos |
| Grafico circular | Distribucion de platos por categoria |
| Grafico de barras | Platos con mas apariciones en cartas |
| Grafico de lineas | Ingresos por fecha |
| Tabla | Rango de precios minimo y maximo por plato |
| Recomendaciones | Observaciones generadas por el backend |

## Estilos

No se utilizan librerias de estilos. Todo el diseno esta en `src/index.css`,
organizado por bloques y apoyado en variables definidas en `:root`.

| Variable | Uso |
|---|---|
| `--primary` | Color principal de la interfaz |
| `--accent` | Color de enlaces secundarios y acciones destructivas |
| `--bg` | Fondo de la aplicacion |
| `--surface` | Fondo de tarjetas y tablas |
| `--text` | Color de texto principal |
| `--muted` | Color de texto secundario |
| `--border` | Color de bordes |
| `--radius` | Radio de bordes de tarjetas |

Modificar estas variables cambia el aspecto de toda la aplicacion.

## Construccion

```
npm run build
```

El resultado queda en la carpeta `dist`.
