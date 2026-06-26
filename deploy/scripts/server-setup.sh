#!/usr/bin/env bash
#
# One-time Linode provisioning for start.cacadets.org.
# Run as root (or with sudo) on a fresh Ubuntu 22.04/24.04 server.
# Review every line before running — this is a guide, not a turnkey installer.
#
set -euo pipefail

APP_NAME="cacc-start"
DOMAIN="start.cacadets.org"
DEPLOY_USER="deploy"
DEPLOY_PATH="/var/www/${APP_NAME}"
NODE_MAJOR="20"

echo ">> Installing system packages..."
apt-get update
apt-get install -y curl git rsync nginx ufw

echo ">> Installing Node.js ${NODE_MAJOR}.x..."
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt-get install -y nodejs

echo ">> Creating deploy user '${DEPLOY_USER}'..."
id -u "${DEPLOY_USER}" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "${DEPLOY_USER}"

echo ">> Creating directory structure..."
mkdir -p "${DEPLOY_PATH}/releases" "${DEPLOY_PATH}/shared"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}"
chmod 750 "${DEPLOY_PATH}"

echo ">> Creating shared/.env (edit with real values!)..."
if [ ! -f "${DEPLOY_PATH}/shared/.env" ]; then
  cat > "${DEPLOY_PATH}/shared/.env" <<ENV
PORT=3000
NODE_ENV=production
ENV
  chown "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}/shared/.env"
  chmod 600 "${DEPLOY_PATH}/shared/.env"
fi

echo ">> Setting up SSH access for the deploy user..."
install -d -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
echo "   --> Add the deploy PUBLIC key to /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo "   --> (the private half goes into the LINODE_SSH_PRIVATE_KEY GitHub secret)"

echo ">> Granting the deploy user permission to restart ONLY this service..."
cat > "/etc/sudoers.d/${APP_NAME}" <<SUDO
${DEPLOY_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart ${APP_NAME}
SUDO
chmod 440 "/etc/sudoers.d/${APP_NAME}"

echo ">> Installing systemd service..."
echo "   --> Copy deploy/systemd/${APP_NAME}.service to /etc/systemd/system/ then:"
echo "       systemctl daemon-reload && systemctl enable ${APP_NAME}"
echo "   (Do NOT start it until the first deploy has populated ${DEPLOY_PATH}/current)"

echo ">> Configuring Nginx..."
echo "   --> Copy deploy/nginx/${DOMAIN}.conf to /etc/nginx/sites-available/${DOMAIN}"
echo "       ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
echo "       nginx -t && systemctl reload nginx"

echo ">> Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ">> Obtaining SSL certificate (after DNS for ${DOMAIN} points here)..."
echo "   --> apt-get install -y certbot python3-certbot-nginx"
echo "       certbot --nginx -d ${DOMAIN}"

echo ">> Done. Next: trigger a deploy from GitHub (push/merge to main)."
