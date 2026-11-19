export function fixturesEnabled() {
  return process.env.NODE_ENV === "development" || process.env.COPTLE_DEV_FIXTURES === "1";
}
