const { Client } = require('pg');

async function test() {
    const c = new Client({ 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
    });

    try {
        await c.connect();
        console.log('✅ CONEXIÓN EXITOSA A NEON');

        const queries = [
            { name: 'PostGIS', sql: "SELECT extname FROM pg_extension WHERE extname='postgis'" },
            { name: 'Tabla Entrenamiento', sql: 'SELECT count(*) FROM "ENTRENAMIENTO"' },
            { name: 'Tabla Deporte', sql: 'SELECT count(*) FROM "DEPORTE"' },
            { name: 'Tabla Usuario Entrenamiento', sql: 'SELECT count(*) FROM "USUARIO_ENTRENAMIENTO"' },
            { name: 'Prueba Geográfica', sql: "SELECT ST_AsText('POINT(-58.38 -34.60)'::geometry) as p" }
        ];

        for (const q of queries) {
            try {
                const r = await c.query(q.sql);
                console.log(`OK [${q.name}] ->`, r.rows[0]);
            } catch (e) {
                console.log(`❌ FAIL [${q.name}] ->`, e.message);
            }
        }
    } catch (e) {
        console.error('FATAL:', e.message);
    } finally {
        await c.end();
    }
}

test();