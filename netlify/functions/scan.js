// netlify/functions/scan.js

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { website, name, email } = JSON.parse(event.body || '{}');

    if (!website || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    const prompt = `
You are an expert AI consultant. Based on the public-facing website at ${website}, generate a concise but informative 'AI Readiness Report' for the organisation. Highlight:
- Potential use cases for AI (in operations, marketing, finance, etc.)
- Observations about their digital maturity
- Risks or gaps that would prevent them from leveraging AI
Format it as a friendly but insightful report aimed at non-technical leadership.
`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI strategy consultant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const result = completion.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        website,
        name,
        email,
        result,
      }),
    };
  } catch (error) {
    console.error("❌ OpenAI Error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
        stack: error.stack,
      }),
    };
  }
};
