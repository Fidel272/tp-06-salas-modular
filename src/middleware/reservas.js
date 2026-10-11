const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];

const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {
  // Sanitización de cadenas: convierte a String, maneja null/undefined con ?? y remueve espacios en los extremos con .trim()
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  // Conversión explícita a tipo numérico
  const personas = Number(req.body.personas);
  // Reglas de validación
  const esSalaValida = salasPermitidas.includes(sala);
  const esTurnoValido = turnosPermitidos.includes(turno);
  const esEmailValido = email.includes("@");
  const esPersonasValidas =
    Number.isInteger(personas) && personas >= 1 && personas <= 6;

  // Evaluador de errores: comprueba presencia de obligatorios y validez de reglas
  if (
    !estudiante ||
    !email ||
    !esEmailValido ||
    !sala ||
    !esSalaValida ||
    !fecha ||
    !turno ||
    !esTurnoValido ||
    !esPersonasValidas
  ) {
    // Si hay error, detiene el pipeline, responde 400 y vuelve a renderizar el formulario conservando los valores ingresados
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error:
        "Por favor, completá todos los campos correctamente con valores válidos.",
      valores: req.body,
      salasPermitidas,
      turnosPermitidos,
    });
  }

  // Si la validación es exitosa, empaqueta el objeto sanitizado en la solicitud (req)
  req.reservaValidada = { estudiante, email, sala, fecha, turno, personas };

  next();
}

module.exports = {
  salasPermitidas,
  turnosPermitidos,
  prepararAreaReservas,
  validarReserva,
};
