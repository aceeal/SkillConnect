// src/app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    
    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get messages between current user and the specified user
    const query = `
      SELECT 
        id,
        sender_id,
        receiver_id,
        text,
        is_read,
        created_at
      FROM messages
      WHERE 
        (sender_id = ? AND receiver_id = ?) OR 
        (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `;
    
    const messages = await executeQuery({
      query,
      values: [
        session.user.id, otherUserId, // current user sent to other user
        otherUserId, session.user.id  // other user sent to current user
      ]
    });
    
    // Convert all IDs to strings to ensure consistent comparison
    const processedMessages = Array.isArray(messages) 
      ? messages.map((msg: any) => ({
          ...msg,
          id: String(msg.id),
          sender_id: String(msg.sender_id),
          receiver_id: String(msg.receiver_id)
        }))
      : [];
    
    // Include the current user's ID in the response to help with message sender identification
    return NextResponse.json({ 
      messages: processedMessages,
      currentUserId: String(session.user.id)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}