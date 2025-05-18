// src/app/api/user/check-status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { executeQuery } from '../../../../../lib/db';

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check account status from database
    const users = await executeQuery({
      query: 'SELECT account_status FROM users WHERE id = ?',
      values: [session.user.id]
    });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const accountStatus = user.account_status;

    // Return account status
    return NextResponse.json({
      accountStatus,
      isBanned: accountStatus === 'banned',
      userId: session.user.id
    });

  } catch (error) {
    console.error('Error checking account status:', error);
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    );
  }
}