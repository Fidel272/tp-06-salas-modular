const express = require("express");
const path = require("node:path");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const app = express();
const PORT = 3000;

const salasPermitidas = [
    "Sala Norte",
    "Sala Sur",
    "Sala Multimedia"
];

const turnosPermitidos = [
    "Mañana",
    "Tarde",
    "Noche"
];

let reservas = [
    {
        id: 1,
        estudiante: "Juan Ignacio Castro",
        email: "juancastro@hotmail.com",
        sala: "Sala Norte",
        fecha: "2026-09-25",
        turno: "Mañana",
        personas: 3
    },
    {
        id: 2,
        estudiante: "Ana Quintero",
        email: "ana.quintero@gmail.com",
        sala: "Sala Sur",
        fecha: "2026-09-25",
        turno: "Tarde",
        personas: 2
    },
    {
        id: 3,
        estudiante: "Carlos Ríos",
        email: "carlos.rios@hotmail.com",
        sala: "Sala Multimedia",
        fecha: "2026-09-26",
        turno: "Noche",
        personas: 6
    },
    {
        id: 4,
        estudiante: "Lucía Fernández",
        email: "lucia.f@gmail.com",
        sala: "Sala Norte",
        fecha: "2026-09-27",
        turno: "Tarde",
        personas: 1
    }
];

let numeroDeSolicitud = 0;


// ========================================
// MIDDLEWARES GENERALES
// ========================================

function identificarSolicitud(req, res, next) {
    numeroDeSolicitud++;

    const idFormateado = String(numeroDeSolicitud).padStart(4, "0");
    res.locals.solicitudId = `BIB-${idFormateado}`;
    next();
}


function medirDuracion(req, res, next) {
    const inicio = process.hrtime.bigint();

    res.on("finish", () => {
        const duracion =
            Number(process.hrtime.bigint() - inicio) / 1_000_000;

        console.log(
            `duracion: [${res.locals.solicitudId}] ${req.method} ${req.originalUrl} - ${res.statusCode} ${duracion.toFixed(2)} ms`
        );
    });

    next();
}


// ========================================
// MIDDLEWARE DE VALIDACIÓN
// ========================================

function validarReserva(req, res, next) {
    const estudiante = String(req.body.estudiante ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const sala = String(req.body.sala ?? "").trim();
    const fecha = String(req.body.fecha ?? "").trim();
    const turno = String(req.body.turno ?? "").trim();
    const personas = Number(req.body.personas);

    const esSalaValida =
        salasPermitidas.includes(sala);

    const esTurnoValido =
        turnosPermitidos.includes(turno);

    const esEmailValido =
        email.includes("@");

    const esPersonasValidas =
        Number.isInteger(personas) &&
        personas >= 1 &&
        personas <= 6;

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
        return res.status(400).render("reservas/nueva", {
            titulo: "Nueva Reserva",
            error: "Por favor, completá todos los campos correctamente con valores válidos.",
            valores: req.body,
            salasPermitidas,
            turnosPermitidos
        });
    }

    req.reservaValidada = {
        estudiante,
        email,
        sala,
        fecha,
        turno,
        personas
    };

    next();
}


// ========================================
// CREAR RESERVA
// ========================================

function crearReserva(req, res) {
    const ultimoId = reservas.reduce(
        (mayorId, reserva) =>
            Math.max(mayorId, reserva.id),
        0
    );

    reservas.push({
        id: ultimoId + 1,
        ...req.reservaValidada
    });

    res.redirect("/reservas");
}


// ========================================
// CONFIGURACIÓN DE EJS
// ========================================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "..", "views")
);

app.set("layout", "layouts/main");


// ========================================
// MIDDLEWARES GENERALES DE EXPRESS
// ========================================

app.use(morgan("dev"));

app.use(identificarSolicitud);

app.use(medirDuracion);

app.use(expressLayouts);

app.use(
    express.static(
        path.join(__dirname, "..", "public")
    )
);

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(express.json());


// ========================================
// RUTA PRINCIPAL
// ========================================

app.get("/", (req, res) => {
    res.status(200).render("inicio", {
        titulo: "Reservas de salas de estudio"
    });
});


// ========================================
// RUTA DE ESTADO
// ========================================

app.get("/estado", (req, res) => {
    res.status(200).json({
        servicio: "activo",
        reservas: reservas.length,
        solicitudId: res.locals.solicitudId
    });
});


// ========================================
// ROUTER DE RESERVAS
// ========================================

const reservasRouter = express.Router();

// Middleware propio del Router

function prepararAreaReservas(req, res, next) {
    res.locals.seccion = "Reservas de salas";
    next();
}

reservasRouter.use(prepararAreaReservas);

// ========================================
// LISTADO
// GET /reservas
// ========================================

reservasRouter.get("/", (req, res) => {
    res.status(200).render("reservas/lista", {
        titulo: "Listado de Reservas",
        reservas
    });
});


// ========================================
// FORMULARIO
// GET /reservas/nueva
// ========================================

reservasRouter.get("/nueva", (req, res) => {
    res.status(200).render("reservas/nueva", {
        titulo: "Nueva Reserva",
        error: null,
        valores: {},
        salasPermitidas,
        turnosPermitidos
    });
});


// ========================================
// CREAR
// POST /reservas
// ========================================

reservasRouter.post(
    "/",
    validarReserva,
    crearReserva
);


// ========================================
// DETALLE
// GET /reservas/:id
// ========================================

reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);

    const reserva = reservas.find(
        (r) => r.id === id
    );

    if (!reserva) {
        return res.status(404).render("no-encontrado", {
            titulo: "Reserva no encontrada",
            mensaje: `No existe una reserva registrada con el identificador #${req.params.id}.`
        });
    }

    res.status(200).render("reservas/detalle", {
        titulo: `Reserva #${reserva.id}`,
        reserva
    });
});


// ========================================
// MONTAR ROUTER
// ========================================

app.use("/reservas", reservasRouter);


// ========================================
// 404
// ========================================

app.use((req, res) => {
    res.status(404).render("no-encontrado", {
        titulo: "Página no encontrada",
        mensaje: "La dirección solicitada no existe."
    });
});


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
    console.log(
        `Aplicación disponible en http://localhost:${PORT}`
    );
});