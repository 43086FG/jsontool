# Third-party notices / 第三方组件与素材授权说明

jsontool 以 MIT 许可证开源（见 `LICENSE`）。下列第三方组件与素材按各自许可证使用，本项目不改动其授权条款。若分发安装包，请同时保留本文件。

jsontool is released under the MIT License (see `LICENSE`). The third-party components and assets below keep their own licenses. Keep this file when redistributing builds.

---

## 1. Runtime and libraries / 运行时与依赖

| Component / 组件 | Version / 版本 | License / 许可证 |
| --- | --- | --- |
| Tauri (`tauri`, `tauri-build`, `@tauri-apps/api`, `@tauri-apps/cli`) | 1.5.x | MIT OR Apache-2.0 |
| React (`react`, `react-dom`) | 18.x | MIT |
| Tailwind CSS | 3.x | MIT |
| i18next / react-i18next | 23.x / 14.x | MIT |
| CodeMirror 6 (`@codemirror/state`, `view`, `language`, `commands`, `lang-json`) | 6.x | MIT |
| Vite / `@vitejs/plugin-react` | 5.x / 4.x | MIT |
| TypeScript | 5.x | Apache-2.0 |
| PostCSS / Autoprefixer | 8.x / 10.x | MIT |
| Rust crates: `serde`, `serde_json`, `uuid` | 1.x | MIT OR Apache-2.0 |

Rust 间接依赖（`Cargo.lock` 中列出的所有 crate）同样为 MIT / Apache-2.0 / BSD 等宽松许可证，具体以各 crate 的 `Cargo.toml` 声明为准。前端间接依赖以 `package-lock.json` 为准。

Scan on your own stack:

```powershell
npx license-checker --summary
cargo install cargo-license
cargo license --manifest-path src-tauri/Cargo.toml
```

## 2. Fonts / 字体

| Asset | Path | Statement |
| --- | --- | --- |
| QuanCangKai（全仓楷） | `public/fonts/QuanCangKai.ttf` | 项目作者已确认该字体可用于商业用途，并随本应用与安装包分发。字体版权归原作者所有；如二次分发或商用，请自行确认原始授权条款。The project author has confirmed this font may be used commercially and redistributed with this app. Copyright remains with the font's original author. |

字体以 TTF 文件形式随应用打包（并包含在前端资源中），不依赖系统已安装字体。

## 3. Icons and artwork / 图标与视觉素材

| Asset | Path | Statement |
| --- | --- | --- |
| App logo and icon set | `public/logo.png`, `src-tauri/icons/` | 由项目作者提供，不含第三方版权内容，可随本项目以 MIT 许可证分发。Provided by the project author with no third-party copyrighted content; distributed under the project's MIT license. |

界面中的功能图标为项目内自绘的 SVG 路径（`src/components/Icon.tsx`），同样按 MIT 分发。

## 4. Installer toolchain / 安装包工具链

| Component | Version | Notes |
| --- | --- | --- |
| Inno Setup | 6.2.2 | Inno Setup License：可免费用于个人与商业软件打包，允许分发由它生成的安装程序；编译器本身不随本仓库分发。 |
| Inno Setup translation files | 6.x unofficial | `installer/languages/*.isl` 基于 Inno Setup 社区翻译整理，并按 Inno Setup 的翻译条款使用；本项目仅移除该版本已不再支持的键、补充 `[CustomMessages]` 文案。 |

## 5. WebView2 Runtime

安装脚本可选择读取 `installer/redist/MicrosoftEdgeWebView2Setup.exe` 并静默安装。该运行时由 Microsoft 提供，分发需遵守 Microsoft Edge WebView2 Runtime 的可再分发条款；本仓库**不包含**该二进制文件。Windows 7 SP1 仅支持 WebView2 Runtime 109。

## 6. Trademarks

“Apple / iOS” 仅用于描述界面视觉风格，与本项目无关联。其他商标归各自所有者。
