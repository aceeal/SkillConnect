// src/app/api/admin/sessions/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

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

    // Get URL params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Build query based on filters
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
        ls.status
      FROM live_sessions ls
      JOIN users u1 ON ls.user1_id = u1.id
      JOIN users u2 ON ls.user2_id = u2.id
    `;

    const values: any[] = [];

    if (status && status !== 'all') {
      query += ` WHERE ls.status = ?`;
      values.push(status);
    }

    query += ` ORDER BY ls.started_at DESC`;

    // Execute query
    const sessions = await executeQuery({
      query,
      values
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
      topic: 'Knowledge Sharing' // This would come from another table in a real implementation
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
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

// API route to terminate a session
export async function POST(request: Request) {
  if (request.url.includes('/terminate')) {
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

      // Extract session ID from URL
      const sessionId = new URL(request.url).pathname.split('/').pop();
      
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Session ID is required' },
          { status: 400 }
        );
      }

      // Update session status to cancelled and set end time
      const updateQuery = `
        UPDATE live_sessions 
        SET status = 'cancelled', ended_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'ongoing'
      `;

      const result = await executeQuery({
        query: updateQuery,
        values: [sessionId]
      });

      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          { error: 'Session not found or already ended' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        message: 'Session terminated successfully',
        success: true
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      return NextResponse.json(
        { error: 'Failed to terminate session' },
        { status: 500 }
      );
    }
  }
  
  return NextResponse.json(
    { error: 'Invalid operation' },
    { status: 400 }
  );
}