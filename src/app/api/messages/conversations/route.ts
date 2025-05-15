// src/app/api/messages/conversations/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = String(session.user.id);
    
    console.log(`Fetching conversations for user ID: ${userId}`);
    
    // Get unique users that the current user has had conversations with
    const query = `
      SELECT 
        u.id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.email,
        u.profile_picture AS profilePicture,
        (u.last_login > DATE_SUB(NOW(), INTERVAL 15 MINUTE)) AS isOnline,
        (
          SELECT COUNT(*) 
          FROM messages 
          WHERE sender_id = u.id 
          AND receiver_id = ?
          AND is_read = 0
        ) AS unreadCount,
        (
          SELECT JSON_OBJECT(
            'id', m.id,
            'text', m.text,
            'sender_id', m.sender_id,
            'receiver_id', m.receiver_id,
            'is_read', m.is_read,
            'created_at', m.created_at
          )
          FROM messages m
          WHERE (
            (m.sender_id = u.id AND m.receiver_id = ?) OR 
            (m.sender_id = ? AND m.receiver_id = u.id)
          )
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS lastMessage
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = ? THEN receiver_id
            ELSE sender_id
          END AS other_user_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      )
      ORDER BY 
        (
          SELECT MAX(created_at) 
          FROM messages 
          WHERE (sender_id = u.id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.id)
        ) DESC
    `;
    
    const conversations = await executeQuery({
      query,
      values: [
        userId, // For unreadCount
        userId, // For lastMessage receiver_id condition 1
        userId, // For lastMessage sender_id condition 2
        userId, // For other_user_id when sender_id = userId
        userId, // For other_user_id when sender_id = userId OR
        userId, // For other_user_id when receiver_id = userId
        userId, // For ORDER BY when receiver_id = userId
        userId, // For ORDER BY when sender_id = userId
      ],
    });

    console.log(`Found ${Array.isArray(conversations) ? conversations.length : 0} conversations`);
    
    // Process conversations to ensure consistent data types
    const processedConversations = Array.isArray(conversations) 
      ? conversations.map(conv => {
          // Ensure user ID is a string
          const userId = String(conv.userId);
          
          // Parse the lastMessage JSON if it's a string
          let lastMessageData = null;
          if (conv.lastMessage) {
            try {
              // Check if lastMessage is already an object or a string that needs parsing
              lastMessageData = typeof conv.lastMessage === 'string'
                ? JSON.parse(conv.lastMessage)
                : conv.lastMessage;
              
              // Convert IDs to strings
              if (lastMessageData) {
                lastMessageData.id = String(lastMessageData.id);
                lastMessageData.sender_id = String(lastMessageData.sender_id);
                lastMessageData.receiver_id = String(lastMessageData.receiver_id);
              }
            } catch (error) {
              console.error('Error parsing lastMessage JSON:', error);
            }
          }
          
          return {
            ...conv,
            userId,
            lastMessage: lastMessageData
          };
        })
      : [];

    return NextResponse.json({ conversations: processedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}