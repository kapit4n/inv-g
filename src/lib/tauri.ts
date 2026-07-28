import { invoke } from "@tauri-apps/api/core"

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version")
}

export async function healthCheck(): Promise<string> {
  return invoke<string>("health_check")
}

export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name })
}
