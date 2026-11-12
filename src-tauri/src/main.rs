#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const INDEX_FILE: &str = "index.json";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProjectMeta {
    id: String,
    name: String,
    file_path: String,
    external: bool,
    created_at: u64,
    updated_at: u64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase", default)]
struct AppSettings {
    default_export_path: String,
    theme: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_export_path: String::new(),
            theme: default_theme(),
        }
    }
}

fn default_theme() -> String {
    "system".to_string()
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn app_root(app: &AppHandle) -> Result<PathBuf, String> {
    app.path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Cannot resolve the application data directory".to_string())
}

fn projects_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join("projects"))
}

fn index_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app_root(app)?.join(INDEX_FILE))
}

fn read_index(app: &AppHandle) -> Vec<ProjectMeta> {
    let path = match index_path(app) {
        Ok(path) => path,
        Err(_) => return Vec::new(),
    };
    match fs::read_to_string(path) {
        Ok(raw) => serde_json::from_str(&raw).unwrap_or_default(),
        Err(_) => Vec::new(),
    }
}

fn write_index(app: &AppHandle, list: &[ProjectMeta]) -> Result<(), String> {
    let dir = projects_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(list).map_err(|e| e.to_string())?;
    fs::write(index_path(app)?, raw).map_err(|e| e.to_string())
}

fn split_extension(name: &str) -> (String, String) {
    if let Some(pos) = name.rfind('.') {
        let ext = &name[pos..];
        if pos > 0 && ext.len() <= 12 && ext[1..].chars().all(|c| c.is_ascii_alphanumeric()) {
            return (name[..pos].to_string(), ext.to_string());
        }
    }
    (name.to_string(), String::new())
}

fn unique_name(existing: &[ProjectMeta], base: &str) -> String {
    let base = base.trim();
    let base = if base.is_empty() { "untitled.json" } else { base };
    let taken: HashSet<String> = existing.iter().map(|p| p.name.to_lowercase()).collect();
    if !taken.contains(&base.to_lowercase()) {
        return base.to_string();
    }
    let (stem, ext) = split_extension(base);
    let mut index = 1;
    loop {
        let candidate = format!("{}{}{}", stem, index, ext);
        if !taken.contains(&candidate.to_lowercase()) {
            return candidate;
        }
        index += 1;
    }
}

#[tauri::command]
fn list_projects(app: AppHandle) -> Vec<ProjectMeta> {
    let mut list = read_index(&app);
    list.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    list
}

#[tauri::command]
fn create_project(app: AppHandle, default_name: String) -> Result<ProjectMeta, String> {
    let mut list = read_index(&app);
    let name = unique_name(&list, &default_name);
    let id = uuid::Uuid::new_v4().to_string();
    let dir = projects_dir(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let file_path = dir.join(format!("{}.json", id));
    fs::write(&file_path, "{}").map_err(|e| e.to_string())?;

    let now = now_ms();
    let meta = ProjectMeta {
        id,
        name,
        file_path: file_path.to_string_lossy().into_owned(),
        external: false,
        created_at: now,
        updated_at: now,
    };
    list.push(meta.clone());
    write_index(&app, &list)?;
    Ok(meta)
}

#[tauri::command]
fn register_external_file(app: AppHandle, path: String) -> Result<ProjectMeta, String> {
    let trimmed = path.trim().trim_matches('"');
    let original = PathBuf::from(trimmed);
    if !original.is_file() {
        return Err(format!("File not found: {}", trimmed));
    }
    let canonical = fs::canonicalize(&original)
        .unwrap_or(original)
        .to_string_lossy()
        .into_owned();

    let mut list = read_index(&app);
    if let Some(existing) = list
        .iter()
        .find(|p| p.file_path.eq_ignore_ascii_case(&canonical))
    {
        return Ok(existing.clone());
    }

    let file_name = Path::new(&canonical)
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_else(|| "untitled.json".to_string());
    let name = unique_name(&list, &file_name);
    let now = now_ms();
    let meta = ProjectMeta {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        file_path: canonical,
        external: true,
        created_at: now,
        updated_at: now,
    };
    list.push(meta.clone());
    write_index(&app, &list)?;
    Ok(meta)
}

#[tauri::command]
fn read_project(app: AppHandle, id: String) -> Result<String, String> {
    let list = read_index(&app);
    let meta = list
        .iter()
        .find(|p| p.id == id)
        .ok_or_else(|| "Project not found".to_string())?;
    fs::read_to_string(&meta.file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_project(app: AppHandle, id: String, content: String) -> Result<ProjectMeta, String> {
    let mut list = read_index(&app);
    let index = list
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| "Project not found".to_string())?;
    fs::write(&list[index].file_path, content).map_err(|e| e.to_string())?;
    list[index].updated_at = now_ms();
    let meta = list[index].clone();
    write_index(&app, &list)?;
    Ok(meta)
}

#[tauri::command]
fn rename_project(app: AppHandle, id: String, next_name: String) -> Result<ProjectMeta, String> {
    let mut list = read_index(&app);
    let index = list
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| "Project not found".to_string())?;
    let others: Vec<ProjectMeta> = list
        .iter()
        .filter(|p| p.id != id)
        .cloned()
        .collect();
    let name = unique_name(&others, &next_name);
    list[index].name = name;
    list[index].updated_at = now_ms();
    let meta = list[index].clone();
    write_index(&app, &list)?;
    Ok(meta)
}

#[tauri::command]
fn delete_project(app: AppHandle, id: String) -> Result<(), String> {
    let mut list = read_index(&app);
    let Some(index) = list.iter().position(|p| p.id == id) else {
        return Ok(());
    };
    let meta = list.remove(index);
    write_index(&app, &list)?;
    if !meta.external {
        let _ = fs::remove_file(&meta.file_path);
    }
    Ok(())
}

#[tauri::command]
fn get_settings(app: AppHandle) -> AppSettings {
    let path = match app_root(&app) {
        Ok(dir) => dir.join(SETTINGS_FILE),
        Err(_) => return AppSettings::default(),
    };
    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str::<AppSettings>(&raw).ok())
        .unwrap_or_default()
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    let dir = app_root(&app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let raw = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(dir.join(SETTINGS_FILE), raw).map_err(|e| e.to_string())?;
    Ok(settings)
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    let target = PathBuf::from(path);
    if let Some(parent) = target.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    fs::write(target, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_startup_path() -> Option<String> {
    std::env::args().skip(1).find_map(|arg| {
        let candidate = arg.trim().trim_matches('"');
        let path = Path::new(candidate);
        let is_json = path
            .extension()
            .map(|ext| ext.eq_ignore_ascii_case("json"))
            .unwrap_or(false);
        if is_json && path.is_file() {
            Some(candidate.to_string())
        } else {
            None
        }
    })
}

/// Language chosen in the installer (en / zhcn / zhtw / …). The installer
/// writes it next to the executable so every user of the machine gets the same
/// first-run language, regardless of which account ran the setup. The frontend
/// only applies it while the user has never picked a language manually.
const INSTALL_LANGUAGE_FILE: &str = "install-language.txt";

#[tauri::command]
fn get_installer_language() -> Option<String> {
    let exe = std::env::current_exe().ok()?;
    let dir = exe.parent()?;
    let raw = fs::read_to_string(dir.join(INSTALL_LANGUAGE_FILE)).ok()?;
    let value = raw.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_projects,
            create_project,
            register_external_file,
            read_project,
            write_project,
            rename_project,
            delete_project,
            get_settings,
            save_settings,
            read_text_file,
            write_text_file,
            get_startup_path,
            get_installer_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running jsontool");
}
