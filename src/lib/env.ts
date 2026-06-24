// Validación lazy: solo lanza al usar la variable, no al importar.
// Esto permite que `next build` haga page data collection sin .env.local.

function read(key: keyof typeof process.env): string {
  const value = process.env[key];
  if (!value) throw new Error(`Falta variable de entorno: ${key}`);
  return value;
}

export const env = {
  get SUPABASE_URL() {
    return read("NEXT_PUBLIC_SUPABASE_URL");
  },
  get SUPABASE_ANON_KEY() {
    return read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";
  },
};

export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
};
