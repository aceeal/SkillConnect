// src/app/api/skill-categories/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';

// Get skill categories and skills
export async function GET() {
  try {
    // Fetch categories
    const categoriesResult = await executeQuery({
      query: 'SELECT id, name FROM skill_categories ORDER BY name',
      values: [],
    });

    if (!Array.isArray(categoriesResult)) {
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Fetch skills for each category
    const categorizedSkills: Record<string, any> = {};

    for (const category of categoriesResult) {
      const skills = await executeQuery({
        query: 'SELECT name FROM skill_list WHERE category_id = ? ORDER BY name',
        values: [category.id],
      });

      if (Array.isArray(skills)) {
        categorizedSkills[category.name] = skills.map(skill => skill.name);
      }
    }

    return NextResponse.json({ categorizedSkills });
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill categories' },
      { status: 500 }
    );
  }
}