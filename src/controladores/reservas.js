// Importa las constantes de opciones válidas para enviarlas a la vista del formulario
const { salasPermitidas, turnosPermitidos } = require("../middleware/reservas");

function crearControladorReservas(servicioReservas) {
  /**
   * Handler para GET /reservas
   * Obtiene el listado completo desde el servicio y renderiza la vista correspondiente.
   */
  function listar(req, res) {
    res.status(200).render("reservas/lista", {
      titulo: "Listado de Reservas",
      reservas: servicioReservas.listar(),
    });
  }

  /**
   * Handler para GET /reservas/nueva
   * Renderiza el formulario de alta vacio con las opciones de selección de salas y turnos.
   */
  function nueva(req, res) {
    res.status(200).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: null,
      valores: {},
      salasPermitidas,
      turnosPermitidos,
    });
  }

  /**
   * Handler para POST /reservas
   * Persiste la reserva validada a través del servicio y redirige al listado principal.
   */
  function crear(req, res) {
    servicioReservas.crear(req.reservaValidada);
    res.redirect("/reservas");
  }

  /**
   * Handler para GET /reservas/:id
   * Busca una reserva específica por su ID dinámico.
   */
  function detalle(req, res) {
    const id = Number(req.params.id);
    // Consulta la existencia de la reserva en la capa de servicios
    const reserva = servicioReservas.obtenerPorId(id);
    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: `No existe una reserva registrada con el identificador #${req.params.id}.`,
      });
    }
    res.status(200).render("reservas/detalle", {
      titulo: `Reserva #${reserva.id}`,
      reserva,
    });
  }
  // Retorna el objeto que agrupa todos los métodos creados
  return {
    listar,
    nueva,
    crear,
    detalle,
  };
}

// Exportación del constructor de controlador en formato CommonJS
module.exports = {
  crearControladorReservas,
};
