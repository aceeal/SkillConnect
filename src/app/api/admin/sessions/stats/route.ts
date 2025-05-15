// src/app/api/admin/sessions/stats/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get the start date of the current week (Sunday)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Start of the day

    // Format date for MySQL
    const startDate = startOfWeek.toISOString().split('T')[0];

    // Query to get admin session stats
    const statsQuery = `
      SELECT 
        COUNT(*) as totalSessions,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as activeSessions,
        SUM(CASE WHEN started_at >= ? THEN 1 ELSE 0 END) as sessionsThisWeek,
        SUM(
          TIMESTAMPDIFF(MINUTE, started_at, 
            CASE 
              WHEN ended_at IS NULL THEN NOW() 
              ELSE ended_at 
            END
          ) / 60
        ) as totalLearningHours
      FROM live_sessions
    `;

    const result = await executeQuery({
      query: statsQuery,
      values: [startDate]
    });

    // Round learning hours to 1 decimal place
    let totalHours = result[0]?.totalLearningHours || 0;
    totalHours = Math.round(totalHours * 10) / 10;

    return NextResponse.json({ 
      totalSessions: result[0]?.totalSessions || 0,
      activeSessions: result[0]?.activeSessions || 0,
      sessionsThisWeek: result[0]?.sessionsThisWeek || 0,
      totalLearningHours: totalHours,
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