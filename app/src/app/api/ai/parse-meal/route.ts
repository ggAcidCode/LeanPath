import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';



export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback mock response when API key not configured
      return NextResponse.json({
        items: parseMockMeal(description),
        disclaimer: 'AI estimates — values may vary. Not medical advice.',
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a nutrition analyst. Parse this meal description and return a JSON array of food items with estimated nutritional info. Be conservative (estimate higher calories when uncertain).

Meal description: "${description}"

Return ONLY valid JSON in this exact format, no other text:
{
  "items": [
    {
      "name": "food name",
      "quantity": 1,
      "unit": "serving",
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "confidence": 0.85
    }
  ]
}

confidence should be 0.0 to 1.0, indicating how confident you are in the estimate.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      ...parsed,
      disclaimer: 'AI estimates — values may vary. Not medical advice.',
    });
  } catch (error) {
    console.error('AI parse error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze meal. Please try manual entry.' },
      { status: 500 }
    );
  }
}

/** Fallback parsing when no API key */
function parseMockMeal(description: string) {
  const lower = description.toLowerCase();
  const items: Array<{
    name: string; quantity: number; unit: string;
    calories: number; protein: number; carbs: number; fat: number; confidence: number;
  }> = [];

  const foodDB: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
    'chicken': { calories: 280, protein: 52, carbs: 0, fat: 6 },
    'sandwich': { calories: 350, protein: 18, carbs: 38, fat: 14 },
    'fries': { calories: 365, protein: 4, carbs: 48, fat: 17 },
    'coke': { calories: 140, protein: 0, carbs: 39, fat: 0 },
    'salad': { calories: 150, protein: 6, carbs: 12, fat: 9 },
    'rice': { calories: 216, protein: 5, carbs: 45, fat: 2 },
    'burger': { calories: 540, protein: 28, carbs: 42, fat: 29 },
    'pizza': { calories: 285, protein: 12, carbs: 36, fat: 10 },
    'pasta': { calories: 380, protein: 14, carbs: 56, fat: 10 },
    'steak': { calories: 400, protein: 46, carbs: 0, fat: 22 },
    'egg': { calories: 91, protein: 6, carbs: 1, fat: 7 },
    'yogurt': { calories: 130, protein: 22, carbs: 9, fat: 0 },
    'banana': { calories: 105, protein: 1, carbs: 27, fat: 0 },
    'apple': { calories: 95, protein: 0, carbs: 25, fat: 0 },
    'coffee': { calories: 2, protein: 0, carbs: 0, fat: 0 },
  };

  for (const [food, data] of Object.entries(foodDB)) {
    if (lower.includes(food)) {
      items.push({
        name: food.charAt(0).toUpperCase() + food.slice(1),
        quantity: 1,
        unit: 'serving',
        ...data,
        confidence: 0.75,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      name: description.slice(0, 50),
      quantity: 1,
      unit: 'serving',
      calories: 400,
      protein: 20,
      carbs: 40,
      fat: 15,
      confidence: 0.4,
    });
  }

  return items;
}
