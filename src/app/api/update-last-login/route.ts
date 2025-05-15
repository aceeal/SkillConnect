// src/app/api/update-last-login/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update the last_login timestamp
    await executeQuery({
      query: 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      values: [session.user.id]
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating last login:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating last login.' },
      { status: 500 }
    );
  }
}