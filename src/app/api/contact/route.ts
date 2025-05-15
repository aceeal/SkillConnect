// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, email, message, isBugReport } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Convert isBugReport to a boolean
    const bugReport = isBugReport === true || isBugReport === 'true';

    // Insert submission into database
    const result = await executeQuery({
      query: `
        INSERT INTO contact_submissions 
        (name, email, message, is_bug_report)
        VALUES (?, ?, ?, ?)
      `,
      values: [name, email, message, bugReport]
    });

    // Return success response
    return NextResponse.json(
      { message: 'Submission successful!', id: (result as any).insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred during submission.' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all submissions - useful for admin panel later
export async function GET(request: Request) {
  try {
    // Get URL params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    // Build query based on filters
    let query = `
      SELECT * FROM contact_submissions
    `;
    
    const values: any[] = [];
    
    if (status && status !== 'all') {
      query += ` WHERE status = ?`;
      values.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    // Execute query
    const submissions = await executeQuery({
      query,
      values
    });
    
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching submissions.' },
      { status: 500 }
    );
  }
}