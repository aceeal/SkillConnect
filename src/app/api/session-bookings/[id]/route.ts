// src/app/api/session-bookings/[id]/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// PUT - Update session booking status (accept/decline)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { action } = body; // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the booking details
    const booking = await executeQuery({
      query: `
        SELECT 
          sb.*,
          requester.first_name AS requester_first_name,
          requester.last_name AS requester_last_name
        FROM session_bookings sb
        JOIN users requester ON sb.requester_id = requester.id
        WHERE sb.id = ?
      `,
      values: [bookingId]
    });

    if (!Array.isArray(booking) || booking.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session booking not found' },
        { status: 404 }
      );
    }

    const bookingData = booking[0];

    // Check if user is the requested user (can only accept/decline requests made to them)
    if (bookingData.requested_user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only respond to bookings made to you' },
        { status: 403 }
      );
    }

    // Check if booking is still pending
    if (bookingData.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'This booking has already been responded to' },
        { status: 400 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    // Update the booking status
    await executeQuery({
      query: 'UPDATE session_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      values: [newStatus, bookingId]
    });

    // Create notification for the requester
    const requesterName = `${bookingData.requester_first_name} ${bookingData.requester_last_name}`;
    const responderName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
    
    const message = action === 'accept' 
      ? `${responderName} accepted your session booking request`
      : `${responderName} declined your session booking request`;

    await executeQuery({
      query: `
        INSERT INTO notifications 
        (user_id, type, message, data, reference_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      values: [
        bookingData.requester_id,
        'session_booking',
        message,
        JSON.stringify({
          bookingId,
          action,
          responderName,
          responderPicture: session.user.image || '/default-profile.png',
          sessionType: bookingData.session_type,
          scheduledDate: bookingData.scheduled_date,
          scheduledTime: bookingData.scheduled_time,
          notes: bookingData.notes // Include the original notes
        }),
        bookingId
      ]
    });

    return NextResponse.json({
      success: true,
      message: `Session booking ${action}ed successfully`,
      status: newStatus
    });

  } catch (error) {
    console.error('Error updating session booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session booking' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a session booking
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Get the booking details
    const booking = await executeQuery({
      query: 'SELECT * FROM session_bookings WHERE id = ?',
      values: [bookingId]
    });

    if (!Array.isArray(booking) || booking.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session booking not found' },
        { status: 404 }
      );
    }

    const bookingData = booking[0];

    // Check if user is either the requester or the requested user
    if (bookingData.requester_id !== session.user.id && bookingData.requested_user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You can only cancel your own bookings' },
        { status: 403 }
      );
    }

    // Update booking status to cancelled
    await executeQuery({
      query: 'UPDATE session_bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      values: ['cancelled', bookingId]
    });

    // Notify the other party
    const otherUserId = bookingData.requester_id === session.user.id 
      ? bookingData.requested_user_id 
      : bookingData.requester_id;

    const cancellerName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;

    await executeQuery({
      query: `
        INSERT INTO notifications 
        (user_id, type, message, data, reference_id)
        VALUES (?, ?, ?, ?, ?)
      `,
      values: [
        otherUserId,
        'session_booking',
        `${cancellerName} cancelled the session booking`,
        JSON.stringify({
          bookingId,
          action: 'cancelled',
          cancellerName,
          cancellerPicture: session.user.image || '/default-profile.png',
          sessionType: bookingData.session_type,
          scheduledDate: bookingData.scheduled_date,
          scheduledTime: bookingData.scheduled_time,
          notes: bookingData.notes // Include the original notes
        }),
        bookingId
      ]
    });

    return NextResponse.json({
      success: true,
      message: 'Session booking cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling session booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel session booking' },
      { status: 500 }
    );
  }
}