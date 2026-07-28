import { invoke } from "@tauri-apps/api/core"
import type { LoginResponse, SessionInfo, AppSetting } from "@/types"

export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version")
}

export async function healthCheck(): Promise<string> {
  return invoke<string>("health_check")
}

export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name })
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return invoke<LoginResponse>("login", { username, password })
}

export async function logout(token: string): Promise<void> {
  return invoke<void>("logout", { token })
}

export async function getCurrentUser(token: string): Promise<SessionInfo> {
  return invoke<SessionInfo>("get_current_user", { token })
}

export async function checkSession(token: string): Promise<boolean> {
  return invoke<boolean>("check_session", { token })
}

export async function getUserPermissionsList(token: string): Promise<string[]> {
  return invoke<string[]>("get_user_permissions_list", { token })
}

export async function getSettings(): Promise<AppSetting[]> {
  return invoke<AppSetting[]>("get_settings")
}

export async function getSetting(key: string): Promise<AppSetting | null> {
  return invoke<AppSetting | null>("get_setting", { key })
}

export async function updateSetting(key: string, value: string): Promise<void> {
  return invoke<void>("update_setting", { key, value })
}

export async function getSettingsByGroup(group: string): Promise<AppSetting[]> {
  return invoke<AppSetting[]>("get_settings_by_group", { group })
}
