// netlify/functions/scan.js

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { website, name, email } = body;

    if (!website || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing website, name, or email" }),
      };
    }

    const prompt = `
You are an expert AI consultant. Based on the public-facing website at ${website}, generate a concise but insightful 'AI Readiness Report' aimed at non-technical leadership. 
Include:
- Potential AI use cases
- Digital maturity
- Key risks or blockers
- Overall recommendation
Format the result clearly.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI strategy consultant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const result = response.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        scanned: website,
        report: result,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    console.error("Error stack:", err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong",
        details: err.message,
      }),
    };
  }
};
