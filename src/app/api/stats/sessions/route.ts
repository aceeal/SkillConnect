// src/app/api/stats/sessions/route.ts
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
    
    // Get the start date of the current week (Sunday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day
    
    // Format date for MySQL
    const startDate = startOfWeek.toISOString().split('T')[0];
    
    // Query to get sessions count for current week
    const sessionsQuery = `
      SELECT COUNT(*) as sessionCount
      FROM live_sessions
      WHERE (user1_id = ? OR user2_id = ?)
      AND started_at >= ?
      AND (status = 'completed' OR status = 'ongoing')
    `;
    
    const result = await executeQuery({
      query: sessionsQuery,
      values: [userId, userId, startDate]
    });
    
    // Extract count from result
    const sessionCount = result[0]?.sessionCount || 0;
    
    return NextResponse.json({ 
      sessionsThisWeek: sessionCount,
      success: true 
    });
    
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session statistics' },
      { status: 500 }
    );
  }
}