// netlify/functions/scan.js

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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

    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI strategy consultant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const result = response.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        scanned: website,
        result,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong",
        details: err.message,
      }),
    };
  }
};
