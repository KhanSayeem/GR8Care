const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const centerScript = path.join(__dirname, 'center-android-emulator.ps1');

if (isWindows) {
  spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      centerScript,
      '-WaitSeconds',
      '3',
      '-StabilizeSeconds',
      '1',
    ],
    { stdio: 'ignore' },
  );

  spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      centerScript,
      '-WaitSeconds',
      '90',
      '-StabilizeSeconds',
      '15',
    ],
    {
      detached: true,
      stdio: 'ignore',
    },
  ).unref();
}

const expoBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  isWindows ? 'expo.cmd' : 'expo',
);

function getUsedPorts() {
  const result = isWindows
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'netstat -ano -p tcp'], {
        encoding: 'utf8',
      })
    : spawnSync('sh', ['-c', 'lsof -nP -iTCP -sTCP:LISTEN || netstat -an -p tcp'], {
        encoding: 'utf8',
      });

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const ports = new Set();
  for (const match of output.matchAll(/(?:127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?|\*)[:.](\d+)/g)) {
    ports.add(Number(match[1]));
  }

  return ports;
}

function findFreePort(startPort) {
  const usedPorts = getUsedPorts();
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error(`Could not find a free Metro port from ${startPort} to ${startPort + 19}.`);
}

async function main() {
  const port = findFreePort(8081);
  const command = fs.existsSync(expoBin) ? expoBin : isWindows ? 'npx.cmd' : 'npx';
  const args = command.includes('npx')
    ? ['expo', 'start', '--android', '--port', String(port)]
    : ['start', '--android', '--port', String(port)];
  const result = isWindows
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'call', command, ...args], {
        stdio: 'inherit',
      })
    : spawnSync(command, args, { stdio: 'inherit' });

  if (result.error) {
    console.error(`Failed to launch Expo: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
