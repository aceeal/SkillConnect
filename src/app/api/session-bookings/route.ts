// src/app/api/session-bookings/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Auto-create tables if they don't exist
async function ensureTablesExist() {
  try {
    // Create session_bookings table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS session_bookings (
          id INT NOT NULL AUTO_INCREMENT,
          requester_id INT NOT NULL,
          requested_user_id INT NOT NULL,
          session_type ENUM('online', 'offline') NOT NULL DEFAULT 'online',
          scheduled_date DATE NOT NULL,
          scheduled_time TIME NOT NULL,
          notes TEXT,
          status ENUM('pending', 'accepted', 'declined', 'completed', 'cancelled') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (requested_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_requester (requester_id),
          INDEX idx_requested_user (requested_user_id),
          INDEX idx_status (status),
          INDEX idx_scheduled_date (scheduled_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `,
      values: []
    });

    // Check if notifications table needs additional columns
    const notificationColumns = await executeQuery({
      query: `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notifications'
      `,
      values: []
    });

    const hasTypeColumn = Array.isArray(notificationColumns) && 
      notificationColumns.some(col => col.COLUMN_NAME === 'type');
    const hasDataColumn = Array.isArray(notificationColumns) && 
      notificationColumns.some(col => col.COLUMN_NAME === 'data');
    const hasReferenceIdColumn = Array.isArray(notificationColumns) && 
      notificationColumns.some(col => col.COLUMN_NAME === 'reference_id');

    // Add missing columns to notifications table
    if (!hasTypeColumn) {
      await executeQuery({
        query: `ALTER TABLE notifications ADD COLUMN type ENUM('message', 'session_booking', 'system') DEFAULT 'system' AFTER user_id`,
        values: []
      });
    }

    if (!hasDataColumn) {
      await executeQuery({
        query: `ALTER TABLE notifications ADD COLUMN data JSON NULL AFTER message`,
        values: []
      });
    }

    if (!hasReferenceIdColumn) {
      await executeQuery({
        query: `ALTER TABLE notifications ADD COLUMN reference_id INT NULL AFTER data`,
        values: []
      });
    }

    console.log('Session booking tables initialized successfully');
  } catch (error) {
    console.error('Error creating session booking tables:', error);
    throw error;
  }
}

// GET - Fetch session bookings for the current user
export async function GET(request: Request) {
  try {
    await ensureTablesExist();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'
    const status = searchParams.get('status') || 'all';

    let query = `
      SELECT 
        sb.*,
        requester.first_name AS requester_first_name,
        requester.last_name AS requester_last_name,
        requester.profile_picture AS requester_picture,
        requested.first_name AS requested_first_name,
        requested.last_name AS requested_last_name,
        requested.profile_picture AS requested_picture
      FROM session_bookings sb
      JOIN users requester ON sb.requester_id = requester.id
      JOIN users requested ON sb.requested_user_id = requested.id
      WHERE 1=1
    `;

    const values = [];

    // Filter by type
    if (type === 'sent') {
      query += ' AND sb.requester_id = ?';
      values.push(session.user.id);
    } else if (type === 'received') {
      query += ' AND sb.requested_user_id = ?';
      values.push(session.user.id);
    } else {
      query += ' AND (sb.requester_id = ? OR sb.requested_user_id = ?)';
      values.push(session.user.id, session.user.id);
    }

    // Filter by status
    if (status !== 'all') {
      query += ' AND sb.status = ?';
      values.push(status);
    }

    query += ' ORDER BY sb.created_at DESC';

    const results = await executeQuery({ query, values });
    
    const bookings = Array.isArray(results) ? results.map(booking => ({
      id: booking.id,
      sessionType: booking.session_type,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time,
      notes: booking.notes,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
      requester: {
        id: booking.requester_id,
        name: `${booking.requester_first_name} ${booking.requester_last_name}`,
        profilePicture: booking.requester_picture || '/default-profile.png'
      },
      requestedUser: {
        id: booking.requested_user_id,
        name: `${booking.requested_first_name} ${booking.requested_last_name}`,
        profilePicture: booking.requested_picture || '/default-profile.png'
      }
    })) : [];

    return NextResponse.json({ success: true, bookings });

  } catch (error) {
    console.error('Error fetching session bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session bookings' },
      { status: 500 }
    );
  }
}

// POST - Create a new session booking
export async function POST(request: Request) {
  try {
    await ensureTablesExist();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestedUserId, sessionType, scheduledDate, scheduledTime, notes } = body;

    // Validation
    if (!requestedUserId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (requestedUserId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot book session with yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await executeQuery({
      query: 'SELECT id, first_name, last_name FROM users WHERE id = ?',
      values: [requestedUserId]
    });

    if (!Array.isArray(targetUser) || targetUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check for existing pending booking with same user for same date/time
    const existingBooking = await executeQuery({
      query: `
        SELECT id FROM session_bookings 
        WHERE requester_id = ? 
        AND requested_user_id = ? 
        AND scheduled_date = ? 
        AND scheduled_time = ?
        AND status = 'pending'
      `,
      values: [session.user.id, requestedUserId, scheduledDate, scheduledTime]
    });

    if (Array.isArray(existingBooking) && existingBooking.length > 0) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending booking with this user for this time' },
        { status: 400 }
      );
    }

    // Create the session booking
    const bookingResult = await executeQuery({
      query: `
        INSERT INTO session_bookings 
        (requester_id, requested_user_id, session_type, scheduled_date, scheduled_time, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [session.user.id, requestedUserId, sessionType, scheduledDate, scheduledTime, notes || null]
    });

    const bookingId = bookingResult.insertId;

    // Create notification for the requested user
    const targetUserData = targetUser[0];
    const requesterName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
    
    await executeQuery({
      query: `
        INSERT INTO notifications 
        (user_id, type, message, data, reference_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      values: [
        requestedUserId,
        'session_booking',
        `${requesterName} wants to book a ${sessionType} session with you`,
        JSON.stringify({
          bookingId,
          requesterId: session.user.id,
          requesterName,
          requesterPicture: session.user.image || '/default-profile.png',
          sessionType,
          scheduledDate,
          scheduledTime,
          notes
        }),
        bookingId
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Session booking request sent successfully',
      bookingId
    });

  } catch (error) {
    console.error('Error creating session booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session booking' },
      { status: 500 }
    );
  }
}