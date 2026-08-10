const { spawn, spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const centerScript = path.join(__dirname, 'center-android-emulator.ps1');

if (isWindows) {
  spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', centerScript, '-WaitSeconds', '90'],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
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
const command = require('fs').existsSync(expoBin) ? expoBin : isWindows ? 'npx.cmd' : 'npx';
const args = command.includes('npx') ? ['expo', 'start', '--android'] : ['start', '--android'];
const result = spawnSync(command, args, { stdio: 'inherit', shell: false });

process.exit(result.status ?? 1);
