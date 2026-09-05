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

El dominio de correo de la empresa no se declara aqui: lo sirve el backend en
`GET /api/auth/dominio` para que exista un solo lugar donde cambiarlo.

Vite reemplaza las variables `VITE_*` por su valor dentro del bundle durante el
build, asi que todo lo que se declare aqui queda visible en el navegador. Por eso
solo se usa la clave publicable, que esta pensada para eso: no autoriza nada por
si sola. Ni el token de la Management API ni la clave de servicio pasan por el
frontend.

## Cuentas de prueba

| Usuario | Correo | Contrasena | Rol |
|---|---|---|---|
| `admin` | `admin@rimberio.com` | `Admin2026!` | Administrador |
| `trabajador` | `trabajador@rimberio.com` | `Trabajo2026!` | Trabajador |

Toda la empresa entra con un correo del mismo dominio, asi que en la pantalla
de inicio de sesion basta escribir el usuario: `admin` alcanza para
`admin@rimberio.com`.

## Recuperar la contrasena

Desde la pantalla de inicio de sesion, con el enlace bajo el campo de la
contrasena. Son dos pasos: se pide el codigo con el correo, y despues se
ingresa ese codigo junto a la contrasena nueva. Es el mismo componente de ocho
casillas que ya usa la verificacion del registro.

La pantalla responde igual exista o no la cuenta. Confirmar cual existe la
convertiria en un directorio de correos para cualquiera.

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
      Icono.jsx                Iconos del riel, en SVG en linea
      Modal.jsx                Ventana modal reutilizable
      ResumenImport.jsx        Cifras y graficos de un archivo importado
      Confirm.jsx              Confirmacion de acciones destructivas
    pages/
      Login.jsx                Inicio de sesion
      Register.jsx             Registro y verificacion por codigo
      Recuperar.jsx            Recuperacion de contrasena
      Inicio.jsx               Lanzador con los cuatro modulos del ERP
      ModuloVacio.jsx          Modulo del ERP todavia sin pantallas
      Importar.jsx             Importar archivos
      DatosEmpresa.jsx         Datos de la empresa
      Archivos.jsx             Archivos cargados
      Comparar.jsx             Comparar restaurantes
      Usuarios.jsx             Alta y mantenimiento de cuentas
```

## Rutas

| Ruta | Que exige | Pantalla |
|---|---|---|
| `/login` | Publica | Inicio de sesion |
| `/registro` | Publica | Registro y verificacion |
| `/recuperar` | Publica | Recuperacion de contrasena |
| `/inicio` | Solo tener sesion | Lanzador del ERP |
| `/modulo/:slug` | Acceso a ese modulo | Modulo del ERP sin pantallas |
| `/importar` | `big_data.importar` | Importar datos |
| `/datos-empresa` | `big_data.estructura` | Estructura de datos |
| `/archivos` | `big_data.datasets` | Datasets |
| `/comparar` | `big_data.comparar` | Comparacion |
| `/usuarios` | Rol de administrador | Usuarios |

El sistema es un **ERP de cuatro modulos**. Todo lo desarrollado vive dentro
de **Big Data**; los otros tres existen en la estructura y estan vacios.

Todo el mundo entra por `/inicio`, el lanzador. Desde ahi se elige el modulo,
aunque se tenga acceso a uno solo: ver que el sistema tiene cuatro partes
ubica mejor que aterrizar suelto en una pantalla.

El permiso tiene dos niveles, igual que en la base:

```
entrar a una pantalla  =  tener el modulo del ERP  Y  tener esa pantalla
```

Administrar cuentas va atado al rol y no es repartible: poder crear cuentas
es poder crear administradores.

Esta proteccion es solo de interfaz. El backend exige lo mismo en cada
peticion y las funciones de la base lo verifican otra vez, asi que editar el
`localStorage` no da acceso a nada.

## El riel de navegacion

Una columna angosta de iconos, siempre visible: Inicio arriba, debajo las
pantallas del modulo en el que se esta, y Usuarios al final si eres
administrador.

El nombre del modulo del ERP va en la cabecera y no en el riel, porque es
contexto de lo que se ve y no un destino al que ir.

Los nombres y el orden de las pantallas salen de `curso_modulos`, no de una
lista escrita en el frontend. El icono y la etiqueta corta salen de la clave,
y lo que no tenga icono propio cae en el generico.

En `## Diseno` esta el porque de cada decision.

