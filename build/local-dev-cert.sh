#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${LOCAL_DEV_DOMAIN:-192.168.233.245.local-dev.yttweak.com}"
CERT_BASE="${LOCAL_DEV_CERT_BASE:-build/local-dev.yttweak.com}"
ACME_SH="${ACME_SH:-}"

if [ -z "$ACME_SH" ]; then
	if command -v acme.sh >/dev/null 2>&1; then
		ACME_SH="$(command -v acme.sh)"
	elif [ -x "$HOME/.acme.sh/acme.sh" ]; then
		ACME_SH="$HOME/.acme.sh/acme.sh"
	else
		echo "acme.sh was not found. Install it first, then rerun this script."
		exit 1
	fi
fi

mkdir -p build

"$ACME_SH" --set-default-ca --server letsencrypt

set +e
"$ACME_SH" --issue --server letsencrypt --dns -d "$DOMAIN" --keylength ec-256 --yes-I-know-dns-manual-mode-enough-go-ahead-please
issue_status=$?
set -e

echo ""
echo "Add the TXT record printed above, then wait for DNS propagation."
echo "If you use CNAME delegation, add the CNAME for _acme-challenge.${DOMAIN} first,"
echo "then put the printed TXT value on the delegated target."
echo "acme.sh exited with status ${issue_status}; this is expected when manual DNS mode stops after printing TXT."
echo ""
read -r -p "Press Enter after the TXT record is visible in public DNS..."

"$ACME_SH" --renew --server letsencrypt -d "$DOMAIN" --ecc --yes-I-know-dns-manual-mode-enough-go-ahead-please
"$ACME_SH" --install-cert -d "$DOMAIN" --ecc --fullchain-file "${CERT_BASE}.pem" --key-file "${CERT_BASE}.key" --reloadcmd "true"

echo "Installed local dev certificate:"
echo "  ${CERT_BASE}.pem"
echo "  ${CERT_BASE}.key"
