// Plattformübergreifende XDG-Pfad-Auflösung für die Config-Datei (Linux/macOS ~/.config, Windows %APPDATA%).
import { homedir, platform } from "node:os";
import { join } from "node:path";

const APP = "classic-imap-smtp-mcp";

export function defaultConfigPath(): string {
  if (platform() === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(appData, APP, "config.toml");
  }
  const xdg = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(xdg, APP, "config.toml");
}
