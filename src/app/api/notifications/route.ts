// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// GET - Fetch notifications for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Build query step by step to avoid parameter binding issues
    let query = 'SELECT id, type, message, data, reference_id, is_read, created_at FROM notifications WHERE user_id = ?';
    let values = [Number(session.user.id)];

    // Add type filter if needed
    if (type !== 'all') {
      query += ' AND type = ?';
      values.push(type);
    }

    // Add unread filter if needed
    if (unreadOnly) {
      query += ' AND is_read = 0';
    }

    // Add ordering and limit directly in query to avoid parameter issues
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;

    console.log('Executing notifications query:', query);
    console.log('With values:', values);

    const results = await executeQuery({ query, values });
    
    const notifications = Array.isArray(results) ? results.map(notification => ({
      id: notification.id,
      type: notification.type || 'system',
      message: notification.message || '',
      data: notification.data ? (typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data) : null,
      referenceId: notification.reference_id,
      isRead: Boolean(notification.is_read),
      createdAt: notification.created_at
    })) : [];

    // Get unread count with a separate simpler query
    const unreadCountQuery = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0';
    const unreadCountResult = await executeQuery({
      query: unreadCountQuery,
      values: [Number(session.user.id)]
    });

    const unreadCount = Array.isArray(unreadCountResult) && unreadCountResult.length > 0 
      ? Number(unreadCountResult[0].count) || 0
      : 0;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error('Detailed error fetching notifications:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mark notifications as read
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await executeQuery({
        query: 'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        values: [Number(session.user.id)]
      });
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Convert to numbers and create individual update queries to avoid parameter binding issues
      const numericIds = notificationIds.map(id => Number(id)).filter(id => !isNaN(id));
      
      if (numericIds.length > 0) {
        // Build query with hardcoded IDs to avoid parameter binding issues
        const idsString = numericIds.join(',');
        const updateQuery = `UPDATE notifications SET is_read = 1 WHERE id IN (${idsString}) AND user_id = ?`;
        
        await executeQuery({
          query: updateQuery,
          values: [Number(session.user.id)]
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('delete_all') === 'true';

    if (deleteAll) {
      // Delete all notifications for this user
      await executeQuery({
        query: 'DELETE FROM notifications WHERE user_id = ?',
        values: [Number(session.user.id)]
      });
    } else if (notificationId) {
      // Delete specific notification
      const numericId = Number(notificationId);
      if (!isNaN(numericId)) {
        await executeQuery({
          query: 'DELETE FROM notifications WHERE id = ? AND user_id = ?',
          values: [numericId, Number(session.user.id)]
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing notification ID or delete_all parameter' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}