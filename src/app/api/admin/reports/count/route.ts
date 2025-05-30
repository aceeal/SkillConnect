// src/app/api/admin/reports/count/route.ts
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

    // Query to count total and pending reports
    const countQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
      FROM reports
    `;

    const result = await executeQuery({
      query: countQuery,
      values: []
    });

    console.log('Report counts:', result[0]);

    return NextResponse.json({ 
      total: result[0]?.total || 0,
      pending: result[0]?.pending || 0,
      reviewed: result[0]?.reviewed || 0,
      resolved: result[0]?.resolved || 0,
      success: true 
    });

  } catch (error) {
    console.error('Error fetching report counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report counts' },
      { status: 500 }
    );
  }
}