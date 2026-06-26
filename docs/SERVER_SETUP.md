# Linode server setup (one time)

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
sudo apt-get install -y curl git rsync nginx ufw
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
PORT=3000
NODE_ENV=production
ENV
sudo chmod 600 /var/www/cacc-start/shared/.env
```

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

## 7. Nginx reverse proxy

```bash
sudo cp deploy/nginx/start.cacadets.org.conf \
  /etc/nginx/sites-available/start.cacadets.org
sudo ln -s /etc/nginx/sites-available/start.cacadets.org \
  /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 9. SSL (Let's Encrypt)

After DNS resolves to this server:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d start.cacadets.org
```

Certbot edits the Nginx config to add the certificate and HTTP→HTTPS redirect,
and installs a renewal timer. Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

### SSL considerations

- Certs auto-renew via the `certbot.timer` systemd unit; no action needed.
- Keep `start.cacadets.org` DNS pointed here or renewal (HTTP-01) will fail.
- The app listens on plain HTTP on `127.0.0.1:3000`; **TLS terminates at Nginx**.
  Don't expose port 3000 publicly (the firewall above doesn't).

## 10. First deploy

Configure the [GitHub Secrets](./SECRETS.md), then push/merge to `main`. The
workflow creates `releases/<sha>` and the `current` symlink. After it succeeds:

```bash
sudo systemctl start cacc-start
curl -fsS http://127.0.0.1:3000/healthz   # {"status":"ok",...}
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
