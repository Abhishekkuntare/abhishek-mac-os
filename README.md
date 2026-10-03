# Abhishek OS

### A modern, open-source desktop environment for Windows.

Abhishek OS is an open-source desktop environment designed to provide a modern, customizable and immersive desktop experience for Windows.

The project combines a familiar desktop workflow with a responsive interface, built-in applications, productivity tools, system utilities and a strong focus on visual design and user experience.

---

## ✨ Features

* 🖥️ Modern desktop environment
* 🎨 Customizable wallpapers and visual appearance
* 🪟 Desktop windows and application management
* 📁 File and folder workflows
* 🌐 Built-in browser experience
* 💻 Developer-focused tools
* 📝 Productivity applications
* 📅 Calendar and reminders
* 🧮 Calculator
* 📷 Camera application
* 🎵 Media and entertainment applications
* ⚙️ System settings
* 🔔 Notifications and system interactions
* 📱 Responsive layouts
* ✨ Animated and glass-inspired interface
* 🔄 Automatic application updates
* 🔐 Verified release and code-signing infrastructure

Features may evolve as the project develops.

### Desktop themes

The Themes section in Settings offers animated previews for 29 visual themes. Abhishek OS's original appearance is the default; selecting a theme applies its colors and surfaces across the desktop, system panels, and built-in applications, and the choice is saved between launches. Use **Original Desktop** to restore the default appearance.

### Code Studio runtimes

Code Studio runs C++ and Java programs using local toolchains. On Windows, if a required toolchain is missing, Code Studio offers an **Install and Run** action: C++ setup installs MSYS2/GCC, and Java setup installs Eclipse Temurin JDK 21 through Windows winget. These installs require an internet connection and are started only after the user selects the install action. JavaScript and Python use their existing local runtimes.

### Finder context menus

Finder context menus work in both the virtual workspace and user-connected local folders. Local file operations are limited to folders the user has granted to Abhishek OS. Deleting a file or folder moves it into the app's Trash; restoring returns local files to their original folder (with a renamed copy if a name collision exists), while permanent deletion and Empty Trash remove the stored data. System and app icons are protected from deletion. Code files open in VS Code when it is detected; otherwise Finder opens the file in Code Studio. Actions such as sharing or editing in third-party apps are only shown when an actual integration is available.

The desktop System widget polls live CPU load and memory usage from the host computer through Electron's main process. A metric that cannot be read is shown as unavailable.

### Host connectivity

On Windows, Control Center can scan and display nearby Wi-Fi networks with signal and security details. It can connect to a network with an existing Windows Wi-Fi profile; networks that need a new password must first be configured in Windows Wi-Fi settings. Bluetooth status comes from the host and is cleared while Bluetooth is off. The in-app scan can connect to Bluetooth LE devices; use **Pair classic** to open Windows Bluetooth settings for audio and other classic Bluetooth devices.

### Quick Look media streaming

Images and videos in Quick Look are streamed via a custom `abhishek-local://` protocol handler, eliminating the 2 MB size limit that applied to base64 conversion. The protocol handler serves files directly with correct MIME types, allowing unlimited image and video preview sizes.

When Electron's main-process or preload code changes, rebuild and reinstall/relaunch the desktop app; rebuilding only the renderer does not update its IPC handlers.

---

## 📸 Screenshots

Screenshots and demonstrations are available in the repository and project releases.

---

## 🚀 Download

Official releases are published through GitHub Releases:

