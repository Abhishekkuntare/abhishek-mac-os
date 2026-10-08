# Cloud profile analytics

ARLO OS profile collection is optional. During setup, a user must explicitly opt in before their profile is sent to the cloud. The opt-in profile contains their full name, display name, username, email, and a private profile photo. The service infers an approximate country and region from the connection IP; it does not store the raw IP or collect GPS coordinates. The host and ipwho.is may process the IP address to perform that lookup.

The administrator dashboard at `https://<your-render-service>.onrender.com/admin` requires the configured admin email and password. It shows opted-in profiles, approximate locations, GitHub release asset downloads, and repository stars. GitHub project metrics are public and independent of individual users.

## 1. Create the Supabase database

1. Create a free Supabase project.
2. In **SQL Editor**, run [`supabase/analytics.sql`](./supabase/analytics.sql). This creates the private profile table, private avatar bucket, and administrator-only summary function. The table and bucket do not grant access to anonymous or signed-in public clients.
3. In **Project Settings → API**, copy the project URL and the `service_role` secret. Keep the service-role secret private; never put it in the desktop build, a `VITE_` variable, or source control.

## 2. Configure the Render service

Set these environment variables for the existing ARLO OS web service in the Render dashboard:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | The Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | The private Supabase `service_role` secret |
| `ADMIN_EMAIL` | `abhishekkuntare02@gmail.com` |
| `ADMIN_PASSWORD` | A unique password of at least 16 characters, used only for this dashboard |
| `ADMIN_SESSION_SECRET` | A random secret of at least 32 characters |

The `render.yaml` blueprint declares these as secret/manual environment variables and intentionally contains no credentials. Deploy or redeploy the service after adding them. Confirm `/healthz` responds with `{"status":"ok"}` and open `/admin` to sign in.

The free Render service may sleep while idle, so the first request after a quiet period can take longer. The dashboard refreshes GitHub metrics from the public GitHub API and caches them for ten minutes.

## 3. Configure desktop builds

The desktop app uses `https://arlo-os.onrender.com` by default. To point a build at another service, set `VITE_ANALYTICS_API_ORIGIN` to that service's HTTPS origin in the build environment. This is a public API origin, not a secret. For a local production build, it can be placed in an untracked `.env.production` file. Rebuild and distribute the desktop application after changing the origin; previously built installers keep their original setting.

Onboarding keeps profile details on the device until the user explicitly chooses **Share profile & enter ARLO OS** on the final setup screen. The same action is available later in **Settings → User Profile → Share and sync my profile**. It shares the name, display name, username, selected roles, email, and profile photo with the administrator. Different email addresses on the same browser/device get separate dashboard rows; syncing the same email again updates its existing row. If cloud saving fails during onboarding, the user can retry or continue locally; Settings reports the error so the user can retry. The screen-unlock password is never included in a cloud request.

For an existing Supabase project, rerun [`supabase/analytics.sql`](./supabase/analytics.sql) to add the `roles` column before deploying a server version that reads and writes it. The SQL is safe to rerun.

## Data and metrics

- A random profile identifier is stored locally per normalized email address, so different profile emails on the same browser/device are saved separately and repeated syncs update the matching profile.
- The user's selected “What do you do?” roles are saved as a list in `analytics_users.roles` and displayed in the administrator dashboard.
- Profile photos are stored in a private Supabase Storage bucket and served to the dashboard with short-lived signed URLs. User-uploaded images are resized in the app and limited to JPEG under 256 KB; bundled illustrations are selected from a fixed allowlist and capped at 512 KB.
- The service does not record app activity, individual downloads, or in-app likes.
- Download counts are summed from downloadable assets in the 100 most recent GitHub releases; stars are the repository's public star count.
- Profile deletion requests can be sent to the project maintainer using the contact link in [`PRIVACY.md`](./PRIVACY.md).
