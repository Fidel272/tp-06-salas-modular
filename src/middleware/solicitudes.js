let numeroDeSolicitud = 0;

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud++;
  const idFormateado = String(numeroDeSolicitud).padStart(4, "0");
  // Almacena el ID formateado en res.locals para que esté disponible globalmente
  // en los siguientes middlewares, controladores y vistas EJS de esta petición
  res.locals.solicitudId = `BIB-${idFormateado}`;
  next();
}

function medirDuracion(req, res, next) {
  // Registra la marca de tiempo exacta de inicio usando nanosegundos de alta precisión (BigInt)
  const inicio = process.hrtime.bigint();
  // Registra un evento que se ejecutará únicamente cuando la respuesta HTTP se haya enviado completa al cliente
  res.on("finish", () => {
    // Calcula la diferencia de tiempo entre el final y el inicio
    const duracion = Number(process.hrtime.bigint() - inicio) / 1_000_000;
    console.log(
      `duracion: [${res.locals.solicitudId}] ${req.method} ${req.originalUrl} - ${res.statusCode} ${duracion.toFixed(2)} ms`,
    );
  });
  next();
}

// Exporta los middlewares utilizando CommonJS para poder utilizarlos en app.js
module.exports = {
  identificarSolicitud,
  medirDuracion,
};
