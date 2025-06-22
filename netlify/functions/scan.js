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

    // Generate the report
    const prompt = `
You are an expert AI consultant. Based only on the public-facing website at ${website}, generate a concise 'AI Readiness Report' aimed at non-technical leadership. 

Include:
1. A readiness score out of 100
2. Potential AI use cases
3. Digital maturity
4. Key risks or blockers
5. Overall recommendation

Format it with clear section titles and bullet points.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI strategy consultant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const resultMarkdown = response.choices[0].message.content;

    // Convert Markdown to basic HTML for rendering
    const result = resultMarkdown
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
      .replace(/\n/g, "<br>"); // line breaks

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
