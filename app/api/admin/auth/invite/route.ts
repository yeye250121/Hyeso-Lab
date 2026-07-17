import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminAuth } from '@/lib/admin/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // 1. Verify that the requester is a logged-in admin
    const adminUser = await verifyAdminAuth(req);
    if (!adminUser) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 2. Generate random invite key
    const key = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    
    // Expires in 1 hour
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 3. Insert into DB
    const { error } = await supabaseAdmin
      .from('admin_invite_keys')
      .insert({
        key,
        expires_at: expiresAt.toISOString(),
        created_by: adminUser.id,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: '초대 키 발급 완료',
      key,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Invite Key Error:', error);
    return NextResponse.json({ error: '키 발급 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
