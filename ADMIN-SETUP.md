# Hollybush club admin setup

The admin portal runs as a small Cloudflare Worker at its own `workers.dev` address. Cloudflare Access handles the login and only approved email addresses receive a one-time sign-in code. The portal can stage a programme PDF, update the homepage's Facebook and TikTok cards, and show coaches the squad's availability for the next fixture. GitHub remains the content store for website content. Player availability is stored in a small Cloudflare D1 database.

The Hollybush website remains on GitHub Pages and its DNS remains at IONOS. Do not add, transfer or change the domain in Cloudflare.

The previous programme remains live if an upload is invalid or the build fails.

## 1. Merge the website pull request

The repository must contain:

- `admin-worker/` — the private admin page and upload API.
- `.github/workflows/build-programme.yml` — validates and publishes staged PDFs.
- `scripts/build-programme.mjs` — performs the failure-safe PDF conversion.

In **Repository settings → Actions → General → Workflow permissions**, allow workflows to read and write repository contents. The workflow uses GitHub's built-in token; it does not need `PAT_TOKEN`.

## 2. Create a restricted GitHub token

In GitHub, create a **fine-grained personal access token** with:

- Resource owner: `ConnorHaines`
- Repository access: **Only select repositories → connorhaines**
- Repository permission: **Contents → Read and write**
- An expiry date that you will be able to renew

No Actions, administration, issues or account permissions are required. Copy the token once and do not put it in the repository, a chat message or `wrangler.toml`.

## 3. Create the Worker account and address

Create a free Cloudflare account if needed. Do not add `hollybush-rugby.co.uk` as a website. In **Workers & Pages**, choose a `workers.dev` account subdomain when prompted.

From the repository root, deploy the Worker:

```sh
cd admin-worker
npx wrangler@latest login
npx wrangler@latest deploy
```

Wrangler prints the production address in this format:

```text
https://admin.<your-subdomain>.workers.dev
```

## 4. Protect the Worker with Cloudflare Access

In **Workers & Pages → admin → Settings → Domains & Routes**:

1. Find the production `workers.dev` route and select **Enable Cloudflare Access**.
2. Select **Manage Cloudflare Access**.
3. Add an **Allow** policy that includes only the email addresses permitted to manage website content.
4. Enable **One-time PIN** as the login method if the players do not share an existing identity provider.
5. Copy the application's **AUD tag** from its Access settings.

Also note the Cloudflare Access team domain, such as `your-team.cloudflareaccess.com`.

The Worker verifies the Access JWT itself, including its signature, issuer, audience and expiry. The production `workers.dev` route is the only public route and Cloudflare Access protects it before the upload page loads.

Then enter each value directly from the `admin-worker` directory when prompted:

```sh
npx wrangler@latest secret put ACCESS_TEAM_DOMAIN
npx wrangler@latest secret put ACCESS_AUD
npx wrangler@latest secret put GITHUB_TOKEN
```

- `ACCESS_TEAM_DOMAIN`: the Access team domain from step 4.
- `ACCESS_AUD`: the Access application's AUD tag.
- `GITHUB_TOKEN`: the restricted token from step 2.

These values are stored as Worker secrets and are never sent to the browser. For local testing, copy `.dev.vars.example` to `.dev.vars`; `.dev.vars` is ignored by Git.

## 5. Test before sharing it

1. Visit the production `workers.dev` address with an email that is not allowed and confirm access is denied.
2. Sign in with an approved email and its one-time code.
3. Select a small PDF, enter the opposition and match date, and check its preview.
4. Confirm the automatically selected season, then publish it and wait for the page to report **Programme published**.
5. Open `https://hollybush-rugby.co.uk/programme.html` on both a phone and desktop.
6. Open **Latest From the Bush**, paste a public Facebook post link and TikTok video link, edit the card copy and publish. Confirm both homepage cards open the expected posts.

The upload is written to `programmes/pending.pdf` with its match details in `programmes/pending.json`. The GitHub Action checks the PDF header, file size, encryption, page count and rendered page count. Only a successful build archives the outgoing programme, promotes the staged file to `programmes/current.pdf` and updates the reader pages. Both staging files are then removed.

## Ongoing administration

- Add or remove publishers in the Cloudflare Access application policy; they never need GitHub accounts.
- Review sign-ins in Cloudflare Access logs. Successful programme and social-card updates also write audit events to the Worker logs.
- Facebook and TikTok updates are stored in `content/latest.json`; the current programme card is populated automatically from `programmes/programme.json`.
- Renew the fine-grained GitHub token before it expires by updating the `GITHUB_TOKEN` Worker secret.
- Never share the GitHub token or add it to a website file.

## Player availability setup

Availability uses two Workers with one shared D1 database:

- `admin` stays behind Cloudflare Access and shows the private coach view.
- `availability` is public at its own obscure `workers.dev` address and accepts player responses using the shared squad PIN.
- Both Workers use the same D1 binding named **DB**.

Do not enable Cloudflare Access on the public `availability` Worker.

### 1. Create and initialise D1

In **Cloudflare → Storage & databases → D1 SQL database**:

1. Create a database named `hollybush-club`.
2. Open its **Console**.
3. Paste and run `availability-worker/migrations/0001_availability.sql`.
4. Copy the database ID shown on the database overview. The ID is not a password.

The migration creates the fixture, player and response tables and loads the initial retained squad alphabetically. Tyler T. Roberts is not included. Ben Watkins-Smith and Ivan Hutchinson are included.

### 2. Connect the private admin Worker

Open **Workers & Pages → admin → Bindings → Add binding → D1 database**:

- Variable name: `DB`
- Database: `hollybush-club`

Also add a plain-text variable:

- Name: `PUBLIC_AVAILABILITY_URL`
- Value: the production URL from step 3 below

Redeploy the admin Worker after adding the binding and variable. Keep its existing Cloudflare Access policy enabled.

### 3. Create the public availability Worker

Deploy the Worker from the repository:

```sh
cd availability-worker
npx wrangler@latest login
npx wrangler@latest deploy
```

Alternatively, create a second Cloudflare Worker connected to the same GitHub repository and set its root directory to `availability-worker`.

Then add the same D1 binding to that Worker:

- Variable name: `DB`
- Database: `hollybush-club`

Store the shared PIN as an encrypted Worker secret named `SQUAD_PIN`. Do not add the PIN to GitHub or a plain-text variable. With Wrangler:

```sh
cd availability-worker
npx wrangler@latest secret put SQUAD_PIN
```

Enter the agreed squad PIN when prompted. Redeploy once the binding and secret are present.

### 4. Test the flow

1. Open the public availability Worker URL in a private browser window.
2. Confirm the next Hollybush fixture and alphabetic player list appear.
3. Submit a test response using the squad PIN.
4. Open the private admin portal and select **Availability**.
5. Confirm the response appears, copy both WhatsApp lists, then test locking and reopening responses.
6. Share only the public availability URL with players.

The public form never returns other players' answers. The coach view remains protected by Cloudflare Access. Notes are limited to 200 characters and responses can be changed until a coach locks the fixture.
