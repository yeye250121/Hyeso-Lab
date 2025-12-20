const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'piooom_jwt_secret_key_2025_production_change_this';

// S00001 사용자로 토큰 생성
const token = jwt.sign(
  {
    id: 'ba9887c6-bcfc-4560-95d4-513aa73b32e2',
    loginId: 'siwwyy1012',
    level: 1,
    uniqueCode: 'S00001',
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('=== 생성된 JWT 토큰 ===');
console.log(token);
console.log('\n=== 토큰 디코딩 결과 ===');

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log(decoded);
  console.log('\n=== S 코드 체크 ===');
  console.log('uniqueCode:', decoded.uniqueCode);
  console.log('S로 시작하는가?', decoded.uniqueCode.startsWith('S'));
} catch (error) {
  console.error('토큰 검증 실패:', error.message);
}
