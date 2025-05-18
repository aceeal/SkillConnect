// src/app/api/upload-profile-image/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { executeQuery } from '../../../../lib/db';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dfyxmi9qh',
  api_key: '543269129883789',
  api_secret: 'r6ZmEYgmm1rM0p0Q9fwBbaEYuYs',
});

// Alternative configuration using environment variables (recommended)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

export async function POST(request) {
  try {
    console.log('Starting profile image upload...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('profileImage');
    const userId = formData.get('userId');
    
    console.log('User ID:', userId, 'Session User ID:', session.user.id);
    
    // Check if user is authorized to upload for this userId
    if (session.user.id.toString() !== userId.toString() && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Process the file
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    
    console.log('File validation passed. Size:', file.size, 'Type:', file.type);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File converted to buffer, size:', buffer.length);
    
    // Upload to Cloudinary
    console.log('Starting Cloudinary upload...');
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'skillconnect/profile-pictures', // Organize in folders
          public_id: `user-${userId}-${Date.now()}`, // Unique identifier
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' }, // Auto-crop to face
            { quality: 'auto:good' }, // Good quality with optimization
            { format: 'auto' } // Auto-select best format (WebP, JPEG, etc.)
          ],
          tags: ['profile', 'user', `user-${userId}`] // Add tags for organization
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      ).end(buffer);
    });
    
    // Get the secure URL from Cloudinary
    const imageUrl = uploadResult.secure_url;
    console.log('Image uploaded successfully to:', imageUrl);
    
    // Update the user's profile picture in the database
    console.log('Updating database...');
    await executeQuery({
      query: 'UPDATE users SET profile_picture = ? WHERE id = ?',
      values: [imageUrl, userId]
    });
    
    console.log('Database updated successfully');
    
    // Return the success response with the image URL
    return NextResponse.json({ 
      success: true, 
      imageUrl,
      public_id: uploadResult.public_id,
      message: 'Profile picture updated successfully'
    });
    
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: `Error uploading profile image: ${error.message}` },
      { status: 500 }
    );
  }
}