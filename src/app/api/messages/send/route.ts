import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { receiverId, text } = body;
    
    if (!receiverId || !text) {
      return NextResponse.json(
        { error: 'Receiver ID and message text are required' },
        { status: 400 }
      );
    }
    
    // Check if receiver exists
    const receiverExists = await executeQuery({
      query: 'SELECT id FROM users WHERE id = ?',
      values: [receiverId]
    });
    
    if (!Array.isArray(receiverExists) || receiverExists.length === 0) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }
    
    // Make sure sender_id is always stored as the current user's ID to prevent confusion
    // This ensures consistent sender/receiver identification
    const senderId = String(session.user.id);
    
    // Insert message into database
    const result = await executeQuery({
      query: `
        INSERT INTO messages 
        (sender_id, receiver_id, text, is_read)
        VALUES (?, ?, ?, 0)
      `,
      values: [senderId, receiverId, text]
    });
    
    // Get the inserted message
    const insertId = (result as any).insertId;
    const message = await executeQuery({
      query: 'SELECT * FROM messages WHERE id = ?',
      values: [insertId]
    });
    
    if (!Array.isArray(message) || message.length === 0) {
      throw new Error('Failed to retrieve inserted message');
    }
    
    // Make sure the returned message has IDs as strings
    const messageWithStringIds = {
      ...message[0],
      id: String(message[0].id),
      sender_id: String(message[0].sender_id),
      receiver_id: String(message[0].receiver_id)
    };
    
    return NextResponse.json({
      success: true,
      message: messageWithStringIds
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}