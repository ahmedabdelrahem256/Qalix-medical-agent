/* server/windows_app_launcher.js — مشغّل نافذة تطبيق ويندوز المستقلة (بدون شريط متصفح أو نافذة سوداء)
 * متوافق مع ويندوز 32-bit و 64-bit · يعمل 100% أوفلاين بدون أي تبعيات خارجية
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

function findWindowsAppBrowser() {
  const candidates = [
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ].filter(Boolean);

  for (const exe of candidates) {
    try {
      if (fs.existsSync(exe)) return exe;
    } catch (_) {}
  }
  return null;
}

function openWindowsDesktopApp(appUrl, baseDataDir) {
  if (process.platform !== 'win32') return false;
  const browserExe = findWindowsAppBrowser();
  if (browserExe) {
    try {
      const profileDir = path.join(baseDataDir, '.desktop_profile');
      fs.mkdirSync(profileDir, { recursive: true });
      const args = [
        `--app=${appUrl}`,
        '--window-size=1380,860',
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check'
      ];
      spawn(browserExe, args, { detached: true, stdio: 'ignore', windowsHide: false }).unref();
      return { mode: 'standalone_app_window', executable: path.basename(browserExe) };
    } catch (_) {}
  }
  try {
    spawn('cmd.exe', ['/c', 'start', '', appUrl], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    return { mode: 'default_browser_fallback' };
  } catch (_) {
    return { mode: 'failed' };
  }
}

function generateSilentDesktopVbs(batFilename = 'START_AGENTS_MANAGER_PLATFORM.bat') {
  return [
    'Option Explicit',
    'Dim fso, sh, appDir, batPath',
    'Set fso = CreateObject("Scripting.FileSystemObject")',
    'Set sh = CreateObject("WScript.Shell")',
    'appDir = fso.GetParentFolderName(WScript.ScriptFullName)',
    `batPath = fso.BuildPath(appDir, "${batFilename}")`,
    'sh.Environment("PROCESS")("QALIX_SILENT") = "1"',
    'sh.Environment("PROCESS")("AUTO_OPEN_BROWSER") = "1"',
    'sh.CurrentDirectory = appDir',
    'sh.Run """" & batPath & """", 0, False',
    ''
  ].join('\r\n');
}

module.exports = {
  findWindowsAppBrowser,
  openWindowsDesktopApp,
  generateSilentDesktopVbs
};
