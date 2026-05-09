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
    return { response: null, body: null };
    );
  }
}

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
      fecha: "2026-05-08",
      hora: "18:30:00",
      ubicacion: "POINT(-58.3816 -34.6037)",
      codigoNivel: "INTERMEDIO",
      cupoMaximo: 20,
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
        fecha: "2026-05-08",
        hora: "18:30:00",
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
