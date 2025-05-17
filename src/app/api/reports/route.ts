// src/app/api/reports/route.ts
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
    
    // Parse request body
    const body = await request.json();
    const { reportedUserId, reason, additionalInfo } = body;
    
    if (!reportedUserId || !reason) {
      return NextResponse.json(
        { error: 'Reported user ID and reason are required' },
        { status: 400 }
      );
    }
    
    // Format reason text for storing
    let fullReason = reason;
    if (additionalInfo) {
      fullReason = `${reason}: ${additionalInfo}`;
    }
    
    // Check if reportedUserId is a valid integer
    let reportedUserIdNumber: number;
    
    try {
      // If it's already a number, use it directly
      if (typeof reportedUserId === 'number') {
        reportedUserIdNumber = reportedUserId;
      } else {
        // Try to parse the ID as an integer 
        reportedUserIdNumber = parseInt(reportedUserId, 10);
        
        // Check if parsing resulted in a valid number
        if (isNaN(reportedUserIdNumber)) {
          throw new Error('Invalid user ID format');
        }
      }
    } catch (error) {
      console.error('Error converting user ID:', error);
      return NextResponse.json(
        { error: 'Invalid user ID format. Expected a numeric ID.' },
        { status: 400 }
      );
    }
    
    // Insert the report into the database with the parsed integer ID
    await executeQuery({
      query: `
        INSERT INTO reports (
          reported_user_id,
          reported_by_user_id,
          reason,
          status,
          created_at
        ) VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `,
      values: [reportedUserIdNumber, session.user.id, fullReason]
    });
    
    // Log the report for administrative purposes
    console.log(`Report submitted: User ${session.user.id} reported user ${reportedUserIdNumber} for ${reason}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Report submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reports for admin users
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Handle pagination parameters safely
    const limit = parseInt(searchParams.get('limit') || '100', 10); // Increased default limit
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Log the status parameter to debug
    console.log('Reports API - Status filter:', status);
    
    // Use different query construction approaches based on status
    let query;
    let values = [];
    
    if (!status || status === 'all') {
      // Handle 'all' status by not filtering on status
      query = `
        SELECT 
          r.id,
          r.reported_user_id,
          r.reported_by_user_id,
          r.reason,
          r.status,
          r.created_at,
          u1.first_name AS reported_user_first_name,
          u1.last_name AS reported_user_last_name,
          u2.first_name AS reporter_first_name,
          u2.last_name AS reporter_last_name
        FROM 
          reports r
        JOIN 
          users u1 ON r.reported_user_id = u1.id
        JOIN 
          users u2 ON r.reported_by_user_id = u2.id
        ORDER BY 
          r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      values = []; // No parameters needed for this query
    } else {
      // Filter by specific status
      query = `
        SELECT 
          r.id,
          r.reported_user_id,
          r.reported_by_user_id,
          r.reason,
          r.status,
          r.created_at,
          u1.first_name AS reported_user_first_name,
          u1.last_name AS reported_user_last_name,
          u2.first_name AS reporter_first_name,
          u2.last_name AS reporter_last_name
        FROM 
          reports r
        JOIN 
          users u1 ON r.reported_user_id = u1.id
        JOIN 
          users u2 ON r.reported_by_user_id = u2.id
        WHERE 
          r.status = ?
        ORDER BY 
          r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      values = [status];
    }
    
    // Execute query with the appropriate values array
    const reports = await executeQuery({
      query,
      values
    });
    
    // Log the count of reports returned
    console.log(`Reports API - Found ${reports.length} reports`);
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update report status (for admins)
export async function PATCH(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Parse request body
    const body = await request.json();
    const { reportId, status, adminNotes } = body;
    
    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Report ID and status are required' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Use parameterized query to prevent SQL injection
    const updateQuery = `
      UPDATE reports
      SET status = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await executeQuery({
      query: updateQuery,
      values: [status, reportId]
    });
    
    // Log the update
    console.log(`Report ${reportId} status updated to ${status} by admin ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: `Report status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}