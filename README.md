# Frontend

Interfaz del sistema de analisis competitivo de restaurantes. React con Vite.

## Requisitos

Node.js 18 o superior y el backend en ejecucion.

## Instalacion

```
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:5000`.

## Variables de entorno

| Variable | Descripcion |
|---|---|
| `VITE_API_URL` | Direccion base de la API |
| `VITE_SUPABASE_URL` | Endpoint del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave publicable del proyecto |

Vite reemplaza las variables `VITE_*` por su valor dentro del bundle durante el
build, asi que todo lo que se declare aqui queda visible en el navegador. Por eso
solo se usa la clave publicable, que esta pensada para eso: no autoriza nada por
si sola. Ni el token de la Management API ni la clave de servicio pasan por el
frontend.

## Cuentas de prueba

| Correo | Contrasena | Rol |
|---|---|---|
| `admin@rimberio.com` | `Admin2026!` | Administrador |
| `trabajador@rimberio.com` | `Trabajo2026!` | Trabajador |

## Estructura de carpetas

```
frontend/
  src/
    main.jsx                   Punto de entrada y enrutador
    App.jsx                    Rutas publicas y privadas por rol
    api.js                     Cliente Axios, sesion y helpers de rol
    empresaDb.js               Acceso directo a la base y tareas del trabajador
    index.css                  Variables de diseno y estilos
    components/
      Layout.jsx               Barra lateral, menu segun el rol
      Modal.jsx                Ventana modal reutilizable
      Confirm.jsx              Confirmacion de acciones destructivas
    pages/
      Login.jsx                Inicio de sesion
      Register.jsx             Registro y verificacion por codigo
      Importar.jsx             Trabajador, modulo 1
      DatosEmpresa.jsx         Trabajador, modulo 2
      Archivos.jsx             Administrador, modulo 1
      Comparar.jsx             Administrador, modulo 2
```

## Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login` | Publica | Inicio de sesion |
| `/registro` | Publica | Registro y verificacion |
| `/importar` | Trabajador | Importar archivos |
| `/datos-empresa` | Trabajador | Datos de la empresa |
| `/archivos` | Administrador | Archivos cargados |
| `/comparar` | Administrador | Comparar restaurantes |

Entrar por URL a un modulo de otro rol redirige al inicio que corresponda. Esa
proteccion es solo de interfaz: el backend valida el rol en cada peticion, asi
que editar el `localStorage` no da acceso a nada.

## Modulos del trabajador

### Importar archivos

Dos zonas de carga separadas, cada una con su color:

| Zona | Que hace |
|---|---|
| CSV o Excel de la empresa | Guarda el archivo y ademas vuelca los datos en `empresa_datos`, la tabla que luego se amplia |
| Importar de otra empresa | Guarda el archivo como referencia de la competencia |

Ambas aceptan arrastrar y soltar. Al terminar se abre un resumen con la
estructura detectada: cada columna del archivo, el nombre que tomo en la base y
el tipo deducido.

### Datos de la empresa

Muestra la tabla de la empresa con las columnas que tenga en ese momento.

**Este modulo no pasa por el backend.** Todas sus operaciones salen del
navegador contra funciones RPC de Postgres, a traves de `src/empresaDb.js`. La
unica llamada a la API es la de sugerencias, que es un analisis sobre los
archivos importados y no una operacion de base de datos.

| Accion | Descripcion |
|---|---|
| Agregar columna | Ejecuta un `ALTER TABLE` real. Pide nombre, tipo, valor por defecto y motivo |
| Crear tabla | Ejecuta un `CREATE TABLE` con prefijo `emp_`, para registrar algo que no existia |
| Editar celda | Clic sobre cualquier celda para completar los datos de una columna nueva |
| Eliminar columna | Desde la cabecera, con confirmacion |
| Mis tareas | Abre las tareas que le asigno el administrador |

| Accion en pantalla | Funcion que se llama |
|---|---|
| Cargar la tabla | `empresa_leer` |
| Agregar columna | `empresa_agregar_columna` |
| Crear tabla | `empresa_crear_tabla` |
| Editar celda | `empresa_actualizar_celda` |
| Eliminar columna | `empresa_eliminar_columna` |
| Importar archivo propio | `empresa_materializar`, desde la pantalla de importacion |

La validacion vive dentro de las funciones, en la base: verifican que quien
llama tenga rol de trabajador, que la tabla sea `empresa_datos` o `emp_*`, y que
el nombre y el tipo sean validos antes de armar el SQL. Editar el `localStorage`
o llamar a la funcion desde la consola no saltea ninguno de esos controles.

El trabajo a realizar viene unicamente de las tareas que asigna el
administrador. El boton "Mis tareas" las abre, con un contador de pendientes.
Cada tarea indica que columna crear y de que tipo, pero no la crea: el
trabajador la escribe a mano en el formulario de siempre. Las que pedian una
columna se cierran solas cuando esa columna existe; las analiticas se marcan
como hechas a mano.

Abajo queda la bitacora de todos los cambios de estructura aplicados, con su
motivo.

## Modulos del administrador

### Archivos cargados

Todos los archivos importados por los trabajadores, en tarjetas. Cada tarjeta
muestra el restaurante, el archivo, las filas, las columnas y quien lo cargo. El
borde izquierdo distingue los datos propios de los de la competencia.

Al hacer clic se abre un modal con el contenido del archivo, con sus columnas
originales y la cabecera fija al desplazar.

### Comparar restaurantes

Se eligen uno o dos archivos. Con uno se analiza solo; con dos se comparan.

| Elemento | Contenido |
|---|---|
| Indicadores | Ingresos, unidades, ticket promedio y productos, en barras enfrentadas |
| Grafico de barras | Ingresos por categoria, agrupados por restaurante |
| Grafico de lineas | Evolucion de ingresos por periodo |
| Insights | Por que el otro vende mas, con la accion sugerida |
| Asignar tarea | Cada insight se puede convertir en una orden para un trabajador |
| Tablas | Productos con mas ingreso y capacidades que registra cada uno |

Los indicadores van en barras y no en un grafico porque ingresos, unidades y
ticket tienen escalas incomparables entre si: ponerlos en un mismo eje haria
invisibles a los dos ultimos.

## Colores de las series

| Serie | Color |
|---|---|
| Nuestra empresa | `#c1541f` |
| Competencia | `#1a6fb0` |

El par esta validado para daltonismo sobre fondo claro: delta E de 28 en vision
normal y 20.8 en protanopia, ambos por encima del umbral de 15. La combinacion
de dos tonos calidos de la paleta original no pasaba esa prueba, por eso la
competencia usa azul y no el dorado de marca.

## Estilos

No se utilizan librerias de estilos. Todo el diseno esta en `src/index.css`,
apoyado en variables definidas en `:root`.

| Variable | Uso |
|---|---|
| `--primary` | Color principal de la interfaz |
| `--accent` | Enlaces secundarios |
| `--bg` | Fondo de la aplicacion |
| `--surface` | Fondo de tarjetas y tablas |
| `--text` | Texto principal |
| `--muted` | Texto secundario |
| `--border` | Bordes |
| `--radius` | Radio de bordes |

## Construccion

```
npm run build
```

El resultado queda en la carpeta `dist`.
