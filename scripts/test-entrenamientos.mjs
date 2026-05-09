const baseUrl = process.env.BASE_URL || "http://localhost:3000";

async function readResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function run(name, request) {
  try {
    const response = await fetch(request.url, request.init);
    const body = await readResponse(response);
    console.log(JSON.stringify({ name, status: response.status, ok: response.ok, body }, null, 2));
    return { response, body };
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          name,
          status: "ERR",
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2
      )
    );
    return { response: null, body: null };
  }
}

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const startDate = tomorrow.toISOString().slice(0, 10);
const startTime = "18:30:00";
const startIso = `${startDate}T${startTime}Z`;
const endIso = `${startDate}T20:30:00Z`;
const limitIso = `${startDate}T16:00:00Z`;

const organizerId = process.env.LOCAL_ORGANIZER_ID;
const jsonHeaders = { "content-type": "application/json" };
const writeHeaders = organizerId
  ? { ...jsonHeaders, "x-organizer-id": organizerId }
  : jsonHeaders;

await run("GET /api/entrenamientos", {
  url: `${baseUrl}/api/entrenamientos`,
  init: { method: "GET" },
});

await run("GET /api/entrenamientos/abc", {
  url: `${baseUrl}/api/entrenamientos/abc`,
  init: { method: "GET" },
});

const postResult = await run("POST /api/entrenamientos (anon)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha: startDate,
      hora: startTime,
      fecha_fin: endIso,
      fecha_limite_inscripcion: limitIso,
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
      cupoMaximo: 20,
    }),
  },
});

await run("POST /api/entrenamientos (fecha_inicio en pasado)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha: "2024-01-01",
      hora: "10:00:00",
      fecha_fin: endIso,
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
    }),
  },
});

await run("POST /api/entrenamientos (fecha_fin antes de inicio)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha: startDate,
      hora: startTime,
      fecha_fin: `${startDate}T17:00:00Z`,
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
    }),
  },
});

await run("POST /api/entrenamientos (limite despues de inicio)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha: startDate,
      hora: startTime,
      fecha_fin: endIso,
      fecha_limite_inscripcion: `${startDate}T19:00:00Z`,
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
    }),
  },
});

await run("POST /api/entrenamientos (sin fecha_fin)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha: startDate,
      hora: startTime,
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
    }),
  },
});

const createdId = postResult?.body?.data?.codigoEntrenamiento;

if (createdId) {
  await run(`PUT /api/entrenamientos/${createdId} (anon)`, {
    url: `${baseUrl}/api/entrenamientos/${createdId}`,
    init: {
      method: "PUT",
      headers: writeHeaders,
      body: JSON.stringify({
        codigoDeporte: "RUN",
        fecha: startDate,
        hora: startTime,
        fecha_fin: endIso,
        fecha_limite_inscripcion: limitIso,
        ubicacion: "POINT(-58.3816 -34.6037)",
        codigoNivel: "INTERMEDIO",
        cupoMaximo: 20,
      }),
    },
  });

  await run(`DELETE /api/entrenamientos/${createdId} (anon)`, {
    url: `${baseUrl}/api/entrenamientos/${createdId}`,
    init: { method: "DELETE", headers: writeHeaders },
  });
}
