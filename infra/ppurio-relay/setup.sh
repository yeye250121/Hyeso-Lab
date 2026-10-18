#!/usr/bin/env bash
# 뿌리오 릴레이 VM 셋업 (Ubuntu 22.04/24.04, GCP e2-micro 기준)
# 사용: sudo RELAY_DOMAIN=relay.hyeso.kr bash setup.sh
#  - Caddy 설치, 80/443 방화벽 개방, 릴레이 설정, 비밀키 생성
#  - 끝나면 RELAY_SECRET 을 출력한다. 이 값을 Vercel 환경변수 PPURIO_PROXY_SECRET 에 넣는다.
set -euo pipefail

: "${RELAY_DOMAIN:?RELAY_DOMAIN=relay.hyeso.kr 처럼 지정하세요}"
ENV_FILE=/etc/caddy/relay.env
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[1/5] Caddy 설치"
apt-get update -qq
apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl gnupg >/dev/null
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
apt-get update -qq
apt-get install -y -qq caddy >/dev/null

echo "[2/5] 방화벽 80/443 개방 (GCP 는 콘솔 방화벽이 따로 있고, OS 쪽은 차단 규칙이 있을 때만 푼다)"
if command -v iptables >/dev/null 2>&1; then
  for p in 80 443; do
    iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null \
      || iptables -I INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT || true
  done
  command -v netfilter-persistent >/dev/null 2>&1 && netfilter-persistent save >/dev/null 2>&1 || true
else
  echo "  iptables 없음 - OS 방화벽 없음, 건너뜀 (GCP 콘솔의 HTTP/HTTPS 허용 체크로 충분)"
fi
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
fi

echo "[3/5] 비밀키"
if [ -f "$ENV_FILE" ] && grep -q RELAY_SECRET "$ENV_FILE"; then
  RELAY_SECRET=$(grep RELAY_SECRET "$ENV_FILE" | cut -d= -f2)
else
  RELAY_SECRET=$(openssl rand -hex 32)
fi
umask 077
printf 'RELAY_DOMAIN=%s\nRELAY_SECRET=%s\n' "$RELAY_DOMAIN" "$RELAY_SECRET" > "$ENV_FILE"
chown root:caddy "$ENV_FILE"; chmod 640 "$ENV_FILE"

echo "[4/5] Caddy 설정"
install -m 644 "$SCRIPT_DIR/Caddyfile" /etc/caddy/Caddyfile
mkdir -p /etc/systemd/system/caddy.service.d
printf '[Service]\nEnvironmentFile=%s\n' "$ENV_FILE" > /etc/systemd/system/caddy.service.d/relay.conf
mkdir -p /var/log/caddy && chown caddy:caddy /var/log/caddy
systemctl daemon-reload
systemctl enable caddy >/dev/null
systemctl restart caddy
sleep 2
systemctl is-active caddy >/dev/null && echo "  caddy 실행 중" || { journalctl -u caddy -n 30 --no-pager; exit 1; }

echo "[5/5] 확인"
PUBIP=$(curl -s https://api.ipify.org || true)
cat <<MSG

완료.
  공인 IP            : ${PUBIP:-확인 필요}   -> 뿌리오 콘솔 '연동 IP' 에 등록
  릴레이 주소        : https://${RELAY_DOMAIN}  (DNS A 레코드가 이 IP 를 가리켜야 인증서가 발급됨)
  PPURIO_PROXY_URL   : https://${RELAY_DOMAIN}
  PPURIO_PROXY_SECRET: ${RELAY_SECRET}

동작 확인 (다른 PC 에서):
  curl -s -o /dev/null -w '%{http_code}\\n' https://${RELAY_DOMAIN}/v1/token -X POST                                  # 403 이면 정상(비밀키 없음)
  curl -s -w '\\n%{http_code}\\n' https://${RELAY_DOMAIN}/v1/token -X POST -H 'X-Relay-Secret: ${RELAY_SECRET}'   # 뿌리오 응답(401 계열)이 오면 릴레이 정상
MSG
