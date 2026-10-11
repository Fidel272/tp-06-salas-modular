# Trabajo práctico 06

## Proyecto de partida y cambios

El proyecto parte del tp-05-salas-middleware, correspondiente a una aplicación de reservas de salas de estudio desarrollada con Node.js, Express y EJS.

El objetivo de este trabajo es refactorizar la aplicación para serparar sus responsabilidades en módulos, manteniendo las rutas, las vistas, los datos iniciales y las validaciones existentes.

Los principales cambios realizados son:

- Separación de la configuración del servidor.
- Creación de un servicio para administrar las reservas en memoria.
- Separación de las rutas y los controladores.
- Organización de los middlewares de solicitudes y reservas.
- Configuración del puerto y del formato de registro mediante variables de entorno.
- Incorporación de Prettier y ESLint para el formato y el análisis estático del código.

## Instalación y ejecución

Se necesita tener Node.js y npm instalados.

Instalar las dependencias:
```bash
npm install
```

Iniciar la apliación
```bash
npm Start
```
Por defecto, la aplicación estará disponible en:
http://localhost:300

## Configuración del entorno
La aplicación utiliza las siguientes variables de entorno:

| Variable | Valor predeterminado | Descripción |
| --- | --- | --- |
| PORT | 3000 | Puerto en el que escucha el servidor. |
| NODE_ENV | development | Entorno de ejecución |

El archivo .env contiene un ejemplo de configuración:
PORT=3000
NODE_ENV=development

La configuración se procesa en src/configuracion.js. El puerto se convierte a número y se valida para aceptar únicamente enteros entre 1 y 65535.

El formato de Morgan depende del entorno:

- development: utiliza el formato dev.
- production: utiliza el formato combined.

La aplicación puede iniciarse con npm start sin necesidad de un archivo .env ya que dispone de valores predeterminados.

El archivo .env y la carpeta node_modules/ están incluidos en .gitignore

## Mapa de módulos y dependencias

src/
├── index.js
├── app.js
├── configuracion.js
├── rutas/
│   └── reservas.js
├── controladores/
│   └── reservas.js
├── servicios/
│   └── reservas.js
└── middleware/
    ├── solicitudes.js
    └── reservas.js

### Responsabilidad en cada módulo

- index.js: Define los datos iniciales, lee la configuración, crea el servicio y la aplaición, e inicia el servidor.

- app.js: Configura Express, EJS, Morgan, los middlewares generales, las rutas principales y la respuesta 404.

- configuracion.js: Lee y valida las variables de entorno.

- rutas/reservas.js: Procesa las solicitudes, consulta el servicio y genera las respuestas HTTP.

- controladores/reservas.js: Procesa las solicitudes, consulta el servicio y genera las respuestas HTTP.

- servicios/reservas.js: Administra las reservas en memoria, permitiendo listarlas, buscarlas, contarlas y crearlas.

- middleware/solicitudes.js: Asigna un identificador a cada solicitud y mide su duración.

- middleware/reservas.js: Configura la sección de reservas y valida los datos enviados al crear una reserva.

### Separación de responsabilidades

El servicio no utiliza req ni res, porque su función es administrar los datos y no gestionar las solicitudes HTTP.

El controlador recibe la solicitud, utiliza el servicio y decide qué respuesta enviar, por ejemplo, renderizar una vista, responder con un error 404 o redirigir después de crear una reserva.

El router utiliza rutas relativas porque se monta en /reservas desde app.js. De esta manera, router.get("/") corresponde a GET /reservas.

La colección de reservas se encuentra dentro de una única instancia del servicio, compartida por el listado, el detalle, la creación y la ruta /estado.

## Pipeline y contrato de rutas

El pipeline general de la aplicación es:

Morgan
  ↓
Identificador de solicitud
  ↓
Medición de duración
  ↓
Express EJS Layouts
  ↓
Archivos estáticos
  ↓
Lectura de formularios y JSON
  ↓
Rutas principales
  ↓
Router de reservas
  ↓
Respuesta 404

### Rutas principales

| Método | Ruta | Comportamiento |
| --- | --- | --- |
| GET | / | Muestra la página de inicio. |
| GET | /estado | Devuelve el estado del servicio, la cantidad de reservas y el identificador de solicitud. |
| GET | /reservas | Muestra el listado de reservas. |
| GET | /reservas/nueva | Muestra el formulario de creación. |
| POST | /reservas | Valida y crea una reserva, o responde con error 404 |
| GET | /reservas/:id | Muestra el detalle de una reserva o responde con error 404. |
| GET | /css/estilos.css | Sirve la hoja de estilos estática |
| GET | URL inexistente | Muestra la página de error 404. |

La validación verifica que el estudiante, el email, la sala, la fecha, el turno y la cantidad de personas sean válidos. La cantidad de personas debe ser un entero entre 1 y 6.

Cuando los datos son válidos, el middleware los guarda en req.reservaValidada y continúa hacia el controlador. Cuando son inválidos, responde con estado 400, muestra el formulario con los valores recibidos y no crea la reserva.

Una creación válida responde con una redirección HTTP 302 hacia /reservas.

## Matriz antes/después

| Caso | Esperado | TP05 observado | TP06 observado | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| GET / | 200 | 200 | 200 | Muestra la página de inicio. |
| GET /estado | 200 | 200 | 200 | Devuelve JSON con el estado, la cantidad de reservas y el ID de solicitud. |
| GET /reservas | 200 | 200 | 200 | Muestra las cuatro reservas iniciales. |
| GET /reservas/nueva | 200 | 200 | 200 | Renderiza el formulario de nueva reserva. |
| GET /reservas/1 | 200 | 200 | 200 | Muestra el detalle de Juan Ignacio Castro. |
| GET /reservas/999 | 404 | 404 | 404 | Renderiza la vista no-encontrado. |
| POST /reservas inválido | 400 | 400 | 400 | Muestra el formulario con el mensaje de error y no crea una reserva. |
| POST /reservas válido | 302 -> 200 | 302 -> 200 | 302 -> 200 | Redirige al listado y muestra la nueva reserva. |
| GET /css/estilos.css | 200 | 200 | 200 | Sirve la hoja de estilos, si el archivo existe en esa ruta. |
| GET /url-inexistente | 404 | 404 | 404 | Renderiza la vista no-encontrado. |

## Formato y análisis estático

El proyecto utiliza Prettier para mantener un formato consistente y ESLint para detectar problemas estáticos en el código.

Comandos disponibles:
`npm run format`
`npm run format:check`
`npm run lint`
`npm run check`

## Persistencia temporal y límites

Las reservas se almacenan en memoria mediante el servicio de reservas. No se utiliza una base de datos ni se escriben las reservas en archivos.

Al reiniciar el servidor, las reservas creadas durante la ejecución se pierden y la aplicación vuelve a cargar los cuatro registros iniciales definidos en src/index.js.

El trabajo se limita a la modularización de la aplicación existente, sin incorporar autenticación, autorización, bases de datos ni nuevas funcionalidades ajenas al práctico.