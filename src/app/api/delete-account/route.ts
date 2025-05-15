// src/app/api/delete-account/route.ts
import { NextResponse } from 'next/server';
import { executeQuery, connectToDatabase } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete your account' },
        { status: 400 }
      );
    }
    
    // Get the user's current password hash
    const users = await executeQuery({
      query: 'SELECT password FROM users WHERE id = ?',
      values: [session.user.id]
    });
    
    if (!users || (users as any[]).length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = (users as any[])[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Delete user's data using direct connection instead of prepared statements
    try {
      // Get a direct database connection for transaction
      const connection = await connectToDatabase();
      
      try {
        // Start transaction with direct query
        await connection.query('START TRANSACTION');
        
        // Delete related data
        await connection.query('DELETE FROM user_interests WHERE user_id = ?', [session.user.id]);
        await connection.query('DELETE FROM skills WHERE user_id = ?', [session.user.id]);
        await connection.query('DELETE FROM user_activities WHERE user_id = ?', [session.user.id]);
        await connection.query('DELETE FROM social_media WHERE user_id = ?', [session.user.id]);
        await connection.query('DELETE FROM user_settings WHERE user_id = ?', [session.user.id]);
        await connection.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [session.user.id, session.user.id]);
        await connection.query('DELETE FROM notifications WHERE user_id = ?', [session.user.id]);
        
        // Delete the user
        await connection.query('DELETE FROM users WHERE id = ?', [session.user.id]);
        
        // Commit the transaction
        await connection.query('COMMIT');
        
        // Close the connection
        await connection.end();
        
      } catch (error) {
        // Rollback on error
        await connection.query('ROLLBACK');
        await connection.end();
        throw error;
      }
      
    } catch (error) {
      console.error('Database transaction error:', error);
      return NextResponse.json(
        { error: 'Failed to delete account data. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Account successfully deleted' 
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 }
    );
  }
}