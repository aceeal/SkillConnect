// src/app/api/users/route.ts
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
    
    // Get URL params
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    
    // Define the online threshold (15 minutes)
    const onlineThreshold = new Date();
    onlineThreshold.setMinutes(onlineThreshold.getMinutes() - 15);
    
    let query = `
      SELECT 
        u.id, 
        u.first_name,
        u.last_name, 
        u.email,
        u.profile_picture,
        u.last_login,
        s.skill AS skill,
        i.interest AS interest,
        CASE 
          WHEN u.last_login IS NULL THEN 'offline'
          WHEN u.last_login > ? THEN 'online'
          ELSE 'offline'
        END AS status
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
      WHERE u.id != ? AND u.role = 'user'
    `;
    
    // Add filter condition
    if (filter === 'online') {
      query += ' AND u.last_login > ?';
    } else if (filter === 'offline') {
      query += ' AND (u.last_login IS NULL OR u.last_login <= ?)';
    }
    
    // Add search condition
    if (search) {
      query += ` AND (
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR
        s.skill LIKE ? OR
        i.interest LIKE ?
      )`;
    }
    
    // Build values array
    const values = [onlineThreshold, session.user.id];
    
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
    
    // Process the results
    const users = Array.isArray(result) ? result.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      profilePicture: user.profile_picture || '/default-profile.png',
      status: user.status,
      skills: user.skill ? user.skill.split('|') : [],
      interests: user.interest ? user.interest.split('|') : [],
      lastActive: user.last_login ? new Date(user.last_login).toISOString() : null,
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