import { betterAuth } from "better-auth";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let _auth: any | undefined;

export function getAuth() {
  if (_auth) return _auth;

  let secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const m = content.match(/^BETTER_AUTH_SECRET=(.*)$/m);
        if (m) secret = m[1].trim().replace(/^"|"$/g, "");
      }
    } catch (e) {
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
    },
  });

  return _auth;

}