## Modulos de operacion

Los ve quien tenga concedidas sus claves. El administrador los tiene todos.

### Importar archivos

Dos zonas de carga separadas, cada una con su color:

| Zona | Que hace |
|---|---|
| CSV o Excel de la empresa | Guarda el archivo y ademas vuelca los datos en `empresa_datos`, la tabla que luego se amplia |
| Importar de otra empresa | Guarda el archivo como referencia de la competencia |

Ambas aceptan arrastrar y soltar. Al terminar se abre un resumen con la
estructura detectada: cada columna del archivo, el nombre que tomo en la base y
el tipo deducido.

La estructura va en rejilla y no en tabla. Un archivo de veinte columnas cabe
entero a lo ancho del modal, sin obligar a desplazarse a los lados para leer el
tipo de cada una.

### Resumen de un archivo

Cada fila de la lista de archivos importados trae un boton **Ver resumen**, y el
aviso de importacion recien hecha lleva al mismo sitio. Abre un modal con:

| Elemento | Contenido |
|---|---|
| Indicadores | Ingresos, unidades, ticket promedio y productos |
| Grafico de barras | Ingresos por categoria |
| Grafico de lineas | Evolucion de ingresos por periodo |
| Tabla | Productos con mas ingreso |
| Lectura | Que se observa del archivo, y que capacidades registra |
| Columnas | Las detectadas, marcando cuales reconocio el sistema para calcular |

Es el mismo analisis que hace Comparar con un solo archivo, pero pedido a
`/api/imports/:id/resumen`, que no exige el modulo de comparacion: mirar lo que
uno acaba de importar es parte de importar.

### Datos de la empresa

Muestra la tabla de la empresa con las columnas que tenga en ese momento.

**Este modulo no pasa por el backend en absoluto.** Todas sus operaciones salen
del navegador contra funciones RPC de Postgres, a traves de `src/empresaDb.js`:
leer la tabla, cambiar su estructura, editar celdas y consultar las tareas.

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

## Modulos de analisis

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

### Usuarios

Alta y mantenimiento de las cuentas de la empresa. Es el modulo que solo ve el
administrador.

| Accion | Que hace |
|---|---|
| Crear usuario | Da de alta la cuenta, ya activa y sin codigo de verificacion |
| Modulos | Elige a que secciones entra esa persona |
| Cambiar el rol | Desde la propia fila. Un modal para dos opciones seria mas ceremonia que la decision |
| Restablecer clave | Fija una contrasena nueva, sin pasar por el correo |
| Eliminar | Borra la cuenta con sus archivos y sus tareas |

### Repartir modulos

Casillas agrupadas como el menu lateral, con atajos de **Todos** y
**Ninguno**. Marcar todas equivale a dar acceso completo de una vez, sin ir
modulo por modulo.

Lo que se marca no es una preferencia de interfaz: se guarda donde la base
lo consulta, asi que es lo mismo que Postgres va a verificar en cada
operacion. Los cambios se ven cuando la persona vuelva a iniciar sesion.

La tabla muestra los modulos de cada quien como etiquetas, y marca
**Ninguno** a las cuentas que todavia no tienen acceso a nada. Hay un
indicador arriba con cuantas estan en esa situacion, que es la forma de no
dejar a nadie olvidado despues de crearle la cuenta.

A un administrador no se le reparte nada: la fila dice *Todos, por su rol* y
el boton queda deshabilitado.

El formulario pide nombre, usuario, rol, empresa y contrasena inicial. El
usuario se propone a partir del nombre (`Juana Perez` da `jperez`) y queda
editable. Al lado del campo va el dominio de la empresa, fijo: deja claro que
el correo se arma solo y que nadie elige el suyo.

