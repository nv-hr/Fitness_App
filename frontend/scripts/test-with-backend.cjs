/**
 * Starts the backend, waits for it to be ready, runs vitest, then stops the backend.
 */
const { fork, execSync } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.resolve(__dirname, '../../backend');
const PORT = 3001;
const API_BASE = `http://localhost:${PORT}`;

function killPort(port) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', timeout: 2000 });
    for (const line of stdout.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const address = parts[1];
        const pid = parts[parts.length - 1];
        if ((address === `0.0.0.0:${port}` || address === `127.0.0.1:${port}`) && pid && pid !== '0') {
          try { execSync(`taskkill /F /PID ${pid}`, { timeout: 2000 }); } catch { }
        }
      }
    }
  } catch { }
}

function waitForBackend(timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function poll() {
      if (Date.now() - start >= timeout) return reject(new Error('Backend did not start'));
      fetch(`${API_BASE}/api/auth/me`)
        .then(res => {
          if ((res.headers.get('content-type') || '').includes('application/json')) resolve();
          else setTimeout(poll, 300);
        })
        .catch(() => setTimeout(poll, 300));
    }
    setTimeout(poll, 500);
  });
}

async function main() {
  console.log('[test] Killing stale backend on port 3001...');
  killPort(PORT);
  await new Promise(r => setTimeout(r, 500));

  console.log('[test] Starting backend...');
  const backend = fork(path.join(BACKEND_DIR, 'src/server.js'), [], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'pipe',
    cwd: BACKEND_DIR,
  });

  backend.stdout.on('data', d => process.stdout.write(`[backend] ${d}`));
  backend.stderr.on('data', d => process.stderr.write(`[backend:err] ${d}`));
  backend.on('error', e => { console.error('[test] Backend error:', e.message); process.exit(1); });
  backend.on('exit', (code, signal) => console.log(`[test] Backend exited code=${code} signal=${signal}`));

  try {
    console.log('[test] Waiting for backend...');
    await waitForBackend();
    console.log('[test] Backend ready');
  } catch (e) {
    console.error('[test] Backend failed to start:', e.message);
    backend.kill();
    process.exit(1);
  }

  console.log('[test] Running vitest...');
  const vitest = fork(
    path.resolve(__dirname, '../node_modules/vitest/vitest.mjs'),
    ['run', ...process.argv.slice(2)],
    {
      env: { ...process.env, NODE_ENV: 'test', VITE_SKIP_BACKEND_FORK: 'true' },
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    }
  );

  vitest.on('exit', (code) => {
    console.log('[test] Stopping backend...');
    backend.kill();
    process.exit(code || 0);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
