# Trabajo práctico 05

## Descripción
Aplicación web desarrollada con Node.js, Express y EJS para la gestión de reservas temporales de salas de estudio en una biblioteca. El objetivo principal del proyecto es estructurar un pipeline de middlewares globales, de router y de ruta para procesar, medir, validar y responder solicitudes HTTP.

## Instalación
1. Clonar el repositorio o descargar el código fuente.
2. Abrir una terminal en la raíz del proyecto y ejecutar:
    ```bash
        npm install
    ```
## Ejecución
Para iniciar el servidor en modo producción:
    npm start o npm.cmd start

Para verificar la sintaxis de JavaScript antes de ejecutar:
    npm run check o npm.cmd run check

La aplicación quedará disponible en http://localhost:3000.

## Rutas
-> GET /: Página de bienvenida del sistema.

-> GET /estado: API en formato JSON que indica el estado del servicio y el total de reservas activas.

-> GET /reservas: Listado de todas las reservas registradas.

-> GET /reservas/nueva: Formulario HTML para registrar una nueva reserva.

-> GET /reservas/:id: Detalle completo de una reserva específica (devuelve 404 si no existe).

-> POST /reservas: Procesa el envío del formulario, aplica validaciones y registra la reserva en memoria.

## Pipeline de middleware

### Diagrama 1: GET /reservas (Solicitud exitosa de lectura)

GET /reservas
    ↓ morgan("dev")
    ↓ identificarSolicitud (asigna res.locals.solicitudId = BIB-000X)
    ↓ medirDuracion (inicia marca de tiempo process.hrtime.bigint)
    ↓ expressLayouts
    ↓ express.static (busca archivo estático, al no coincidir pasa al siguiente)
    ↓ express.urlencoded
    ↓ express.json
    ↓ reservasRouter (coincide prefijo /reservas)
    ↓ prepararAreaReservas (asigna res.locals.seccion)
    ↓ Handler GET /reservas (renderiza views/reservas/lista.ejs)
    ↓ Evento 'finish' en res
    ↓ logger de medirDuracion: [BIB-000X] GET /reservas - 200 X.XX ms

### Diagrama 2: POST /reservas VÁLIDO (Alta de reserva exitosa)
POST /reservas
    ↓ morgan("dev")
    ↓ identificarSolicitud (asigna res.locals.solicitudId = BIB-000X)
    ↓ medirDuracion (inicia marca de tiempo)
    ↓ expressLayouts
    ↓ express.static
    ↓ express.urlencoded (procesa req.body)
    ↓ express.json
    ↓ reservasRouter
    ↓ prepararAreaReservas (asigna res.locals.seccion)
    ↓ validarReserva (pasa las comprobaciones e inyecta req.reservaValidada)
    ↓ crearReserva (calcula ID, inserta en memoria y ejecuta res.redirect("/reservas"))
    ↓ Responde HTTP 302 Found (Redirección)
    ↓ Evento 'finish' en res
    ↓ logger de medirDuracion: [BIB-000X] POST /reservas - 302 X.XX ms

### Diagrama 3: POST /reservas INVÁLIDO (Error de validación)
POST /reservas
    ↓ morgan("dev")
    ↓ identificarSolicitud (asigna res.locals.solicitudId = BIB-000X)
    ↓ medirDuracion (inicia marca de tiempo)
    ↓ expressLayouts
    ↓ express.static
    ↓ express.urlencoded (procesa req.body)
    ↓ express.json
    ↓ reservasRouter
    ↓ prepararAreaReservas (asigna res.locals.seccion)
    ↓ validarReserva (detecta error, detiene el pipeline con return res.status(400).render(...))
    ↓ Responde HTTP 400 Bad Request (renderiza vista con error y mantiene valores)
    ↓ Evento 'finish' en res
    ↓ logger de medirDuracion: [BIB-000X] POST /reservas - 400 X.XX ms

