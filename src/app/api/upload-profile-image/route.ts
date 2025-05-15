import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { executeQuery } from '../../../../lib/db';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('profileImage');
    const userId = formData.get('userId');
    
    // Check if user is authorized to upload for this userId
    if (session.user.id.toString() !== userId.toString() && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Process the file
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    // Create a buffer from the file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const fileName = `profile-${userId}-${uuidv4()}${path.extname(file.name)}`;
    
    // Define the upload directory and path
    // Use the correct method to get the project root directory
    const projectRoot = process.cwd();
    console.log("Project root:", projectRoot);
    
    const uploadDir = path.join(projectRoot, 'public', 'uploads');
    console.log("Upload directory:", uploadDir);
    
    const filePath = path.join(uploadDir, fileName);
    console.log("File path:", filePath);
    
    // Check if directory exists and create it if it doesn't
    if (!fs.existsSync(uploadDir)) {
      console.log("Creating upload directory...");
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write the file to the server
    await writeFile(filePath, buffer);
    console.log("File written successfully");
    
    // The URL path to the image (relative to public directory)
    const imageUrl = `/uploads/${fileName}`;
    
    // Update the user's profile picture in the database
    await executeQuery({
      query: 'UPDATE users SET profile_picture = ? WHERE id = ?',
      values: [imageUrl, userId]
    });
    
    // Return the success response with the image URL
    return NextResponse.json({ 
      success: true, 
      imageUrl
    });
    
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: `Error uploading profile image: ${error.message}` },
      { status: 500 }
    );
  }
}