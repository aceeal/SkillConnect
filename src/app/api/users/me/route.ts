// src/app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the user's profile
    const query = `
      SELECT 
        id,
        first_name AS firstName,
        last_name AS lastName,
        email,
        profile_picture AS profilePicture
      FROM users
      WHERE id = ?
    `;
    
    const results = await executeQuery({
      query,
      values: [userId],
    });
    
    const profile = Array.isArray(results) && results.length > 0 ? results[0] : null;
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}