// src/app/api/user/route.ts
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/db";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if additional columns exist
    let columnsToFetch = "id, first_name, last_name, email, profile_picture, bio, role";
    
    try {
      // Try to check for columns like phone_number, location, and last_login
      await executeQuery({
        query: "SHOW COLUMNS FROM users LIKE 'phone_number'",
        values: []
      });
      
      // If we get here, the column exists
      columnsToFetch += ", phone_number";
    } catch (error) {
      // Column doesn't exist, but that's okay
      console.log("phone_number column doesn't exist yet");
    }
    
    try {
      await executeQuery({
        query: "SHOW COLUMNS FROM users LIKE 'location'",
        values: []
      });
      columnsToFetch += ", location";
    } catch (error) {
      console.log("location column doesn't exist yet");
    }
    
    try {
      await executeQuery({
        query: "SHOW COLUMNS FROM users LIKE 'last_login'",
        values: []
      });
      columnsToFetch += ", last_login";
    } catch (error) {
      console.log("last_login column doesn't exist yet");
    }

    // Fetch user data with available columns
    const users = await executeQuery({
      query: `SELECT ${columnsToFetch} FROM users WHERE id = ?`,
      values: [session.user.id]
    });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];
    
    // Prepare the enhanced user object
    const enhancedUser = {
      ...session.user,
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      profilePicture: user.profile_picture,
      bio: user.bio,
      role: user.role,
      phoneNumber: user.phone_number || null,
      location: user.location || null,
      lastLogin: user.last_login || null,
      joinDate: new Date(user.created_at || Date.now()).toLocaleDateString()
    };

    // Try to fetch social media links
    let socialMedia = {};
    try {
      const socialMediaLinks = await executeQuery({
        query: "SELECT platform, url FROM social_media WHERE user_id = ?",
        values: [session.user.id]
      });
      
      if (Array.isArray(socialMediaLinks) && socialMediaLinks.length > 0) {
        socialMediaLinks.forEach(link => {
          socialMedia[link.platform] = link.url;
        });
      }
      
      enhancedUser.socialMedia = socialMedia;
    } catch (error) {
      console.log("Social media table might not exist yet:", error);
      enhancedUser.socialMedia = {};
    }
    
    // Try to fetch recent activities
    let activities = [];
    try {
      activities = await executeQuery({
        query: `
          SELECT id, activity_type, description, created_at 
          FROM user_activities 
          WHERE user_id = ? 
          ORDER BY created_at DESC
          LIMIT 5
        `,
        values: [session.user.id]
      });
      
      enhancedUser.recentActivities = activities;
    } catch (error) {
      console.log("Activities table might not exist yet:", error);
      enhancedUser.recentActivities = [];
    }

    return NextResponse.json(enhancedUser);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}