**[Download Abhishek OS](https://abhishek-operating-system.netlify.app)**

Only download Abhishek OS from the official repository or official project release pages.

Before installing a release, users should verify that the release belongs to the official Abhishek OS repository.

---

## 🔐 Code signing policy

Abhishek OS uses automated build and release infrastructure to produce its official Windows releases.

**Free code signing provided by SignPath.io, certificate by SignPath Foundation.**

The purpose of code signing is to provide users with a verifiable relationship between the published Windows binary and the project's source repository.

### Signing roles

**Committers and reviewers:**
Abhishek Kuntare

**Approvers:**
Abhishek Kuntare

The project maintainer is responsible for reviewing source-code and build changes and approving official release artifacts for signing.

Project source repository:

https://github.com/Abhishekkuntare/abhishek-mac-os

Official releases:

https://github.com/Abhishekkuntare/abhishek-mac-os/releases

All official signed release artifacts are produced from the project's source repository and automated build process.

Every release intended for signing must correspond to a published project release and must be reviewed by the project maintainer before signing.

---

## 🔒 Privacy

Abhishek OS is designed with user privacy in mind.

The application does not intentionally collect or sell personal information for advertising or profiling purposes.

Some features may communicate with external services when the user explicitly uses a feature that requires network access. Such communication is limited to the functionality requested by the user.

For details, see the project's:

**[Privacy Policy](PRIVACY.md)**

Third-party services and libraries used by the project may have their own privacy policies and terms.

---

## 🧩 Open Source

Abhishek OS is released under the:

**MIT License**

See:

[LICENSE](LICENSE)

The project source code is publicly available so that users and contributors can inspect, modify and improve the software in accordance with the license.

---

## 🛠️ Technology

Abhishek OS is built using modern web and desktop technologies, including:

* React
* TypeScript
* Vite
* Electron
* Electron Builder
* Tailwind CSS
* Lucide Icons
* GitHub Actions

The exact dependency versions used for a release are defined by the project's source repository and lockfile.

---

## 🏗️ Development

### Requirements

To develop Abhishek OS locally, you should have:

* Node.js
* npm
* Git

Clone the repository:

```bash
git clone https://github.com/Abhishekkuntare/abhishek-mac-os.git
cd abhishek-mac-os
```

Install dependencies:

```bash
npm install
```

Run the development environment:

```bash
npm run dev
```

Build the renderer:

```bash
npm run build:renderer
```

Build the Windows installer:

```bash
npm run package:win
```

---

## 📦 Release process

Official Windows releases are built through GitHub Actions.

The release process generally follows:

```text
Source Code
    ↓
GitHub Repository
    ↓
GitHub Actions
    ↓
Renderer Build
    ↓
Electron Packaging
    ↓
Windows Installer
    ↓
Code Signing
    ↓
GitHub Release
```

Release artifacts are published through the official GitHub Releases page.

---

## 🔄 Automatic Updates

Abhishek OS supports automatic updates for supported Windows releases.

The application uses the official release metadata and artifacts published through the project's GitHub Releases infrastructure.

Users should not need to manually uninstall the application to receive supported application updates.

Updates are downloaded and installed according to the application's update configuration and user interaction.

---

## 🐛 Issues and Contributions

Bug reports, feature requests and improvements are welcome.

Please use GitHub Issues:

https://github.com/Abhishekkuntare/abhishek-mac-os/issues

When reporting a problem, include:

* Abhishek OS version
* Windows version
* Steps to reproduce the issue
* Expected behavior
* Actual behavior
* Relevant screenshots or logs

Please do not publicly disclose security-sensitive information.

---

## 🤝 Contributing

Contributions are welcome.

Before submitting a pull request:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the application.
5. Verify that the build succeeds.
6. Submit a pull request describing your changes.

Changes from contributors should be reviewed before being merged into the official project.

---

## 🛡️ Security

If you discover a security vulnerability, please avoid publicly disclosing sensitive details before the issue can be investigated.

Use the repository's available security/contact mechanism where possible.

Security reports should include enough information to reproduce and investigate the issue.

---

## 📜 License

Copyright © 2026 Abhishek Kuntare.

Abhishek OS is licensed under the MIT License.

See [LICENSE](LICENSE) for the complete license text.

---

## 👤 Maintainer

**Abhishek Kuntare**

GitHub:

https://github.com/Abhishekkuntare

Project repository:

https://github.com/Abhishekkuntare/abhishek-mac-os

---

## ⭐ Support the Project

If you find Abhishek OS useful, consider:

* ⭐ Starring the repository
* 🐛 Reporting bugs
* 💡 Suggesting improvements
* 🔧 Contributing code
* 📢 Sharing the project with other developers

Thank you for supporting open-source software.
