export function fixturesEnabled() {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV === "development" || process.env.COPTLE_DEV_FIXTURES === "1";
}
