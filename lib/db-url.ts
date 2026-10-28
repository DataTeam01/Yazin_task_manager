/**
 * Parses a Postgres connection string whose password may contain unescaped
 * characters such as "@" (the credentials end at the LAST "@").
 */
export interface DbConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export function parseDbUrl(raw: string): DbConfig {
  const match = /^postgres(?:ql)?:\/\/(.+)@([^@/]+)\/([^?]+)/.exec(raw.trim());
  if (!match) throw new Error("DB_URL is not a valid postgres:// connection string");
  const [, credentials = "", hostPort = "", database = ""] = match;
  const colon = credentials.indexOf(":");
  const user = credentials.slice(0, colon);
  const password = credentials.slice(colon + 1);
  const [host = "", port = "5432"] = hostPort.split(":");
  return { user, password, host, port: Number(port), database };
}
