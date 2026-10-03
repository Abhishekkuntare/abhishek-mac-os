# Abhishek OS Privacy Policy

**Effective date:** September 23, 2026

Abhishek OS is an open-source desktop application maintained by Abhishek Kuntare.

This Privacy Policy explains how Abhishek OS handles information when you use the application.

---

## 1. Privacy by design

Abhishek OS is designed primarily as a local desktop application.

The project does not intentionally collect, sell or rent personal information for advertising, profiling or data-broker purposes.

The application does not intentionally create a centralized user profile for advertising purposes.

---

## 2. Information stored locally

Abhishek OS may store application preferences and configuration information locally on the user's computer.

Examples may include:

* Application preferences
* Appearance settings
* Wallpaper selections
* User interface preferences
* Application state
* Local application data
* Settings required for application functionality

When you allow all-drive access for Finder, Abhishek OS stores that consent locally and can browse accessible mounted drives. It reads directory names, file types, sizes, and timestamps only as you open folders. Files remain in their original locations; this feature does not recursively copy or upload file contents. You can revoke all-drive access from Finder's sidebar. Windows does not provide a separate global file-picker permission for desktop apps, so the in-app consent is explicit and controls this access. Finder can also connect individually selected folders when all-drive access is off.

On Windows, the application may query the current Wi-Fi network name and Bluetooth adapter status locally to show system connectivity. This information is not sent to an external service by this feature.

This information is stored on the user's device unless a particular feature explicitly requires communication with an external service.

---

## 3. Network communication

Some application features may communicate with external services.

Network communication may occur when the user explicitly uses a feature that requires an internet connection.

Examples can include:

* Checking for application updates
* Downloading application updates
* Opening external websites
* Using optional online services
* Using APIs or integrations explicitly enabled by the user

The application should not be interpreted as completely offline software when an enabled feature requires network access.

Phone screen sharing contacts the configured pairing service to create a short-lived session and exchange WebRTC connection setup messages. Pairing tokens and active signaling connections are held in memory and expire after five minutes; restarting the service ends active sessions. The relay does not receive or store screen video. WebRTC sends video peer-to-peer with transport encryption, except when a TURN relay is used. Connection setup can expose network-address candidates to the paired device and signaling service; STUN providers may also see public network addresses. The hosted service and STUN providers may process ordinary connection metadata under their own privacy policies.

---

## 4. Automatic updates

Abhishek OS may periodically check the official release infrastructure for application updates.

The update system may communicate with the project's official GitHub release infrastructure to determine whether a newer version is available and to download an update.

Update functionality exists to maintain application functionality, security and compatibility.

---

## 5. External services

Abhishek OS may use third-party services or libraries.

These services may have their own privacy policies, terms and data-handling practices.

Users should review the applicable privacy policies of third-party services when using features that communicate with those services.

The project does not claim responsibility for the privacy practices of independent third-party services.

---

## 6. AI and external APIs

Some versions or features of Abhishek OS may provide integrations with AI or external APIs.

When a user explicitly uses such functionality, information entered into that feature may be transmitted to the corresponding service according to that service's API and privacy policies.

Users should avoid submitting confidential, sensitive or personal information to third-party AI or API services unless they understand and accept the applicable service's terms and privacy practices.

---

## 7. Personal information

Abhishek OS does not intentionally require users to provide personal information merely to install and use the basic desktop application.

If a future feature requires personal information, the project documentation should clearly explain what information is required and why it is needed.

---

## 8. Children's privacy

Abhishek OS is general-purpose desktop software.

The project does not intentionally collect personal information from children.

Parents and guardians should supervise use of online services and third-party integrations where appropriate.

---

## 9. Data security

The project attempts to follow reasonable software-development and security practices.

However, no software or computer system can guarantee absolute security.

Users should maintain current operating-system security updates and obtain Abhishek OS only from official project release channels.

---

## 10. Data deletion

Because much of the application's data is stored locally, users can remove local application data through the operating system or application settings where supported.

Removing the application does not necessarily remove every piece of data created by third-party services or external applications.

Filesystem consent and selected-folder grants are stored in the application's user-data directory and can be revoked from Finder. Removing those grants does not delete or modify the original files.

Users should consult the relevant third-party service if they need to delete data held by that service.

---

## 11. Changes to this policy

This Privacy Policy may be updated when the application's functionality or data-handling practices change.

The latest version will be published in the project's official repository.

The effective date at the beginning of this document indicates the current version of the policy.

---

## 12. Contact

For privacy-related questions concerning Abhishek OS, contact the project maintainer through the official GitHub repository:

https://github.com/Abhishekkuntare/abhishek-mac-os
