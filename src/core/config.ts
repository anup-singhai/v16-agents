import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { V16Config, AgentConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.v16');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: V16Config = {
  serverUrl: 'https://api.v16.ai',
  agents: [],
};

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): V16Config {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    if (!Array.isArray(parsed.agents)) parsed.agents = [];
    return parsed;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: V16Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getToken(): string | undefined {
  return loadConfig().token;
}

export function setToken(token: string): void {
  const config = loadConfig();
  config.token = token;
  saveConfig(config);
}

export function getServerUrl(): string {
  return loadConfig().serverUrl;
}

export function setServerUrl(url: string): void {
  const config = loadConfig();
  config.serverUrl = url;
  saveConfig(config);
}

export function getAgents(): AgentConfig[] {
  return loadConfig().agents;
}

export function addAgent(agent: AgentConfig): void {
  const config = loadConfig();
  config.agents.push(agent);
  saveConfig(config);
}

export function removeAgent(agentId: string): boolean {
  const config = loadConfig();
  const before = config.agents.length;
  config.agents = config.agents.filter(a => a.id !== agentId);
  saveConfig(config);
  return config.agents.length < before;
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}
