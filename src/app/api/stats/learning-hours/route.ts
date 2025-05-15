// src/app/api/stats/learning-hours/route.ts
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
    
    // Query to calculate total learning hours
    const hoursQuery = `
      SELECT 
        SUM(
          TIMESTAMPDIFF(MINUTE, started_at, 
            CASE 
              WHEN ended_at IS NULL THEN NOW() 
              ELSE ended_at 
            END
          ) / 60
        ) as totalHours
      FROM live_sessions
      WHERE (user1_id = ? OR user2_id = ?)
      AND (status = 'completed' OR status = 'ongoing')
    `;
    
    const result = await executeQuery({
      query: hoursQuery,
      values: [userId, userId]
    });
    
    // Extract hours from result, round to 1 decimal place
    let totalHours = result[0]?.totalHours || 0;
    totalHours = Math.round(totalHours * 10) / 10; // Round to 1 decimal
    
    return NextResponse.json({ 
      learningHours: totalHours,
      success: true 
    });
    
  } catch (error) {
    console.error('Error fetching learning hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning hours' },
      { status: 500 }
    );
  }
}