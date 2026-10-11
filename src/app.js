// express: framework web sobre Node.js. Nos da app, rutas, middleware, etc.
const express = require("express");
// path sirve para construir rutas de archivos de forma segura entre sistemas operativos.
const path = require("node:path");
const expressLayouts = require("express-ejs-layouts");
// morgan: middleware de logging HTTP. Registra cada request en consola.
// Acepta un "formato" como parámetro ("dev", "combined", etc).
const morgan = require("morgan");

//Fábricas
const {
  identificarSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");

const { crearControladorReservas } = require("./controladores/reservas");

const { crearRouterReservas } = require("./rutas/reservas");

function crearApp({ servicioReservas, formatoRegistro }) {
  const app = express();
  // Crea el controlador pasándole el servicio (inyección de dependencias).
  const controladorReservas = crearControladorReservas(servicioReservas);
  // Crea el router pasándole el controlador (otra inyección).
  const reservasRouter = crearRouterReservas(controladorReservas);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  // express-ejs-layouts usa esta vista como layout principal.
  // Ahí van el <html>, <head>, <body> comunes a todas las páginas.
  app.set("layout", "layouts/main");
  // ---- Middlewares globales (se ejecutan en orden) ----
  app.use(morgan(formatoRegistro));
  app.use(identificarSolicitud);
  app.use(medirDuracion);
  app.use(expressLayouts);
  app.use(express.static(path.join(__dirname, "..", "public")));
  // Parsea bodies de formularios HTML (application/x-www-form-urlencoded).
  // extended: false usa el parser simple (querystring), no qs.
  app.use(express.urlencoded({ extended: false }));
  // Parsea bodies JSON (application/json). Muy usado en APIs.
  app.use(express.json());

  // GET / → renderiza la vista "inicio" con EJS y le pasa datos.
  app.get("/", (req, res) => {
    res.status(200).render("inicio", {
      titulo: "Reservas de salas de estudio",
    });
  });

  //  Devuelve si el servicio está activo, cuántas reservas hay y el ID de la solicitud.
  app.get("/estado", (req, res) => {
    res.status(200).json({
      servicio: "activo",
      reservas: servicioReservas.contar(),
      solicitudId: res.locals.solicitudId,
    });
  });

  // Monta el router de reservas en /reservas.
  // Cualquier ruta definida dentro del router se prefija con /reservas.
  app.use("/reservas", reservasRouter);

  // Si ninguna ruta anterior respondió, caemos acá.
  // Se registra al final para que Express lo use solo si nada matcheó antes.
  app.use((req, res) => {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  // Devolvemos la app configurada, lista para escuchar.
  return app;
}

// Exportamos la factory para usarla desde el entry point (ej: index.js o server.js).
module.exports = { crearApp };
