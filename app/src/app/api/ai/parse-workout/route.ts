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
        type: 'General Workout',
        duration_min: 30,
        intensity: 'moderate',
        calories_burned: 150,
      });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a fitness analyst. Parse this workout description and return a JSON object with estimated workout details.

Workout description: "${description}"

Return ONLY valid JSON in this exact format, no other text:
{
  "type": "Workout type (e.g., Running, Cycling, Weightlifting)",
  "duration_min": 45,
  "intensity": "low" | "moderate" | "high",
  "calories_burned": 300
}

Ensure duration_min and calories_burned are integers. Choose one of "low", "moderate", or "high" for intensity.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('AI parse workout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze workout' },
      { status: 500 }
    );
  }
}
