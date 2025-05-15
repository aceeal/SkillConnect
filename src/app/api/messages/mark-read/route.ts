// src/app/api/messages/mark-read/route.ts
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
    const { senderId } = body;
    
    if (!senderId) {
      return NextResponse.json(
        { error: 'Sender ID is required' },
        { status: 400 }
      );
    }
    
    // Ensure consistent string IDs
    const currentUserId = String(session.user.id);
    const senderIdString = String(senderId);
    
    // Mark messages as read
    // This only marks messages where:
    // 1. Current user is the receiver
    // 2. The specified sender is the sender
    // 3. Messages are currently unread
    const result = await executeQuery({
      query: `
        UPDATE messages 
        SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `,
      values: [senderIdString, currentUserId]
    });
    
    return NextResponse.json({ 
      success: true,
      updatedCount: (result as any).affectedRows || 0
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}