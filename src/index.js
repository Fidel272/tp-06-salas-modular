const { leerConfiguracion } = require("./configuracion");
const { crearServicioReservas } = require("./servicios/reservas");

// Importa la factory de la app Express (capa web).
const { crearApp } = require("./app");

// Datos "semilla": reservas precargadas para no arrancar con la lista vacía.
const reservasIniciales = [
  {
    id: 1,
    estudiante: "Juan Ignacio Castro",
    email: "juancastro@hotmail.com",
    sala: "Sala Norte",
    fecha: "2026-09-25",
    turno: "Mañana",
    personas: 3,
  },
  {
    id: 2,
    estudiante: "Ana Quintero",
    email: "ana.quintero@gmail.com",
    sala: "Sala Sur",
    fecha: "2026-09-25",
    turno: "Tarde",
    personas: 2,
  },
  {
    id: 3,
    estudiante: "Carlos Ríos",
    email: "carlos.rios@hotmail.com",
    sala: "Sala Multimedia",
    fecha: "2026-09-26",
    turno: "Noche",
    personas: 6,
  },
  {
    id: 4,
    estudiante: "Lucía Fernández",
    email: "lucia.f@gmail.com",
    sala: "Sala Norte",
    fecha: "2026-09-27",
    turno: "Tarde",
    personas: 1,
  },
];

const { puerto, formatoRegistro } = leerConfiguracion();

// Crea el servicio inyectándole los datos iniciales.
// El servicio encapsula la lógica: contar, listar, crear reservas, etc.
const servicioReservas = crearServicioReservas(reservasIniciales);

// Crea la app Express inyectándole las dependencias que necesita.
// Acá se conecta todo: el servicio y el formato de logs entran en crearApp.
const app = crearApp({ servicioReservas, formatoRegistro });

// El callback se ejecuta una sola vez, cuando el server está listo para recibir requests.
app.listen(puerto, () => {
  console.log(`Aplicación disponible en http://localhost:${puerto}`);
});
