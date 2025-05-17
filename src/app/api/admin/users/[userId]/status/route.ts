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
    
    // Validate status
    if (!['active', 'banned'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value. Must be "active" or "banned".' },
        { status: 400 }
      );
    }
    
    // Update user status
    await executeQuery({
      query: `
        UPDATE users
        SET status = ?
        WHERE id = ?
      `,
      values: [status, userId]
    });
    
    // Log the action
    console.log(`Admin ${session.user.id} changed user ${userId} status to ${status}`);
    
    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}