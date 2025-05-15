// src/app/api/user-interests/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../lib/db';
import { getServerSession } from 'next-auth'; // Import getServerSession from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'; // Use original import name

// Get user interests
export async function GET(request: Request) {
  try {
    // Check authentication
    // Pass authOptions directly, not in an array
    const session = await getServerSession(authOptions); 
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params or use session user id
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Fetch interests from database
    const userInterests = await executeQuery({
      query: 'SELECT interest FROM user_interests WHERE user_id = ?',
      values: [userId],
    });

    // Add type assertion for userInterests when mapping
    return NextResponse.json({ interests: Array.isArray(userInterests) ? (userInterests as { interest: string }[]).map(item => item.interest) : [] });
  } catch (error) {
    console.error('Error fetching user interests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    );
  }
}

// Update user interests
export async function POST(request: Request) {
  try {
    // Check authentication
    // Pass authOptions directly, not in an array
    const session = await getServerSession(authOptions); 
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { interests } = await request.json();
    const userId = session.user.id;

    if (!Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Interests must be an array' },
        { status: 400 }
      );
    }

    // First, delete existing interests
    await executeQuery({
      query: 'DELETE FROM user_interests WHERE user_id = ?',
      values: [userId],
    });

    // Then, insert new interests
    if (interests.length > 0) {
      // Create placeholder string for multiple inserts
      const placeholders = interests.map(() => '(?, ?)').join(', ');
      const values = interests.flatMap(interest => [userId, interest]);

      await executeQuery({
        query: `INSERT INTO user_interests (user_id, interest) VALUES ${placeholders}`,
        values: values,
      });
    }

    // Record this activity
    try {
      await executeQuery({
        query: 'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        values: [userId, 'profile_update', 'Updated interests'],
      });
    } catch (error) {
      console.error('Failed to record activity:', error);
      // Don't fail the request if activity recording fails
    }

    return NextResponse.json({ success: true, interestsCount: interests.length });
  } catch (error) {
    console.error('Error updating user interests:', error);
    return NextResponse.json(
      { error: 'Failed to update interests' },
      { status: 500 }
    );
  }
}
