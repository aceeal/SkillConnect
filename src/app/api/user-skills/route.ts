// src/app/api/user-skills/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Get user skills
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params or use session user id
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Fetch skills from database
    const userSkills = await executeQuery({
      query: 'SELECT skill FROM skills WHERE user_id = ?',
      values: [userId],
    });

    return NextResponse.json({ skills: Array.isArray(userSkills) ? userSkills.map(item => item.skill) : [] });
  } catch (error) {
    console.error('Error fetching user skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// Update user skills
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { skills } = await request.json();
    const userId = session.user.id;

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: 'Skills must be an array' },
        { status: 400 }
      );
    }

    // First, delete existing skills
    await executeQuery({
      query: 'DELETE FROM skills WHERE user_id = ?',
      values: [userId],
    });

    // Then, insert new skills
    if (skills.length > 0) {
      // Create placeholder string for multiple inserts
      const placeholders = skills.map(() => '(?, ?)').join(', ');
      const values = skills.flatMap(skill => [userId, skill]);

      await executeQuery({
        query: `INSERT INTO skills (user_id, skill) VALUES ${placeholders}`,
        values: values,
      });
    }

    // Record this activity
    try {
      await executeQuery({
        query: 'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        values: [userId, 'profile_update', 'Updated skills'],
      });
    } catch (error) {
      console.error('Failed to record activity:', error);
      // Don't fail the request if activity recording fails
    }

    return NextResponse.json({ success: true, skillsCount: skills.length });
  } catch (error) {
    console.error('Error updating user skills:', error);
    return NextResponse.json(
      { error: 'Failed to update skills' },
      { status: 500 }
    );
  }
}