### Diagrama 4: GET /ruta-inexistente (Manejo de 404)
GET /ruta-inexistente
    ↓ morgan("dev")
    ↓ identificarSolicitud
    ↓ medirDuracion
    ↓ expressLayouts
    ↓ express.static
    ↓ express.urlencoded
    ↓ express.json
    ↓ (No coincide con "/" ni "/estado" ni "/reservas")
    ↓ Middleware de 404 final (res.status(404).render("no-encontrado"))
    ↓ Evento 'finish' en res
    ↓ logger de medirDuracion: [BIB-000X] GET /ruta-inexistente - 404 X.XX ms

## Alcance de cada función

- morgan("dev") (Global / Terceros): Registra las peticiones en consola al momento de su llegada.

- identificarSolicitud (Global / Personalizado): Genera un identificador secuencial único con el formato BIB-XXXX y lo guarda en res.locals.solicitudId para que esté disponible globalmente en la aplicación y las vistas EJS.

- medirDuracion (Global / Personalizado): Registra el momento de inicio de la petición y escucha el evento finish del objeto res para calcular y mostrar en consola el tiempo de respuesta total en milisegundos junto al estado HTTP final.

- expressLayouts (Global / Terceros): Permite el uso de un layout base reutilizable (views/layouts/main.ejs).

- express.static (Global / Incorporado): Sirve los recursos estáticos como el archivo CSS situado en la carpeta /public.

- express.urlencoded y express.json (Global / Incorporado): Procesan y transforman los datos recibidos en el cuerpo del request creando el objeto req.body.

- reservasRouter (Router / Middleware de grupo): Define el prefijo /reservas e inyecta la variable global res.locals.seccion para todas las subrutas de reservas.

- validarReserva (Ruta / Personalizado): Middleware específico para el método POST /reservas que sanitiza inputs y valida reglas de negocio antes de permitir el registro.

- crearReserva (Ruta / Handler): Controlador final que asigna un ID autoincremental, almacena el objeto validado en el arreglo de memoria y fuerza la redirección 302.

- Middleware 404 (Global / Personalizado): Captura cualquier petición cuya ruta no haya hecho match con las definidas previamente y muestra la pantalla de error correspondiente.

## Validación

1. El middleware validarReserva ejecuta las siguientes verificaciones en el servidor:

2. Normalización de cadenas eliminando espacios al inicio y final mediante .trim().

3. Conversión explícita del campo personas a tipo numérico con Number().

4. Comprobación de que ningún campo obligatorio se encuentre vacío.

5. Verificación de que la sala elegida forme parte del arreglo salasPermitidas.

6. Verificación de que el turno seleccionado pertenezca al arreglo turnosPermitidos.

7. Validación del email comprobando la presencia del carácter @.

8. Control de cantidad de integrantes asegurando que sea un número entero comprendido entre 1 y 6.

9. En caso de error de validación, interrumpe el pipeline devolviendo un código 400 Bad Request, conserva los datos ingresados en req.body y renderiza el mensaje de alerta configurado con role="alert" en la vista EJS.

## Pruebas manuales

1. Creación correcta (POST /reservas):
    - Ir a /reservas/nueva.
    - Completar todos los campos con valores válidos (ej. Estudiante: "Jorge", Email: "jorge@hotmail.com", Sala: "Sala  Norte", Fecha: "2026-10-01", Turno: "Mañana", Personas: 3).
    - Presionar enviar.
    - Resultado esperado: Redirección 302 hacia /reservas, donde debe figurar la nueva reserva agregada al final del    listado.

2. Validación de errores (POST /reservas con datos inválidos):
    - Enviar el formulario dejando el campo email sin el símbolo @ o asignando 10 personas.
    - Resultado esperado: Respuesta HTTP 400, la página permanece en el formulario mostrando la caja de alerta con role="alert" y conservando los datos previamente tipeados.

3. Navegación a ruta no existente (404):
    - Ingresar a http://localhost:3000/ruta-inexistente o /reservas/999.
    - Resultado esperado: Código HTTP 404 y renderizado de la vista no-encontrado.ejs

