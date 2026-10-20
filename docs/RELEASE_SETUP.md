# NearNow — Release setup (Phase A / Stage 0)

These steps need your own accounts. The code side is ready: the build profiles are in `apps/mobile/eas.json`, the S3/R2 storage adapter is in the API, and push sending now checks delivery receipts.
Do them in order. Each step says how to confirm it worked.

---

## 1. App identifiers (decide once — cannot be changed after store release)

Pick a reverse-domain ID you control, e.g. `app.nearnow.mobile`, and add it to `apps/mobile/app.json`:

```json
"ios":     { "bundleIdentifier": "app.nearnow.mobile", ... },
"android": { "package": "app.nearnow.mobile", ... }
```

## 2. Expo / EAS account (free)

```bash
npm install -g eas-cli
```
```bash
cd apps/mobile
```
```bash
eas login
```
```bash
eas init
```

`eas init` creates the EAS project and writes `extra.eas.projectId` into `app.json`; the app reads it for push notifications.

Set the API address for each build profile. These are public values, embedded in the app.

```bash
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://nearnow.onrender.com --visibility plaintext
```
```bash
eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://<your-staging-api>.onrender.com --visibility plaintext
```
```bash
eas env:create --environment development --name EXPO_PUBLIC_API_URL --value http://<your-computer-LAN-IP>:3002 --visibility plaintext
```

Check: `eas env:list --environment preview` shows the value.

## 3. Android development build (free)

```bash
eas build --profile development --platform android
```

When the build finishes, open its link on the Android phone and install the APK.

On your computer, start Metro:

```bash
npx expo start --dev-client
```

Then open the app on the phone; it connects to Metro.

**Maps:** the Android map uses MapLibre, which is only in development and release builds. In Expo Go, Android falls back to the older Leaflet map, so check the map in a development build. iOS uses Apple Maps in both. Map tiles come from OpenFreeMap (free, no key). To use another style server, set `EXPO_PUBLIC_MAP_STYLE_LIGHT` / `EXPO_PUBLIC_MAP_STYLE_DARK` with `eas env:create`.

## 4. iPhone development build (needs Apple Developer Program, $99/year)

There is no iOS simulator on Windows, so a physical iPhone needs a paid Apple account.

```bash
eas device:create
```

Open the link it shows on the iPhone to register the device. Then:

```bash
eas build --profile development --platform ios
```

EAS manages certificates and profiles when it asks. Install from the build link.

## 5. Staging API and database (free tiers)

1. **Neon:** create a branch of your database, e.g. `staging`, and copy its connection strings.
2. **Render:** create a second Web Service from the same repo and branch `ui-and-security-upgrade`, with the same Dockerfile. Set the variables listed in `apps/api/.env.example`, using:
   - `NODE_ENV=production`
   - a new `JWT_SECRET`
   - `CORS_ORIGINS` set to your staging web URL
   - the staging database URLs
3. Apply the migration to **staging only**, from `apps/api` with the staging URLs exported:

   ```bash
   npx prisma migrate deploy
   ```

4. Check: `https://<staging>/health` returns `"status":"ok"`.

## 6. Photo storage — Cloudflare R2 (free tier: 10 GB, no egress fees)

1. Cloudflare dashboard → R2 → create a bucket, e.g. `nearnow-media`.
2. Enable public access: either the `r2.dev` subdomain (fine for testing) or a custom domain (recommended for production).
3. R2 → Manage API tokens → create a token with **Object Read & Write** on that bucket only. Note the Access Key ID and Secret.
4. In the Render service (staging first), set:
   ```
   STORAGE_PROVIDER=s3
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=nearnow-media
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   STORAGE_PUBLIC_URL=https://<public-bucket-url>
   ```
5. Check: create a post with a photo, redeploy the service, and confirm the photo still loads.

## 7. Push notifications

- **Android:** create a Firebase project (free). Add an Android app with the package from step 1. Generate a service-account key for FCM V1 and upload it with `eas credentials` (Android → Google Service Account → FCM V1).
- **iOS:** `eas credentials` (iOS → Push Notifications) creates the APNs key with your Apple account.
- **API (staging first):** set `PUSH_PROVIDER=expo`. Optionally set `EXPO_ACCESS_TOKEN` if you enable "enhanced push security" in Expo.
- Rebuild the app after adding credentials.
- **Check:** in the app, Profile → Alerts → turn on Push and choose an area and categories. From a second account, post nearby in that category. The first phone shows the notification, and tapping it opens the post.

## 8. Device QA

Run the checklist in `IMPLEMENTATION_STATUS.md` §6 on both phones against staging, and record the results there.

---

**Not covered here, and needing your explicit go-ahead:** changing the production secrets, running the production migration, and merging to `main` (which triggers a production deploy).
