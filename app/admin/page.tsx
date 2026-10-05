import { redirect } from 'next/navigation';

// /admin 자체에는 화면이 없다. 로그인 상태면 대시보드로 보낸다(비로그인은 미들웨어가 로그인으로 보낸다).
export default function AdminIndex() {
  redirect('/admin/dashboard');
}
