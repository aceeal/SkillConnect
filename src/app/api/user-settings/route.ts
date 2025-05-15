// src/app/api/user-settings/route.ts
import { executeQuery } from '../../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    // Get the user session for authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get userId from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('GET settings request for userId:', userId);
    console.log('Session user ID:', session.user.id);
    console.log('Session user role:', session.user.role);
    
    // Verify that the requested userId matches the session user's id
    // or the user is an admin (can view any user's settings)
    // Convert both to strings for proper comparison
    const sessionUserId = String(session.user.id);
    const requestedUserId = String(userId);
    
    console.log('Comparing session ID:', sessionUserId, 'with requested ID:', requestedUserId);
    
    if (requestedUserId !== sessionUserId && session.user.role !== 'admin') {
      console.log('Unauthorized: IDs do not match and user is not admin');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: `Session user ID (${sessionUserId}) does not match requested user ID (${requestedUserId})`,
        role: session.user.role
      }, { status: 403 });
    }
    
    // Query the database for user settings
    const results = await executeQuery({
      query: `
        SELECT * FROM user_settings 
        WHERE user_id = ?
      `,
      values: [userId]
    });
    
    console.log('Query results:', results);
    
    // If no settings found, return default settings
    if (!results || (results as any[]).length === 0) {
      console.log('No settings found, returning defaults');
      
      return NextResponse.json({
        user_id: userId,
        profile_visibility: 'all',
        show_skills: true,
        show_interests: true,
        allow_messages: 'all',
        default_mic_state: true,
        default_camera_state: true
      });
    }
    
    // Return the user settings
    console.log('Returning settings:', results[0]);
    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings', details: error.message },
      { status: 500 }
    );
  }
}

// API route to update user settings
export async function POST(request: NextRequest) {
  try {
    // Get the user session for authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const data = await request.json();
    const { userId, settings } = data;
    
    console.log('POST settings request:', { userId, settings });
    console.log('Session user ID:', session.user.id);
    console.log('Session user role:', session.user.role);
    
    // Verify that the requested userId matches the session user's id
    // or the user is an admin (can update any user's settings)
    // Convert both to strings for proper comparison
    const sessionUserId = String(session.user.id);
    const requestedUserId = String(userId);
    
    console.log('Comparing session ID:', sessionUserId, 'with requested ID:', requestedUserId);
    
    if (requestedUserId !== sessionUserId && session.user.role !== 'admin') {
      console.log('Unauthorized: IDs do not match and user is not admin');
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: `Session user ID (${sessionUserId}) does not match requested user ID (${requestedUserId})`,
        role: session.user.role
      }, { status: 403 });
    }
    
    // Check if settings already exist for this user
    const existingSettings = await executeQuery({
      query: 'SELECT id FROM user_settings WHERE user_id = ?',
      values: [userId]
    });
    
    console.log('Existing settings check:', existingSettings);
    
    let result;
    
    if ((existingSettings as any[]).length === 0) {
      // Insert new settings
      console.log('Inserting new settings');
      result = await executeQuery({
        query: `
          INSERT INTO user_settings (
            user_id, 
            profile_visibility, 
            show_skills, 
            show_interests, 
            allow_messages, 
            default_mic_state, 
            default_camera_state
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          userId,
          settings.profile_visibility || 'all',
          settings.show_skills !== undefined ? settings.show_skills : true,
          settings.show_interests !== undefined ? settings.show_interests : true,
          settings.allow_messages || 'all',
          settings.default_mic_state !== undefined ? settings.default_mic_state : true,
          settings.default_camera_state !== undefined ? settings.default_camera_state : true
        ]
      });
      
      console.log('Insert result:', result);
    } else {
      // Update existing settings
      console.log('Updating existing settings');
      result = await executeQuery({
        query: `
          UPDATE user_settings 
          SET 
            profile_visibility = ?,
            show_skills = ?,
            show_interests = ?,
            allow_messages = ?,
            default_mic_state = ?,
            default_camera_state = ?
          WHERE user_id = ?
        `,
        values: [
          settings.profile_visibility || 'all',
          settings.show_skills !== undefined ? settings.show_skills : true,
          settings.show_interests !== undefined ? settings.show_interests : true,
          settings.allow_messages || 'all',
          settings.default_mic_state !== undefined ? settings.default_mic_state : true,
          settings.default_camera_state !== undefined ? settings.default_camera_state : true,
          userId
        ]
      });
      
      console.log('Update result:', result);
    }
    
    // Return success response
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings', details: error.message },
      { status: 500 }
    );
  }
}