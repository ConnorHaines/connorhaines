# Matchday programme admin setup

The admin uploader runs as a small Cloudflare Worker at its own `workers.dev` address. Cloudflare Access handles the login and only approved email addresses receive a one-time sign-in code. The Worker stages a PDF in GitHub; GitHub Actions validates and converts it before replacing the public programme.

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
3. Add an **Allow** policy that includes only the email addresses permitted to publish programmes.
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
3. Select a small PDF and check its preview.
4. Publish it and wait for the page to report **Programme published**.
5. Open `https://hollybush-rugby.co.uk/programme.html` on both a phone and desktop.

The upload is first written to `programmes/pending.pdf`. The GitHub Action checks the PDF header, file size, encryption, page count and rendered page count. Only a successful build promotes it to `programmes/current.pdf` and updates the reader pages. The staging file is then removed.

## Ongoing administration

- Add or remove publishers in the Cloudflare Access application policy; they never need GitHub accounts.
- Review sign-ins in Cloudflare Access logs. Successful uploads also write an audit event to the Worker logs.
- Renew the fine-grained GitHub token before it expires by updating the `GITHUB_TOKEN` Worker secret.
- Never share the GitHub token or add it to a website file.
