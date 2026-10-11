function leerConfiguracion(entorno = process.env) {
  // process.env es un objeto global de Node.js que contiene las variables de entorno.
  const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

  // Si no cumple, lanzamos un error y detenemos la ejecución.
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT debe ser un número entero entre 1 y 65535");
  }

  // Leemos NODE_ENV. Si vale exactamente "production", usamos "combined".}
  // En cualquier otro caso, usamos "dev".
  const formatoRegistro =
    process.env.NODE_ENV === "production" ? "combined" : "dev";

  // Retornamos un objeto con la configuración.
  return { puerto: port, formatoRegistro };
}

module.exports = { leerConfiguracion };
