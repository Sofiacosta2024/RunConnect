import { betterAuth } from "better-auth";
import fs from "fs";
import path from "path";

import { pool } from "@/lib/db"; 

let _auth: any | undefined;

export function getAuth() {
	if (_auth) return _auth;

	let secret = process.env.BETTER_AUTH_SECRET;

	if (!secret) {
		try {
			const envPath = path.resolve(process.cwd(), ".env");
			if (fs.existsSync(envPath)) {
				const content = fs.readFileSync(envPath, "utf8");
				const match = content.match(/^BETTER_AUTH_SECRET=(.*)$/m);
				if (match) secret = match[1].trim().replace(/^"|"$/g, "");
			}
		} catch (error) {
			// ignore
		}
	}

	if (!secret) {
		throw new Error(
			"BETTER_AUTH_SECRET is required. Set BETTER_AUTH_SECRET in your .env (generate with `npx auth secret` or `openssl rand -base64 32`)."
		);
	}

	_auth = betterAuth({
		baseURL: process.env.BETTER_AUTH_URL,
		secret,
		database: pool,
		socialProviders: {
			google: {
				clientId: process.env.GOOGLE_CLIENT_ID ?? "",
				clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			},
		}, /*
		databaseHooks: {
			user: {
				create: {
					after: async (user: { email: string; name?: string }) => {
						await pool.query(
							`INSERT INTO "USUARIO" (email, nombre, rol) VALUES ($1, $2, 'usuario') ON CONFLICT (email) DO NOTHING`,
							[user.email, user.name ?? user.email]
						);
					},
				},
			},
			session: {
				create: {
					before: async (session) => {
						const userResult = await pool.query(
							`SELECT email FROM "user" WHERE id = $1`,
							[session.userId]
						);
						if (userResult.rows.length === 0) return;
						const email = userResult.rows[0].email;
						const result = await pool.query(
							`SELECT suspendido FROM "USUARIO" WHERE email = $1`,
							[email]
						);
						if (result.rows.length > 0 && result.rows[0].suspendido) {
							return false;
						}
					},
				},
			},
		},*/
	});

	// _auth.$context.then((ctx: any) => ctx.runMigrations()).catch(console.error);

	return _auth;
}