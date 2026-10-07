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

Set `VITE_ANALYTICS_API_ORIGIN` to the HTTPS origin of the deployed Render service in the environment used to build ARLO OS. This is a public API origin, not a secret. For a local production build, it can be placed in an untracked `.env.production` file. Rebuild and distribute the desktop application after configuring it; previously built installers cannot send opted-in profiles to the new service.

If the cloud service is unavailable or not configured, users who opted in see an explicit save error and can choose **Continue locally**. Users who do not opt in do not send their profile to the service.

## Data and metrics

- A random installation identifier is used only to update the same opted-in profile rather than create duplicates.
- Profile photos are stored in a private Supabase Storage bucket and served to the dashboard with short-lived signed URLs. User-uploaded images are resized in the app and limited to JPEG under 256 KB; bundled illustrations are selected from a fixed allowlist and capped at 512 KB.
- The service does not record app activity, individual downloads, or in-app likes.
- Download counts are summed from downloadable assets in the 100 most recent GitHub releases; stars are the repository's public star count.
- Profile deletion requests can be sent to the project maintainer using the contact link in [`PRIVACY.md`](./PRIVACY.md).
