export function fixturesEnabled() {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV === "development" || process.env.COPTLE_DEV_FIXTURES === "1";
}

export function reviewedPlayEnabled() {
  return process.env.COPTLE_REVIEWED_PLAY === "1";
}
