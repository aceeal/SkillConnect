// src/app/api/admin/users/[userId]/status/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }
    
    const userId = params.userId;
    
    // Parse request body
    const body = await request.json();
    const { status } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    // Validate status - this is for ACCOUNT status (active/banned), not online status
    if (!['active', 'banned'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be "active" or "banned".' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const userCheck = await executeQuery({
      query: 'SELECT id, first_name, last_name FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (!Array.isArray(userCheck) || userCheck.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userCheck[0];
    
    // Update user account status
    const updateResult = await executeQuery({
      query: `
        UPDATE users
        SET account_status = ?
        WHERE id = ?
      `,
      values: [status, userId]
    });
    
    if ((updateResult as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }
    
    // Log the action in user_activities table
    try {
      await executeQuery({
        query: `
          INSERT INTO user_activities (user_id, activity_type, description)
          VALUES (?, 'account_status_change', ?)
        `,
        values: [userId, `Account status changed to ${status} by admin ${session.user.id}`]
      });
    } catch (error) {
      console.log('Could not log activity:', error.message);
    }
    
    console.log(`Admin ${session.user.id} changed user ${userId} (${user.first_name} ${user.last_name}) account status to ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `User account status updated to ${status}`,
      userId: userId,
      newStatus: status,
      userName: `${user.first_name} ${user.last_name}`
    });
  } catch (error) {
    console.error('Error updating user account status:', error);
    return NextResponse.json(
      { error: 'Failed to update user account status: ' + error.message },
      { status: 500 }
    );
  }
}