// src/app/api/update-profile/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

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
    
    // Security check - users can only update their own profile unless they're admin
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to update this profile' }, { status: 403 });
    }
    
    // Build the update query dynamically based on provided fields
    const updateFields = [];
    const values = [];
    
    // Check which fields are provided and add them to the update
    if (body.firstName !== undefined) {
      updateFields.push('first_name = ?');
      values.push(body.firstName);
    }
    
    if (body.lastName !== undefined) {
      updateFields.push('last_name = ?');
      values.push(body.lastName);
    }
    
    if (body.email !== undefined) {
      updateFields.push('email = ?');
      values.push(body.email);
    }
    
    if (body.bio !== undefined) {
      updateFields.push('bio = ?');
      values.push(body.bio);
    }
    
    if (body.profilePicture !== undefined) {
      updateFields.push('profile_picture = ?');
      values.push(body.profilePicture);
    }
    
    if (body.phoneNumber !== undefined) {
      updateFields.push('phone_number = ?');
      values.push(body.phoneNumber);
    }
    
    if (body.location !== undefined) {
      updateFields.push('location = ?');
      values.push(body.location);
    }
    
    // If no fields to update, return early only if social media updates aren't present
    if (updateFields.length === 0 && body.facebook === undefined && body.twitter === undefined) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    
    // Only execute the update query if there are fields to update
    if (updateFields.length > 0) {
      // Add userId to values array for the WHERE clause
      values.push(userId);
      
      // Execute the update query
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      await executeQuery({
        query,
        values
      });
    }
    
    // Handle social media updates if present
    if (body.facebook !== undefined || body.twitter !== undefined) {
      console.log('Social media update requested:', { facebook: body.facebook, twitter: body.twitter });
      
      // First check if records exist
      const existingRecords = await executeQuery({
        query: 'SELECT id, platform FROM social_media WHERE user_id = ?',
        values: [userId]
      });
      
      console.log('Existing social media records:', existingRecords);
      
      if (Array.isArray(existingRecords)) {
        // Build a map of platform -> id for easier lookup
        const platforms = existingRecords.reduce((acc, record) => {
          acc[record.platform] = record.id;
          return acc;
        }, {});
        
        // Update Facebook if provided
        if (body.facebook !== undefined) {
          if (platforms['facebook']) {
            await executeQuery({
              query: 'UPDATE social_media SET url = ? WHERE id = ?',
              values: [body.facebook, platforms['facebook']]
            });
            console.log('Updated existing Facebook record');
          } else {
            await executeQuery({
              query: 'INSERT INTO social_media (user_id, platform, url) VALUES (?, "facebook", ?)',
              values: [userId, body.facebook]
            });
            console.log('Inserted new Facebook record');
          }
        }
        
        // Update Twitter if provided
        if (body.twitter !== undefined) {
          if (platforms['twitter']) {
            await executeQuery({
              query: 'UPDATE social_media SET url = ? WHERE id = ?',
              values: [body.twitter, platforms['twitter']]
            });
            console.log('Updated existing Twitter record');
          } else {
            await executeQuery({
              query: 'INSERT INTO social_media (user_id, platform, url) VALUES (?, "twitter", ?)',
              values: [userId, body.twitter]
            });
            console.log('Inserted new Twitter record');
          }
        }
      } else {
        // No records exist, insert new ones
        if (body.facebook !== undefined) {
          await executeQuery({
            query: 'INSERT INTO social_media (user_id, platform, url) VALUES (?, "facebook", ?)',
            values: [userId, body.facebook]
          });
          console.log('Inserted new Facebook record (no existing records)');
        }
        
        if (body.twitter !== undefined) {
          await executeQuery({
            query: 'INSERT INTO social_media (user_id, platform, url) VALUES (?, "twitter", ?)',
            values: [userId, body.twitter]
          });
          console.log('Inserted new Twitter record (no existing records)');
        }
      }
    }
    
    // Record this activity
    try {
      await executeQuery({
        query: 'INSERT INTO user_activities (user_id, activity_type, description) VALUES (?, ?, ?)',
        values: [userId, 'profile_update', 'Updated profile information']
      });
    } catch (error) {
      console.error('Failed to record activity:', error);
      // Don't fail the request if activity recording fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating profile.' },
      { status: 500 }
    );
  }
}