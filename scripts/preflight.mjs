const env = process.env;

const checks = [
  {
    name: "DATABASE_URL",
    ok: Boolean(env.DATABASE_URL),
    note: "runtime databaseverbinding",
  },
  {
    name: "DIRECT_URL",
    ok: Boolean(env.DIRECT_URL),
    note: "Prisma migrations",
  },
  {
    name: "AUTH_SECRET",
    ok: Boolean(env.AUTH_SECRET && env.AUTH_SECRET.length >= 32),
    note: "minstens 32 tekens",
  },
  {
    name: "APP_URL",
    ok: Boolean(env.APP_URL),
    note: env.APP_URL || "ontbreekt",
  },
  {
    name: "MOLLIE_API_KEY",
    ok: Boolean(env.MOLLIE_API_KEY),
    note: env.MOLLIE_API_KEY?.startsWith("live_") ? "LIVE" : env.MOLLIE_API_KEY ? "TEST" : "ontbreekt",
  },
  {
    name: "Resend",
    ok: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    note: env.RESEND_API_KEY && env.EMAIL_FROM ? "ingesteld" : "RESEND_API_KEY/EMAIL_FROM ontbreekt",
  },
  {
    name: "Supabase Storage",
    ok: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_STORAGE_BUCKET),
    note: "productfoto's",
  },
];

console.log("\nBaskets4areason production preflight\n");
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name.padEnd(22)} ${c.note}`);
}

const productionUrl = env.APP_URL && /^https:\/\//i.test(env.APP_URL) && !/localhost|127\.0\.0\.1/i.test(env.APP_URL);
const runtimePool = env.DATABASE_URL && /:6543\//.test(env.DATABASE_URL) && /pgbouncer=true/i.test(env.DATABASE_URL);

console.log(`\n${productionUrl ? "✓" : "!"} APP_URL productiecheck   ${productionUrl ? "HTTPS productie-URL" : "nog lokaal/niet-HTTPS"}`);
console.log(`${runtimePool ? "✓" : "!"} Supabase runtime pool   ${runtimePool ? "transaction pooler + pgbouncer" : "controleer poort 6543 + pgbouncer=true"}`);

if (checks.some((c) => !c.ok)) process.exitCode = 1;
