// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    console.log('Fetching profile for user ID:', userId);

    // Validate request
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const userExists = await executeQuery({
      query: 'SELECT id FROM users WHERE id = ?',
      values: [userId]
    });

    if (!Array.isArray(userExists) || userExists.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user settings (with defaults if not set)
    const settings = await executeQuery({
      query: `
        SELECT 
          profile_visibility AS profileVisibility,
          show_skills AS showSkills,
          show_interests AS showInterests,
          allow_messages AS allowMessages
        FROM user_settings 
        WHERE user_id = ?
      `,
      values: [userId]
    });

    const userSettings = Array.isArray(settings) && settings.length > 0 
      ? settings[0] 
      : {
          profileVisibility: 'all',
          showSkills: 1,
          showInterests: 1,
          allowMessages: 'all'
        };

    // Convert MySQL tinyint to boolean
    userSettings.showSkills = Boolean(userSettings.showSkills);
    userSettings.showInterests = Boolean(userSettings.showInterests);

    // Check if profile is visible to requester
    const isProfileVisible = () => {
      // Always visible to self
      if (session?.user?.id === userId) return true;
      // Always visible to admins
      if (session?.user?.role === 'admin') return true;
      // Check privacy setting
      return userSettings.profileVisibility === 'all';
    };

    if (!isProfileVisible()) {
      return NextResponse.json({
        profile: null,
        settings: userSettings,
        message: 'Profile is private'
      });
    }

    // Fetch basic user info
    const user = await executeQuery({
      query: `
        SELECT 
          id,
          first_name AS firstName,
          last_name AS lastName,
          email,
          profile_picture AS profilePicture,
          bio,
          phone_number AS phoneNumber,
          location,
          DATE_FORMAT(created_at, '%M %Y') AS joinDate,
          last_login AS lastLogin
        FROM users 
        WHERE id = ?
      `,
      values: [userId]
    });

    if (!Array.isArray(user) || user.length === 0) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    const profileData = user[0];
    
    // Ensure important fields are never null
    profileData.phoneNumber = profileData.phoneNumber || 'Not provided';
    profileData.location = profileData.location || 'Not provided';
    profileData.bio = profileData.bio || '';
    profileData.profilePicture = profileData.profilePicture || '/default-profile.png';

    // Fetch additional data based on privacy settings
    const [skills, interests, socialMedia, recentActivities] = await Promise.all([
      userSettings.showSkills ? fetchSkills(userId) : Promise.resolve([]),
      userSettings.showInterests ? fetchInterests(userId) : Promise.resolve([]),
      fetchSocialMedia(userId),
      fetchRecentActivities(userId)
    ]);

    // Construct final response
    const response = {
      profile: {
        ...profileData,
        skills,
        interests,
        socialMedia,
        recentActivities
      },
      settings: userSettings
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching user profile' },
      { status: 500 }
    );
  }
}

// Helper functions for fetching related data
async function fetchSkills(userId: string) {
  try {
    const skills = await executeQuery({
      query: 'SELECT skill FROM skills WHERE user_id = ?',
      values: [userId]
    });
    return Array.isArray(skills) ? skills.map(s => s.skill) : [];
  } catch (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
}

async function fetchInterests(userId: string) {
  try {
    const interests = await executeQuery({
      query: 'SELECT interest FROM user_interests WHERE user_id = ?',
      values: [userId]
    });
    return Array.isArray(interests) ? interests.map(i => i.interest) : [];
  } catch (error) {
    console.error('Error fetching interests:', error);
    return [];
  }
}

async function fetchSocialMedia(userId: string) {
  try {
    const socialMedia = await executeQuery({
      query: 'SELECT platform, url FROM social_media WHERE user_id = ?',
      values: [userId]
    });
    
    if (!Array.isArray(socialMedia) || socialMedia.length === 0) {
      // Return an empty object with empty strings for facebook and twitter
      return {
        facebook: '',
        twitter: ''
      };
    }
    
    const result = socialMedia.reduce((acc, item) => {
      acc[item.platform.toLowerCase()] = item.url;
      return acc;
    }, {} as Record<string, string>);
    
    // Ensure facebook and twitter are always defined
    if (!result.facebook) result.facebook = '';
    if (!result.twitter) result.twitter = '';
    
    return result;
  } catch (error) {
    console.error('Error fetching social media:', error);
    return {
      facebook: '',
      twitter: ''
    };
  }
}

async function fetchRecentActivities(userId: string) {
  try {
    const activities = await executeQuery({
      query: `
        SELECT id, activity_type AS type, description, created_at
        FROM user_activities
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `,
      values: [userId]
    });

    if (!Array.isArray(activities)) return [];

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      date: formatActivityDate(new Date(activity.created_at))
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

function formatActivityDate(date: Date) {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}