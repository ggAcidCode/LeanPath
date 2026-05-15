import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      // Return mock data when no API key
      return NextResponse.json({
        items: [
          { name: 'Detected meal', quantity: 1, unit: 'plate', calories: 550, protein: 30, carbs: 45, fat: 22, confidence: 0.6 },
        ],
        disclaimer: 'AI estimates — configure ANTHROPIC_API_KEY for real analysis.',
      });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analyze this photo of food. Identify each food item, estimate portion sizes, and provide calorie and macronutrient estimates. Be conservative (estimate higher calories when uncertain).

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "name": "food name",
      "quantity": 1,
      "unit": "serving size description",
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "confidence": 0.85
    }
  ]
}

confidence should be 0.0 to 1.0.`,
            },
          ],
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
      disclaimer: 'AI estimates from photo — values may vary. Not medical advice.',
    });
  } catch (error) {
    console.error('Photo analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze photo. Please try describing your meal instead.' },
      { status: 500 }
    );
  }
}
