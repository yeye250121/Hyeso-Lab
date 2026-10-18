# 뿌리오 알림톡 릴레이 (고정 IP 프록시)

뿌리오 API 는 발신 서버 IP 를 콘솔에 등록해야 한다. Vercel 함수는 IP 가 고정되지 않으므로
무료 VM 하나를 고정 IP 릴레이로 둔다. 릴레이는 Caddy 한 개 프로세스이며,
`X-Relay-Secret` 헤더가 맞는 요청 중 `/v1/token`, `/v1/kakao` 만 `message.ppurio.com` 으로 넘긴다.

```
Vercel (lib/ppurio.ts) --HTTPS + X-Relay-Secret--> relay.hyeso.kr (VM, Caddy) --> message.ppurio.com
```

## 1. VM 만들기 (Google Cloud Compute Engine)
- Compute Engine → VM 인스턴스 → 인스턴스 만들기.
  - 이름 `ppurio-relay`
  - 리전 **us-west1 / us-central1 / us-east1** 중 하나(e2-micro 1대가 무료 등급. 알림톡 릴레이는 지연이 중요하지 않다). 서울(asia-northeast3)로 두면 월 1만 원 안팎.
  - 머신 **e2-micro**
  - 부팅 디스크 **Ubuntu 24.04 LTS**, 표준 영구 디스크 10GB
  - 방화벽: **HTTP 트래픽 허용, HTTPS 트래픽 허용** 둘 다 체크
- 만든 뒤 **VPC 네트워크 → IP 주소**에서 이 VM 의 외부 IP 를 **고정(예약)** 으로 바꾼다. 실행 중인 VM 에 붙은 고정 IP 는 무료이고, 뿌리오에 등록할 IP 라 반드시 고정이어야 한다.
- 외부 IP 를 메모한다.

## 2. DNS
Vercel 대시보드 → Domains → `hyeso.kr` → DNS Records 에 `A  relay  <VM 공인 IP>  TTL 60` 추가.
(Caddy 가 이 도메인으로 Let's Encrypt 인증서를 자동 발급한다.)

## 3. 릴레이 설치
VM 목록의 **SSH** 버튼(브라우저 터미널)으로 접속한 뒤:
```bash
git clone --depth 1 https://github.com/yeye250121/Hyeso-Lab.git && cd Hyeso-Lab/infra/ppurio-relay
sudo RELAY_DOMAIN=relay.hyeso.kr bash setup.sh
```
끝나면 `PPURIO_PROXY_SECRET` 값이 출력된다. 다시 보려면 `sudo cat /etc/caddy/relay.env`.

## 4. 뿌리오 콘솔
API 연동 → 연동 IP 에 VM 공인 IP 등록.

## 5. Vercel 환경변수 (Production · Preview)
| 이름 | 값 |
|---|---|
| `PPURIO_PROXY_URL` | `https://relay.hyeso.kr` |
| `PPURIO_PROXY_SECRET` | setup.sh 가 출력한 값 |
| `PPURIO_ACCOUNT` | 뿌리오 계정 ID |
| `PPURIO_API_KEY` | 뿌리오 API 키 |
| `PPURIO_SENDER_PROFILE` | 뿌리오에 등록된 카카오 발신프로필 키 |
| `ALIMTALK_TEMPLATE_*` | 심사 통과한 템플릿 코드 |

## 운영
- 로그: `sudo tail -f /var/log/caddy/relay.log`
- 재시작: `sudo systemctl restart caddy`
- 비밀키 교체: `/etc/caddy/relay.env` 수정 후 재시작, Vercel 값도 같이 교체.
- VM 이 꺼지면 알림톡만 실패하고 접수 자체는 정상 처리된다(코드에서 알림톡 실패를 접수 실패로 보지 않음).
