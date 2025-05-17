// src/app/api/admin/sessions/completed/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request: Request) {
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

    // Build query for completed or terminated sessions
    let query = `
      SELECT 
        ls.id,
        ls.user1_id,
        u1.first_name as user1_first_name,
        u1.last_name as user1_last_name,
        ls.user2_id,
        u2.first_name as user2_first_name,
        u2.last_name as user2_last_name,
        ls.started_at,
        ls.ended_at,
        ls.status,
        ls.topic
      FROM live_sessions ls
      JOIN users u1 ON ls.user1_id = u1.id
      JOIN users u2 ON ls.user2_id = u2.id
      WHERE ls.status IN ('completed', 'terminated', 'disconnected')
    `;

    // Add sorting - most recent first
    query += ` ORDER BY ls.ended_at DESC LIMIT 50`;

    // Execute query
    const sessions = await executeQuery({
      query,
      values: []
    });

    // Format session data for response
    const formattedSessions = sessions.map(session => ({
      id: session.id.toString(),
      user1Id: session.user1_id.toString(),
      user1Name: `${session.user1_first_name} ${session.user1_last_name}`,
      user2Id: session.user2_id.toString(),
      user2Name: `${session.user2_first_name} ${session.user2_last_name}`,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      duration: session.ended_at ? calculateDuration(session.started_at, session.ended_at) : 'Ongoing',
      status: session.status,
      topic: session.topic || 'Knowledge Sharing'
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching completed sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch completed sessions' },
      { status: 500 }
    );
  }
}

// Helper function to calculate session duration
function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}