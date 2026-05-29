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

const now = new Date();
const startIso = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
const endIso = new Date(new Date(startIso).getTime() + 2 * 60 * 60 * 1000).toISOString();
const tooSoonIso = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
const tooLongIso = new Date(new Date(startIso).getTime() + 7 * 60 * 60 * 1000).toISOString();

const organizerEmail = process.env.LOCAL_ORGANIZER_EMAIL;
const jsonHeaders = { "content-type": "application/json" };
const writeHeaders = organizerEmail
  ? { ...jsonHeaders, "x-organizer-email": organizerEmail }
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
      fecha_inicio: startIso,
      fecha_fin: endIso,
      estado: "abierto",
      ubicacion: "POINT(-58.3816 -34.6037)",
      nivel: "intermedio",
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
      fecha_inicio: "2024-01-01T10:00:00Z",
      fecha_fin: endIso,
      estado: "abierto",
      ubicacion: "POINT(-58.3816 -34.6037)",
      nivel: "intermedio",
    }),
  },
});

await run("POST /api/entrenamientos (fecha_inicio muy pronto)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha_inicio: tooSoonIso,
      fecha_fin: endIso,
      estado: "abierto",
      ubicacion: "POINT(-58.3816 -34.6037)",
      nivel: "intermedio",
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
      fecha_inicio: startIso,
      fecha_fin: new Date(new Date(startIso).getTime() - 30 * 60 * 1000).toISOString(),
      estado: "abierto",
      ubicacion: "POINT(-58.3816 -34.6037)",
      nivel: "intermedio",
    }),
  },
});

await run("POST /api/entrenamientos (duracion excedida)", {
  url: `${baseUrl}/api/entrenamientos`,
  init: {
    method: "POST",
    headers: writeHeaders,
    body: JSON.stringify({
      codigoDeporte: "RUN",
      fecha_inicio: startIso,
      fecha_fin: tooLongIso,
      estado: "abierto",
      ubicacion: "POINT(-58.3816 -34.6037)",
      nivel: "intermedio",
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
        fecha_inicio: startIso,
        fecha_fin: endIso,
        estado: "abierto",
        ubicacion: "POINT(-58.3816 -34.6037)",
        nivel: "intermedio",
        cupoMaximo: 20,
      }),
    },
  });

  await run(`DELETE /api/entrenamientos/${createdId} (anon)`, {
    url: `${baseUrl}/api/entrenamientos/${createdId}`,
    init: { method: "DELETE", headers: writeHeaders },
  });
}
