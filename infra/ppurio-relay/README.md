# 뿌리오 알림톡 릴레이 (고정 IP 프록시)

뿌리오 API 는 발신 서버 IP 를 콘솔에 등록해야 한다. Vercel 함수는 IP 가 고정되지 않으므로
무료 VM 하나를 고정 IP 릴레이로 둔다. 릴레이는 Caddy 한 개 프로세스이며,
`X-Relay-Secret` 헤더가 맞는 요청 중 `/v1/token`, `/v1/kakao` 만 `message.ppurio.com` 으로 넘긴다.

```
Vercel (lib/ppurio.ts) --HTTPS + X-Relay-Secret--> relay.hyeso.kr (VM, Caddy) --> message.ppurio.com
```

## 1. VM 만들기 (Oracle Cloud Always Free)
- Compute → Instance 생성. 이미지 **Ubuntu 24.04**, Shape **VM.Standard.A1.Flex** (1 OCPU / 6GB, 무료) 또는 E2.1.Micro.
- 네트워킹: 공인 IPv4 할당 체크. SSH 키 저장.
- 생성 후 **VCN → Subnet → Security List → Ingress Rules** 에 `0.0.0.0/0  TCP 80`, `0.0.0.0/0  TCP 443` 두 줄 추가.
- 공인 IP 를 메모한다. 이 IP 는 인스턴스를 지우지 않는 한 바뀌지 않는다(예약 IP 로 바꿔두면 더 안전).

## 2. DNS
Vercel 대시보드 → Domains → `hyeso.kr` → DNS Records 에 `A  relay  <VM 공인 IP>  TTL 60` 추가.
(Caddy 가 이 도메인으로 Let's Encrypt 인증서를 자동 발급한다.)

## 3. 릴레이 설치
```bash
ssh ubuntu@<VM IP>
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
