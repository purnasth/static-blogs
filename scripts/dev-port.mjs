/**
 * Starts `next dev` on the first FREE port, scanning upward from a base.
 *
 * Why this exists: `next dev -p <port>` dies with EADDRINUSE if the port is
 * taken, and with several modules running at once something always is. Next's
 * own auto-increment only happens when no `-p` is passed at all, and then it
 * starts from 3000 — which is the port we're trying to stay away from.
 *
 * Base port: $PORT, else 5050. See TODO.md — the 5050 default is temporary.
 */
import net from "node:net";
import { spawn } from "node:child_process";

const BASE = Number(process.env.PORT) || 5050;
const ATTEMPTS = 40;

function canBind(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

/**
 * A port is usable only if it's free on both stacks — Next binds IPv6 `::`.
 * The two probes must run SEQUENTIALLY: binding `::` is dual-stack, so a
 * concurrent `0.0.0.0` probe would collide with our own listener and report
 * every port as busy.
 */
async function isFree(port) {
  return (await canBind(port, "::")) && (await canBind(port, "0.0.0.0"));
}

let port = null;
for (let i = 0; i < ATTEMPTS; i++) {
  if (await isFree(BASE + i)) {
    port = BASE + i;
    break;
  }
}

if (port === null) {
  console.error(`\nNo free port between ${BASE} and ${BASE + ATTEMPTS - 1}.`);
  console.error(`Pick another range with:  PORT=7000 pnpm dev\n`);
  process.exit(1);
}

if (port !== BASE) {
  console.log(`\n  Port ${BASE} is busy — using ${port} instead.\n`);
}

const child = spawn("next", ["dev", "-p", String(port)], { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
