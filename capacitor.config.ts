import type { CapacitorConfig } from '@capacitor/cli'

// 앱스토어·플레이스토어용 네이티브 껍데기. 이 프로젝트는 서버 렌더링(API·미들웨어)이라 정적 내보내기가 안 되므로
// 웹뷰가 운영 사이트를 그대로 불러온다(server.url). webDir 은 네트워크가 없을 때 보여줄 오프라인 안내 한 장뿐이다.
// 빌드: npx cap sync → android/ 는 Android Studio, ios/ 는 Xcode(맥)에서 연다.
const config: CapacitorConfig = {
  appId: 'kr.hyeso.app',
  appName: '혜택연구소',
  webDir: 'capacitor/www',
  server: {
    url: 'https://www.hyeso.kr',
    cleartext: false,
    // hyeso.kr(apex) 로 들어가도 www 로 308 리다이렉트된다. 그 외 도메인(카카오 채널 등)은 시스템 브라우저로 연다.
    allowNavigation: ['hyeso.kr', 'www.hyeso.kr'],
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    scheme: '혜택연구소',
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'], // 앱을 보고 있을 때도 배너로 보여준다
    },
    StatusBar: {
      style: 'LIGHT', // 밝은 배경 + 어두운 글자
      backgroundColor: '#ffffff',
    },
  },
}

export default config
