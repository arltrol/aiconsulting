// netlify/functions/scan.js

const fetch = require('node-fetch');
const cheerio = require('cheerio');

exports.handler = async (event) => {
  try {
    const { website } = JSON.parse(event.body);

    if (!website || !/^https?:\/\/.+\..+/.test(website)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid website URL' }),
      };
    }

    // Fetch live website content
    const res = await fetch(website);
    const html = await res.text();

    // Extract visible text with cheerio
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000); // limit to ~4k chars

    const prompt = `
You are an AI consultant for charities. A user entered their organization website: ${website}.

Here’s the visible homepage text:
---
${text}
---

Based on this, give them:
1. An AI Readiness Score (0–100)
2. 2–3 observations on how ready they are to use AI (e.g., online content, contact workflows, donation tools)
3. 1 AI recommendation to improve
Be concise and helpful.`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const gptJson = await gptRes.json();
    const reply = gptJson.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };

  } catch (err) {
    console.error('Scan error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong.' }),
    };
  }
};
