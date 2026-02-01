export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function optEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}
