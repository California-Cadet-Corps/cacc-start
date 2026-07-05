# Linode server setup (one time)

> **RETIRED — Linode legacy (retired 2026-07-04):** kept for rollback/reference
> only. Production is Vercel — see [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md).

This provisions a fresh Ubuntu 22.04/24.04 Linode to host
**start.cacadets.org**. A scripted version of these steps is in
[`deploy/scripts/server-setup.sh`](../deploy/scripts/server-setup.sh) — read it
before running.

## 0. DNS

Point DNS at the Linode's public IP **before** requesting SSL:

```
start.cacadets.org   A     <linode-ipv4>
start.cacadets.org   AAAA  <linode-ipv6>   (optional)
```

## 1. Base packages

```bash
sudo apt-get update
sudo apt-get install -y curl git rsync apache2 ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs
node -v   # expect v20.x
```

## 2. Deploy user

A dedicated, unprivileged user owns the app and is the SSH target for deploys.

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# Append the deploy PUBLIC key (deploy_key.pub) to:
sudo -u deploy tee -a /home/deploy/.ssh/authorized_keys < deploy_key.pub
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

## 3. Directory structure

```bash
sudo mkdir -p /var/www/cacc-start/releases /var/www/cacc-start/shared
sudo chown -R deploy:deploy /var/www/cacc-start
sudo chmod 750 /var/www/cacc-start
```

This matches `LINODE_DEPLOY_PATH=/var/www/cacc-start`.

## 4. Server environment file

```bash
sudo -u deploy tee /var/www/cacc-start/shared/.env >/dev/null <<'ENV'
PORT=3002
NODE_ENV=production
ENV
sudo chmod 600 /var/www/cacc-start/shared/.env
```

> Production uses **3002** because 3000 was already taken on this shared host.
> Pick any free local port; the Apache vhost and the deploy health check both
> read it from here.

Add real runtime secrets here later — they are **never** committed to git.

## 5. Allow the deploy user to restart only this service

```bash
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart cacc-start' \
  | sudo tee /etc/sudoers.d/cacc-start
sudo chmod 440 /etc/sudoers.d/cacc-start
```

Scoped so the deploy key can restart this one service and nothing else.

## 6. systemd service

```bash
sudo cp deploy/systemd/cacc-start.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cacc-start
# Do NOT start yet — there is no current/ release until the first deploy.
```

## 7. Apache reverse proxy

> The production CACC host serves all sites with **Apache** (not nginx). Other
> subdomains (e.g. `newtools.cacadets.org`) follow this exact pattern.

Ensure the needed modules are enabled (they already are on the prod box):

```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
```

Install and enable the vhost:

```bash
sudo cp deploy/apache/start.cacadets.org.conf \
  /etc/apache2/sites-available/start.cacadets.org.conf
sudo a2ensite start.cacadets.org.conf
sudo apache2ctl configtest && sudo systemctl reload apache2
```

This vhost reverse-proxies `start.cacadets.org` → `127.0.0.1:3002` (the Node
app's port, set in `shared/.env`).

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Apache Full'
sudo ufw --force enable
```

## 9. SSL (Let's Encrypt)

After DNS for `start.cacadets.org` resolves to this server:

```bash
sudo apt-get install -y certbot python3-certbot-apache
sudo certbot --apache -d start.cacadets.org --redirect
```

Certbot generates `start.cacadets.org-le-ssl.conf` (the 443 vhost), installs the
certificate, adds the HTTP→HTTPS redirect, and sets up auto-renewal. Verify it:

```bash
sudo certbot renew --dry-run
```

### SSL considerations

- Certs auto-renew via the `certbot.timer` systemd unit; no action needed.
- Keep `start.cacadets.org` DNS pointed here or renewal (HTTP-01) will fail.
- The app listens on plain HTTP on `127.0.0.1:3002`; **TLS terminates at Apache**.
  Port 3002 is never exposed publicly (the firewall above doesn't open it).

## 10. First deploy

Configure the [GitHub Secrets](./SECRETS.md), then push/merge to `main`. The
workflow creates `releases/<sha>` and the `current` symlink. After it succeeds:

```bash
sudo systemctl start cacc-start
curl -fsS http://127.0.0.1:3002/healthz   # {"status":"ok",...}
```

Visit **https://start.cacadets.org** to confirm.

## File permissions summary

| Path | Owner | Mode |
| ---- | ----- | ---- |
| `/var/www/cacc-start` | `deploy:deploy` | `750` |
| `/var/www/cacc-start/shared/.env` | `deploy:deploy` | `600` |
| `/home/deploy/.ssh` | `deploy:deploy` | `700` |
| `/home/deploy/.ssh/authorized_keys` | `deploy:deploy` | `600` |
| `/etc/sudoers.d/cacc-start` | `root:root` | `440` |
