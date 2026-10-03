import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';

const MAX_CODE_SIZE = 1024 * 1024;
const MAX_OUTPUT_SIZE = 1024 * 1024;
const EXECUTION_TIMEOUT_MS = 30_000;
const RUNTIME_SETUP_TIMEOUT_MS = 15 * 60_000;

const runProcess = (
  command,
  args,
  { cwd, stdin, nodeRuntime = false, env = process.env },
) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: nodeRuntime ? { ...env, ELECTRON_RUN_AS_NODE: '1' } : env,
    });

    let stdout = '';
    let stderr = '';
    let outputExceeded = false;
    let timedOut = false;
    let settled = false;
    let outputBytes = 0;
    const stdoutDecoder = new StringDecoder('utf8');
    const stderrDecoder = new StringDecoder('utf8');

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, EXECUTION_TIMEOUT_MS);

    const appendOutput = (target, chunk) => {
      outputBytes += Buffer.byteLength(chunk);
      if (outputBytes > MAX_OUTPUT_SIZE) {
        outputExceeded = true;
        child.kill();
        return;
      }
      if (target === 'stdout') stdout += stdoutDecoder.write(chunk);
      else stderr += stderrDecoder.write(chunk);
    };

    child.stdout.on('data', chunk => appendOutput('stdout', chunk));
    child.stderr.on('data', chunk => appendOutput('stderr', chunk));
    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stdout += stdoutDecoder.end();
      stderr += stderrDecoder.end();
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? (timedOut || outputExceeded ? 1 : null),
        timedOut,
        outputExceeded,
        signal,
      });
    });

    child.stdin.end(stdin);
  });

const runFirstAvailable = async (commands, args, options) => {
  let lastMissingRuntime;

  for (const command of commands) {
    try {
      return await runProcess(command, args, options);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      lastMissingRuntime = error;
    }
  }

  throw lastMissingRuntime || new Error('No compatible runtime was found.');
};

const runSetupProcess = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, RUNTIME_SETUP_TIMEOUT_MS);

    const collect = (target, chunk) => {
      const text = chunk.toString('utf8').slice(0, 256 * 1024);
      if (target === 'stdout') stdout += text;
      else stderr += text;
    };

    child.stdout.on('data', chunk => collect('stdout', chunk));
    child.stderr.on('data', chunk => collect('stderr', chunk));
    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error('Runtime setup exceeded the 15-minute time limit.'));
        return;
      }
      if (signal) {
        reject(new Error(`Runtime setup was interrupted (${signal}).`));
        return;
      }
      if (exitCode !== 0) {
        const details = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n');
        reject(new Error(
          `Runtime setup failed with exit code ${exitCode}.${details ? `\n${details}` : ''}`
        ));
        return;
      }
      resolve({ stdout, stderr });
    });
  });

const fileExists = async filePath => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
};

const msys2Roots = () => [
  process.env.MSYS2_ROOT,
  'C:\\msys64',
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'MSYS2'),
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'msys64'),
  process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'MSYS2'),
].filter(Boolean);

const withRuntimePath = directories => {
  const pathKey = Object.keys(process.env).find(
    key => key.toLowerCase() === 'path',
  ) || 'PATH';
  return {
    ...process.env,
    [pathKey]: [
      ...directories,
      process.env[pathKey],
    ].filter(Boolean).join(path.delimiter),
  };
};

const findMsys2Root = async () => {
  for (const root of msys2Roots()) {
    if (await fileExists(path.join(root, 'usr', 'bin', 'bash.exe'))) return root;
  }
  return null;
};

