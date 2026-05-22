# Deploying Board Game Platform to Google Cloud App Engine

Since this application uses a custom Express WebSocket server (`server.ts`) with Socket.io to manage real-time game turns, deploying to serverless platforms like Vercel or Netlify won't work out of the box because they don't support long-running connections natively.

Google Cloud App Engine is a great choice, but we must configure it to run exactly **one instance** of the server to prevent Socket.io from load-balancing players across different servers, which breaks connection tracking.

Follow these steps to deploy your application:

## 1. Update Dependencies in `package.json`

App Engine installs `dependencies` (but usually not `devDependencies`) for production. You need to ensure the TypeScript runner is available in production.

Run this in your terminal:
```bash
npm install ts-node typescript --save
```

## 2. Verify scripts in `package.json`

Make sure your `"scripts"` block includes the correct start and build commands. App Engine will automatically run `npm run build` followed by `npm start`.

```json
"scripts": {
  "build": "next build",
  "start": "ts-node --project tsconfig.json server.ts"
  // ... other scripts
}
```

## 3. Create `app.yaml` Config

Create a new file named `app.yaml` in the root of your project (`d:\Projects\Board Games\app.yaml`) and paste the following configuration:

```yaml
runtime: nodejs20
env: standard
instance_class: F2

# This is CRITICAL for Socket.io!
# It restricts the app to exactly 1 permanent server instance.
# This prevents players from being split across multiple servers 
# where they wouldn't be able to communicate with each other.
automatic_scaling:
  max_instances: 1

env_variables:
  NODE_ENV: "production"
```

## 4. Deploy to Google Cloud

If you have the [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and authenticated on your computer, open your terminal in the project folder and run:

```bash
gcloud app deploy
```

It will package your app, upload it to GCP, execute `npm run build` to compile the Next.js assets, and start your Node server. After 2–3 minutes, it will give you a live `https://your-project-id.appspot.com` link to send to your friends!

---

## Local Testing (Alternative to permanent Cloud Deployment)

If you just want to test with a friend instantly right now without deploying:
1. Make sure your local server is running (`npm run dev` or `npm run server`).
2. Run `npx localtunnel --port 3000` in a new terminal.
3. Share the generated public URL with your friend!
