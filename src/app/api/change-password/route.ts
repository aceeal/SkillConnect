// src/app/api/change-password/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
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

    // Parse the request body
    const body = await request.json();
    const userId = body.userId || session.user.id;
    
    // Verify the user is only changing their own password unless they're an admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to change this password' }, { status: 403 });
    }
    
    // Get current password and new password from request
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    // Get user's current password hash from database
    const users = await executeQuery({
      query: 'SELECT password FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await executeQuery({
      query: 'UPDATE users SET password = ? WHERE id = ?',
      values: [hashedNewPassword, userId]
    });
    
    // Record this activity
    try {
      // Check if user_activities table exists, if not create it
      try {
        await executeQuery({
          query: 'SELECT 1 FROM user_activities LIMIT 1',
          values: []
        });
      } catch (error) {
        // Create the table if it doesn't exist
        await executeQuery({
          query: `
            CREATE TABLE IF NOT EXISTS user_activities (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              activity_type VARCHAR(50) NOT NULL,
              description TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `,
          values: []
        });
      }
      
      await executeQuery({
        query: 'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        values: [userId, 'security_update', 'Changed account password']
      });
    } catch (error) {
      console.error('Failed to record activity:', error);
      // Don't fail the request if activity recording fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing password.' },
      { status: 500 }
    );
  }
}