const javaHomes = async () => {
  const executableExtension = process.platform === 'win32' ? '.exe' : '';
  const compilerName = `javac${executableExtension}`;
  const roots = [
    process.env.JAVA_HOME,
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Eclipse Adoptium'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Java'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Eclipse Adoptium'),
  ].filter(Boolean);
  const homes = [];

  for (const root of roots) {
    if (await fileExists(path.join(root, 'bin', compilerName))) {
      homes.push(root);
      continue;
    }
    let entries;
    try {
      entries = await fs.readdir(root, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') continue;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const home = path.join(root, entry.name);
      if (await fileExists(path.join(home, 'bin', compilerName))) homes.push(home);
    }
  }
  return [...new Set(homes)];
};

export async function installCodeRuntime(language) {
  if (process.platform !== 'win32') {
    throw new Error('In-app runtime installation is currently available only on Windows.');
  }
  if (language !== 'cpp' && language !== 'java') {
    throw new Error('Runtime installation is only available for C++ and Java.');
  }

  await runSetupProcess('winget.exe', [
    'install',
    '--id',
    language === 'cpp' ? 'MSYS2.MSYS2' : 'EclipseAdoptium.Temurin.21.JDK',
    '--exact',
    '--accept-source-agreements',
    '--accept-package-agreements',
    '--disable-interactivity',
  ]);

  if (language === 'cpp') {
    const root = await findMsys2Root();
    if (!root) {
      throw new Error('MSYS2 installation completed, but its installation folder could not be found. Restart the app and try again.');
    }
    const bash = path.join(root, 'usr', 'bin', 'bash.exe');
    for (const command of [
      'pacman -Syu --noconfirm',
      'pacman -Syu --noconfirm',
      'pacman -S --needed --noconfirm mingw-w64-ucrt-x86_64-gcc',
    ]) {
      await runSetupProcess(bash, ['--login', '-c', command]);
    }
    if (!await fileExists(path.join(root, 'ucrt64', 'bin', 'g++.exe'))) {
      throw new Error('MSYS2 setup finished, but the C++ compiler was not found in its UCRT64 toolchain.');
    }
    return 'C++ compiler (GCC) installed successfully.';
  }

  if ((await javaHomes()).length === 0) {
    throw new Error('The JDK installer finished, but javac could not be found. Restart Windows and try again.');
  }
  return 'Java JDK installed successfully.';
}

const resultWithRuntimeError = (language, error) => {
  if (error.code === 'ENOENT') {
    const runtimes = {
      python: 'Python 3',
      c: 'a C compiler (gcc or clang)',
      cpp: 'a C++ compiler (g++ or clang++)',
      java: 'the Java JDK (javac and java)',
      javascript: 'Node.js',
    };
    return {
      stdout: '',
      stderr: `Cannot run this program because ${runtimes[language]} was not found. Install it and make sure it is available on PATH.`,
      exitCode: 1,
      timedOut: false,
      outputExceeded: false,
    };
  }
  throw error;
};

const executionResult = result => {
  if (result.timedOut) {
    result.stderr += `${result.stderr ? '\n' : ''}Program stopped after the 30-second execution limit.`;
  }
  if (result.outputExceeded) {
    result.stderr += `${result.stderr ? '\n' : ''}Program stopped after exceeding the 1 MB output limit.`;
  }
  return result;
};

export async function runCode({ language, code, stdin = '' }) {
  if (!['javascript', 'python', 'c', 'cpp', 'java'].includes(language)) {
    throw new Error(`Code execution is not supported for ${language}.`);
  }
  if (typeof code !== 'string' || code.length === 0) {
    throw new Error('There is no code to run.');
  }
  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_SIZE) {
    throw new Error('Code exceeds the 1 MB execution limit.');
  }
  if (typeof stdin !== 'string' || Buffer.byteLength(stdin, 'utf8') > MAX_CODE_SIZE) {
    throw new Error('Program input must be text smaller than 1 MB.');
  }

  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'abhishek-code-'));

  try {
    const sourceFile = async name => {
      const sourcePath = path.join(workingDirectory, name);
      await fs.writeFile(sourcePath, code, 'utf8');
      return sourcePath;
    };

    let result;

    if (language === 'javascript') {
      const isEsm = /^\s*(?:import(?:\s|['"{*])|export\s)/m.test(code);
      const filename = isEsm ? 'program.mjs' : 'program.cjs';
      const source = isEsm
        ? `import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n${code}`
        : `(async () => {\n${code}\n})().catch(error => {\n  console.error(error);\n  process.exitCode = 1;\n});`;
      const scriptPath = path.join(workingDirectory, filename);
      await fs.writeFile(scriptPath, source, 'utf8');
      try {
        result = await runProcess(process.execPath, [scriptPath], {
          cwd: workingDirectory,
          stdin,
          nodeRuntime: true,
        });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        result = await runProcess('node', [scriptPath], {
          cwd: workingDirectory,
          stdin,
        });
      }
    } else if (language === 'python') {
      await sourceFile('program.py');
      try {
        result = await runProcess('python', ['program.py'], { cwd: workingDirectory, stdin });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        try {
          result = await runProcess('py', ['-3', 'program.py'], { cwd: workingDirectory, stdin });
        } catch (fallbackError) {
          return resultWithRuntimeError(language, fallbackError);
        }
      }
    } else if (language === 'c' || language === 'cpp') {
      const isCpp = language === 'cpp';
      await sourceFile(isCpp ? 'program.cpp' : 'program.c');
      const executablePath = path.join(
        workingDirectory,
        process.platform === 'win32' ? 'program.exe' : 'program',
      );
      const compilerArgs = isCpp
        ? ['-std=c++17', 'program.cpp', '-o', executablePath]
        : ['-std=c11', 'program.c', '-o', executablePath];
      const compilerNames = isCpp
        ? [
            ...msys2Roots().map(root => path.join(root, 'ucrt64', 'bin', 'g++.exe')),
            'g++',
            'clang++',
          ]
        : [
            ...msys2Roots().map(root => path.join(root, 'ucrt64', 'bin', 'gcc.exe')),
            'gcc',
            'clang',
          ];
      const compilerDirectories = isCpp
        ? msys2Roots().flatMap(root => [
            path.join(root, 'ucrt64', 'bin'),
            path.join(root, 'usr', 'bin'),
          ])
        : [];
      const compilerEnv = withRuntimePath(compilerDirectories);
      let compileResult;

      try {
        compileResult = await runFirstAvailable(
          compilerNames,
          compilerArgs,
          { cwd: workingDirectory, stdin: '', env: compilerEnv },
        );
      } catch (error) {
        return resultWithRuntimeError(language, error);
      }

      if (compileResult.exitCode !== 0 || compileResult.timedOut || compileResult.outputExceeded) {
        return executionResult({
          ...compileResult,
          stdout: '',
          stderr: [compileResult.stdout, compileResult.stderr].filter(Boolean).join('\n'),
        });
      }

      result = await runProcess(executablePath, [], {
        cwd: workingDirectory,
        stdin,
        env: compilerEnv,
      });
    } else {
      const classMatch = code.match(/\bpublic\s+(?:(?:abstract|final|sealed)\s+)?class\s+([A-Za-z_$][\w$]*)/);
      const className = classMatch?.[1] || 'Main';
      const packageMatch = code.match(/^\s*package\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/m);
      const packageName = packageMatch?.[1];
      const sourceDirectory = packageName
        ? path.join(workingDirectory, ...packageName.split('.'))
        : workingDirectory;
      await fs.mkdir(sourceDirectory, { recursive: true });
      await fs.writeFile(path.join(sourceDirectory, `${className}.java`), code, 'utf8');
      const sourcePath = path.relative(workingDirectory, path.join(sourceDirectory, `${className}.java`));
      const homes = await javaHomes();

      let compileResult;
      try {
        compileResult = await runFirstAvailable(
          [
            ...homes.map(home => path.join(
              home,
              'bin',
              `javac${process.platform === 'win32' ? '.exe' : ''}`,
            )),
            'javac',
          ],
          ['-encoding', 'UTF-8', sourcePath],
          { cwd: workingDirectory, stdin: '' },
        );
      } catch (error) {
        return resultWithRuntimeError(language, error);
      }

      if (compileResult.exitCode !== 0 || compileResult.timedOut || compileResult.outputExceeded) {
        return executionResult({
          ...compileResult,
          stdout: '',
          stderr: [compileResult.stdout, compileResult.stderr].filter(Boolean).join('\n'),
        });
      }

      const qualifiedClassName = packageName ? `${packageName}.${className}` : className;
      const javaCommands = [
        ...homes.map(home => path.join(
          home,
          'bin',
          `java${process.platform === 'win32' ? '.exe' : ''}`,
        )),
        'java',
      ];
      result = await runFirstAvailable(
        javaCommands,
        ['-cp', workingDirectory, qualifiedClassName],
        { cwd: workingDirectory, stdin },
      );
    }

    return executionResult(result);
  } catch (error) {
    return resultWithRuntimeError(language, error);
  } finally {
    await fs.rm(workingDirectory, { recursive: true, force: true });
  }
}
