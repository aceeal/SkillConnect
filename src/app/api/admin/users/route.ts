// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    
    // Define the online threshold (15 minutes)
    const onlineThreshold = new Date();
    onlineThreshold.setMinutes(onlineThreshold.getMinutes() - 15);
    
    // Build the main query - using account_status for admin moderation
    let query = `
      SELECT 
        u.id, 
        u.first_name,
        u.last_name, 
        u.email,
        u.profile_picture,
        u.role,
        u.created_at,
        u.last_login,
        u.updated_at,
        u.account_status,
        s.skill AS skill,
        i.interest AS interest,
        CASE 
          WHEN u.last_login IS NULL THEN 'offline'
          WHEN u.last_login > ? THEN 'online'
          ELSE 'offline'
        END AS online_status
      FROM users u
      LEFT JOIN (
        SELECT user_id, GROUP_CONCAT(skill SEPARATOR '|') AS skill
        FROM skills
        GROUP BY user_id
      ) s ON u.id = s.user_id
      LEFT JOIN (
        SELECT user_id, GROUP_CONCAT(interest SEPARATOR '|') AS interest
        FROM user_interests
        GROUP BY user_id
      ) i ON u.id = i.user_id
    `;
    
    // For admin requests, include all users; for regular users, exclude current user and admins
    let whereConditions = [];
    if (session.user.role !== 'admin') {
      whereConditions.push('u.id != ?');
      whereConditions.push("u.role = 'user'");
    }
    
    // Add filter condition based on online/offline status
    if (filter === 'online') {
      whereConditions.push('u.last_login > ?');
    } else if (filter === 'offline') {
      whereConditions.push('(u.last_login IS NULL OR u.last_login <= ?)');
    }
    
    // Add search condition
    if (search) {
      whereConditions.push(`(
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR
        s.skill LIKE ? OR
        i.interest LIKE ?
      )`);
    }
    
    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    // Add ordering
    query += ' ORDER BY u.created_at DESC';
    
    // Build values array
    const values = [onlineThreshold];
    
    // Add user ID filter for non-admin users
    if (session.user.role !== 'admin') {
      values.push(session.user.id);
    }
    
    // Add filter values
    if (filter === 'online' || filter === 'offline') {
      values.push(onlineThreshold);
    }
    
    // Add search values
    if (search) {
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Execute query
    const result = await executeQuery({ query, values });
    
    // Process the results - map account_status to status for frontend compatibility
    const users = Array.isArray(result) ? result.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name, // For admin dashboard compatibility
      lastName: user.last_name,   // For admin dashboard compatibility
      email: user.email,
      profilePicture: user.profile_picture,
      profile_picture: user.profile_picture, // For compatibility
      role: user.role,
      // Map account_status to status for frontend (this is for admin moderation: active/banned)
      status: user.account_status || 'active',
      // This is for user activity status (online/offline)
      onlineStatus: user.online_status,
      online_status: user.online_status, // Keep original field
      created_at: user.created_at,
      createdAt: user.created_at, // For compatibility
      last_login: user.last_login,
      lastLogin: user.last_login, // For compatibility
      lastActive: user.last_login ? new Date(user.last_login).toISOString() : null,
      skills: user.skill ? user.skill.split('|') : [],
      interests: user.interest ? user.interest.split('|') : [],
    })) : [];
    
    return NextResponse.json({ users });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching users.' },
      { status: 500 }
    );
  }
}