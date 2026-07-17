const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('hi1012@@', 10);
  console.log(`INSERT INTO admin_users (login_id, password_hash, unique_code, nickname) VALUES ('siwwyy1012', '${hash}', 'S-MASTER', '최고 관리자');`);
}

main();