Un administrador no puede cambiarse el rol ni eliminarse a si mismo. Los dos
controles estan tambien en el servidor; en la interfaz solo se deshabilitan
para que no parezcan disponibles.

Restablecer la clave a mano existe porque la recuperacion por correo depende de
que la bandeja del dominio reciba mensajes de verdad. Cuando no es el caso,
esta es la via que queda.

## Diseno

Tema oscuro con un unico acento calido. La referencia fue un panel de punto
de venta: riel de iconos a la izquierda, fondo casi negro, tarjetas
redondeadas y el acento reservado para lo accionable.

### Paleta

| Variable | Valor | Uso |
|---|---|---|
| `--bg` | `#0d0d10` | Fondo de la aplicacion |
| `--surface` | `#17171c` | Tarjetas, riel, modales |
| `--surface-2` | `#1f1f26` | Campos y estados de hover |
| `--surface-3` | `#26262f` | Campo con foco, tooltip |
| `--border` | `#2a2a33` | Bordes visibles |
| `--border-suave` | `#21212a` | Separacion entre tarjeta y fondo |
| `--text` | `#f4f4f6` | Texto principal |
| `--muted` | `#8b8b98` | Texto secundario |
| `--tenue` | `#5f5f6b` | Texto de tercer nivel, celdas vacias |
| `--primary` | `#ef5a3d` | Acciones, importes y lo seleccionado |
| `--accent` | `#f0a02c` | Alertas de nivel medio |
| `--green` | `#3ecf8e` | Confirmaciones y oportunidades |
| `--danger` | `#e5484d` | Acciones destructivas |

Cuatro niveles de fondo en vez de sombras: sobre negro una sombra no da
profundidad, solo ensucia el borde. La jerarquia se construye con
luminosidad y borde.

Los fondos de estado son el propio color al 13-26 por ciento de opacidad, no
su version pastel: un pastel es un color claro, y sobre negro grita mas que
el texto que acompana.

### Colores de las series

| Serie | Color |
|---|---|
| Nuestra empresa | `#ef5a3d` |
| Competencia | `#4da3ff` |

El par se volvio a validar al cambiar de fondo, porque la separacion depende
de sobre que se dibuja:

| Medida | Valor | Umbral |
|---|---|---|
| Delta E, vision normal | 48.7 | 15 |
| Delta E, protanopia | 55.1 | 15 |
| Delta E, deuteranopia | 63.2 | 15 |
| Contraste de la serie propia contra la tarjeta | 5.27 | 3 |
| Contraste de la competencia contra la tarjeta | 6.80 | 3 |

El fondo oscuro separa este par mucho mejor que el claro anterior, que se
quedaba en 20.8 de delta E bajo protanopia.

### El riel

La navegacion es una columna de 88 pixeles con icono y etiqueta corta. Se
eligio riel y no menu ancho porque el sistema tiene dos niveles: con un menu
de texto habria que repetir el nombre del modulo del ERP y ademas el de cada
pantalla, y esa jerarquia ya la lleva la cabecera. El riel se queda con lo
unico que hace falta a cada momento: a donde puedo ir desde aqui.

Los iconos van como SVG en linea y no como libreria: son ocho trazos, y
cualquier paquete pesaria mas que lo que se usa. Heredan `currentColor`, asi
el estado activo no necesita una version aparte.

La etiqueta debajo del icono cuesta diez pixeles y elimina la adivinanza: el
sistema tiene pantallas que no tienen un simbolo evidente.

En pantallas de menos de 720 pixeles el riel pasa a barra inferior. Ochenta y
ocho pixeles sobre una pantalla de 360 serian una cuarta parte del ancho
gastada en navegar.

## Estilos

No se utilizan librerias de estilos. Todo el diseno esta en `src/index.css`,
apoyado en las variables de `:root`.

## Construccion

```
npm run build
```

El resultado queda en la carpeta `dist`.
