// src/app/api/signup/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    let { firstName, lastName, email, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Capitalize first letter of names
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Check if the email already exists
    const existingUsers = await executeQuery({
      query: 'SELECT id FROM users WHERE email = ?',
      values: [email]
    });

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists.' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user
    await executeQuery({
      query: 'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      values: [firstName, lastName, email, hashedPassword, 'user']
    });

    // Return success response
    return NextResponse.json(
      { message: 'Signup successful!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup.' },
      { status: 500 }
    );
  }
}