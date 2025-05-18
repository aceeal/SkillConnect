// src/app/api/admin/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function DELETE(
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
    
    // Prevent admin from deleting themselves
    if (session.user.id === parseInt(userId)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Check if user exists and get their info for logging
    const userCheck = await executeQuery({
      query: 'SELECT id, first_name, last_name, email FROM users WHERE id = ?',
      values: [userId]
    });
    
    if (!Array.isArray(userCheck) || userCheck.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userToDelete = userCheck[0];
    
    // Check if the user is an admin
    const adminCheck = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ? AND role = "admin"',
      values: [userId]
    });
    
    if (Array.isArray(adminCheck) && adminCheck.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 400 }
      );
    }
    
    // Start transaction - delete user and all related data
    try {
      // Delete from dependent tables first (foreign key constraints)
      
      // Delete user skills
      await executeQuery({
        query: 'DELETE FROM skills WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete user interests
      await executeQuery({
        query: 'DELETE FROM user_interests WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete user settings
      await executeQuery({
        query: 'DELETE FROM user_settings WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete user activities
      await executeQuery({
        query: 'DELETE FROM user_activities WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete social media links
      await executeQuery({
        query: 'DELETE FROM social_media WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete messages sent by user
      await executeQuery({
        query: 'DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?',
        values: [userId, userId]
      });
      
      // Delete notifications for this user
      await executeQuery({
        query: 'DELETE FROM notifications WHERE user_id = ?',
        values: [userId]
      });
      
      // Delete reports made by this user
      await executeQuery({
        query: 'DELETE FROM reports WHERE reported_by_user_id = ?',
        values: [userId]
      });
      
      // Update reports about this user to remove user references
      await executeQuery({
        query: 'UPDATE reports SET reported_user_id = NULL WHERE reported_user_id = ?',
        values: [userId]
      });
      
      // Finally, delete the user
      const deleteResult = await executeQuery({
        query: 'DELETE FROM users WHERE id = ?',
        values: [userId]
      });
      
      // Log the deletion for audit purposes
      console.log(`Admin ${session.user.id} deleted user ${userId} (${userToDelete.first_name} ${userToDelete.last_name}, ${userToDelete.email})`);
      
      return NextResponse.json({
        success: true,
        message: `User account deleted successfully`,
        deletedUser: {
          id: userToDelete.id,
          name: `${userToDelete.first_name} ${userToDelete.last_name}`,
          email: userToDelete.email
        }
      });
      
    } catch (deleteError) {
      console.error('Error during user deletion:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account: ' + deleteError.message },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user: ' + error.message },
      { status: 500 }
    );
  }
}

// Optional: GET method to fetch user details for admin
export async function GET(
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
    
    // Fetch user details
    const user = await executeQuery({
      query: `
        SELECT 
          id,
          first_name,
          last_name,
          email,
          profile_picture,
          bio,
          role,
          created_at,
          last_login,
          status
        FROM users 
        WHERE id = ?
      `,
      values: [userId]
    });
    
    if (!Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = user[0];
    
    // Also fetch skills and interests
    const [skills, interests] = await Promise.all([
      executeQuery({
        query: 'SELECT skill FROM skills WHERE user_id = ?',
        values: [userId]
      }),
      executeQuery({
        query: 'SELECT interest FROM user_interests WHERE user_id = ?',
        values: [userId]
      })
    ]);
    
    return NextResponse.json({
      user: {
        ...userData,
        firstName: userData.first_name,
        lastName: userData.last_name,
        profilePicture: userData.profile_picture,
        createdAt: userData.created_at,
        lastLogin: userData.last_login,
        skills: Array.isArray(skills) ? skills.map(s => s.skill) : [],
        interests: Array.isArray(interests) ? interests.map(i => i.interest) : []
      }
    });
    
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}