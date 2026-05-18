// 放置路径: app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';

// 从数据库获取实时场所数据（取评分最高的前80条）
async function fetchSpacesContext(): Promise<string> {
  const result = await pool.query(`
    SELECT
      name,
      category,
      suburb,
      address,
      rating,
      rating_count,
      noise_db,
      air_temperature,
      relative_humidity,
      avg_wind_speed,
      opening_hours,
      is_24_7
    FROM poi_locations
    WHERE latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND name IS NOT NULL
    ORDER BY rating DESC NULLS LAST, rating_count DESC NULLS LAST
    LIMIT 30
  `);

  if (result.rows.length === 0) {
    return 'No space data available at the moment.';
  }

  const lines = result.rows.map((row) => {
    const noise = row.noise_db != null ? `${Math.round(row.noise_db)}dB` : 'N/A';
    const temp = row.air_temperature != null ? `${Math.round(row.air_temperature)}°C` : 'N/A';
    const humidity = row.relative_humidity != null ? `${Math.round(row.relative_humidity)}%` : 'N/A';
    const wind = row.avg_wind_speed != null ? `${Math.round(row.avg_wind_speed)}km/h` : 'N/A';
    const rating = row.rating != null ? `${parseFloat(row.rating).toFixed(1)} (${row.rating_count ?? 0} reviews)` : 'No rating';
    const hours = row.is_24_7 ? 'Open 24/7' : (row.opening_hours || 'Hours not listed');

    return `- ${row.name} | ${row.category} | ${row.suburb || 'Melbourne'} | Noise: ${noise} | Temp: ${temp} | Humidity: ${humidity} | Wind: ${wind} | Rating: ${rating} | Hours: ${hours}`;
  });

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as {
      messages: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format.' }, { status: 400 });
    }

    // 获取实时数据库数据
    const spacesContext = await fetchSpacesContext();

    const systemPrompt = `You are a helpful assistant for the Smart Living Melbourne website. Your role is to help users find the best public spaces in Melbourne based on real-time data from our database.

Here is the current live data for Melbourne public spaces (sorted by rating):
${spacesContext}

Key data fields explained:
- Noise (dB): ≤40 = Library Quiet, ≤50 = Very Calm, ≤60 = Moderate, ≤70 = Active, >70 = Busy
- Category: study (libraries/study spaces), leisure (parks/gardens), culture (museums/galleries), lifestyle (cafes/shopping)
- Comfort score is derived from noise, temperature (ideal 16-26°C), humidity (ideal 35-65%), and wind speed (ideal ≤18km/h)

Guidelines:
- Format responses with each sentence or key point on a new line for readability
- Always base your answers on the real data provided above
- Be specific — mention actual place names, noise levels, ratings, and temperatures from the data
- For study/work recommendations, prioritise low noise (≤55dB) and high comfort
- For leisure, consider weather comfort and rating
- Keep responses concise and friendly
- If the user asks something not covered by the data (e.g. transport, pricing), answer helpfully from general knowledge but note it's not from our live data
- Respond in the same language the user writes in (English or Chinese)`;

    // 使用 Groq API（免费，速度极快，兼容 OpenAI 格式）
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', errText);
      return NextResponse.json({ success: false, error: 'Groq API request failed.' }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const reply: string =
      groqData?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message.' },
      { status: 500 }
    );
  }
}
