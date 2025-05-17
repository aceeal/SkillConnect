// src/app/api/admin/reports/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

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
    const status = searchParams.get('status') || 'pending';
    
    // Create appropriate query based on status filter
    let query;
    let values: any[] = [];
    
    if (status && status !== 'all') {
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
      `;
      values = [status];
    } else {
      // Get all reports regardless of status
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
      `;
    }
    
    // Execute query
    const reports = await executeQuery({
      query,
      values
    });
    
    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

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
    
    // Check if admin_notes column exists before attempting to update it
    let query;
    let values;
    
    if (adminNotes !== undefined) {
      query = `UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?`;
      values = [status, adminNotes, reportId];
    } else {
      query = `UPDATE reports SET status = ? WHERE id = ?`;
      values = [status, reportId];
    }
    
    // Update report status
    const result = await executeQuery({
      query,
      values
    });
    
    // Check if report was found and updated
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
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