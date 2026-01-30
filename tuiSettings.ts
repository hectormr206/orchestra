import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface TuiSettings {
  parallel: boolean;
  maxConcurrency: number;
  autoApprove: boolean;
  runTests: boolean;
  testCommand: string;
  gitCommit: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
}

const DEFAULT_SETTINGS: TuiSettings = {
  parallel: true,
  maxConcurrency: 3,
  autoApprove: false,
  runTests: false,
  testCommand: 'npm test',
  gitCommit: false,
  notifications: true,
  cacheEnabled: true,
};

/**
 * Obtiene la ruta del archivo de settings
 */
function getSettingsPath(orchestraDir: string = '.orchestra'): string {
  return path.join(orchestraDir, 'tui-settings.json');
}

/**
 * Asegura que el directorio .orchestra exista
 */
async function ensureOrchestraDir(orchestraDir: string = '.orchestra'): Promise<void> {
  if (!existsSync(orchestraDir)) {
    await mkdir(orchestraDir, { recursive: true });
  }
}

/**
 * Carga los settings de la TUI desde disco
 * Si no existe el archivo o es inválido, retorna los defaults
 */
export async function loadTuiSettings(orchestraDir: string = '.orchestra'): Promise<TuiSettings> {
  const settingsPath = getSettingsPath(orchestraDir);

  if (!existsSync(settingsPath)) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const content = await readFile(settingsPath, 'utf-8');
    const savedSettings = JSON.parse(content) as Partial<TuiSettings>;

    return { ...DEFAULT_SETTINGS, ...savedSettings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Guarda los settings de la TUI en disco
 * Crea el directorio .orchestra si no existe
 */
export async function saveTuiSettings(
  settings: TuiSettings,
  orchestraDir: string = '.orchestra'
): Promise<void> {
  await ensureOrchestraDir(orchestraDir);
  const settingsPath = getSettingsPath(orchestraDir);
  await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
}

/**
 * Resetea los settings a sus valores por defecto y los guarda
 */
export async function resetTuiSettings(orchestraDir: string = '.orchestra'): Promise<void> {
  await saveTuiSettings({ ...DEFAULT_SETTINGS }, orchestraDir);
}