4. Verificación de logs e identificador:
    - Inspeccionar la consola de ejecución de Node.js tras realizar peticiones.
    - Resultado esperado: Logs formateados con el ID secuencial asignado (ej. [BIB-0001] GET /reservas - 200 3.45 ms).

## Persistencia temporal

Los datos del sistema se gestionan a través de una variable en memoria local (let reservas = [...]). Dado que no se utiliza una base de datos persistente en disco, toda la información creada o modificada durante la ejecución se restablecerá a su estado inicial cada vez que el proceso del servidor Node.js se detenga o reinicie.

## Explicar con palabras propias

### Diferencia entre middleware incorporado, de terceros y personalizado

- Incorporado: Viene incluido por defecto en el propio framework de Express. Y no requiere instalaciones externas (por ej: express.json(), express.urlencoded() o express.static()).

- De terceros: Son módulos desarrollados por la comunidad que deben instalarse previamente mediante NPM como dependencias externas (por ej: morgan o express-ejs-layouts).

- Personalizado: Funciones creadas a medida dentro de nuestro proyecto para resolver una necesidad lógica específica del negocio (por ej: identificarSolicitud o validarReserva).

### ¿Cuándo se utiliza next()?

Se utiliza invocandolo dentro de un middleware cuando este termina de procesar su tarea y desea ceder el control al siguiente middleware o ruta de la cadena. Si no se llama a next() ni se finaliza la respuesta (por ejm, enviando un res.render() o res.json()), la solicitud se queda colgada indefinidamente esperando en el servidor.

### ¿Por qué los parsers aparecen antes de la validación?

Porque los datos cuando se ingresan desde un formulario o en formato JSON viajan en el cuerpo (body) del paquete HTTP de forma cruda/sin procesar. Los parsers (express.urlencoded y express.json) se encargan de leer ese stream y transformarlo en el objeto req.body. Si la validación se ejecutara antes, intentaría leer campos de un objeto que aún no existe (undefined).

### Diferencia entre alcance global, de router y de ruta

- Global (app.use): Se ejecuta obligatoriamente en todas las peticiones HTTP entrantes al servidor, sin importar la URL o el método.

- De Router (router.use): Afecta únicamente a las solicitudes que coincidan con la sección o prefijo donde está montado ese router (por ejemplo, solo a las peticiones que arranquen con /reservas).

- De Ruta (app.post("/ruta", middleware, handler)): Es de alcance específico; únicamente se dispara si coinciden con precisión el método HTTP (POST, GET, etc.) y la URL exacta declarada.


### Motivo del evento finish

El evento finish lo emite el objeto res en el momento exacto en que la respuesta HTTP completa terminó de enviarse al cliente (navegador). Se escucha este evento para poder medir el tiempo total real de procesamiento (desde que llegó la petición hasta que se envió la respuesta) y conocer el código de estado final (res.statusCode), ya que al inicio de la función ese código aún no se ha generado.

### Resultado del montaje del router

Al utilizar app.use("/reservas", reservasRouter), todas las subrutas declaradas de forma relativa dentro del router se concatenan automáticamente con la ruta base. Osea, una subruta escrita como / pasa a responder en /reservas, y una subruta /nueva responde en /reservas/nueva.

### Diferencia entre el POST 302 y el GET posterior:

- El POST 302: Recibe los datos del formulario, procesa la lógica en el backend (crea la reserva) y responde al navegador con un código de estado 302 Found junto con una cabecera de ubicación (Location: /reservas). No devuelve HTML.

- El GET posterior: Es una nueva solicitud independiente que realiza el navegador de forma automática tras recibir la redirección 302, pidiendo la URL /reservas con método GET para renderizar la pantalla con el listado actualizado (patrón Post/Redirect/Get).

### Motivo por el cual las altas desaparecen al reiniciar:

Porque los datos registrados se están guardando únicamente en una variable en la memoria RAM del servidor (let reservas = [...]). Como la RAM es un almacenamiento volátil, cuando el proceso de Node.js se cierra o se reinicia, la memoria se libera por completo y la variable vuelve a inicializarse con los datos estáticos que quedaron definidos en el código fuente.