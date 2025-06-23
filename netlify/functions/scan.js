// netlify/functions/scan.js

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { website, name, email } = body;

    if (!website || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name, email, or website" }),
      };
    }

     const systemPrompt = "You are a professional AI strategy consultant helping small charities and SMEs.";

const userPrompt = `
The client has submitted their website: ${website}

Your job is to analyze their AI readiness and return a JSON object like this:
{
  "score": 76,
  "useCases": ["use case 1", "use case 2"],
  "techReadiness": ["point 1", "point 2", "point 3"]
}

Instructions:
- Score should reflect realistic digital maturity (0–100)
- UseCases should be practical and non-technical (aimed at charities or SMEs)
- techReadiness should highlight specific technologies, limitations, and integrations (mention tools like GPT-4o, Zapier, Make.com, OCR etc.)
- Mention any tech constraints (no SSL, no CRM, static HTML etc)
- Always include 2–3 tech buzzwords or AI models.

End with this message as a CTA:
"If you'd like to explore how to apply these ideas or see AI in action, book a free 30-min strategy call: https://calendly.com/roland2017/30min"

Return only valid JSON — no other text.
`;


    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or fallback to gpt-3.5-turbo if needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content.trim();

    // Try to parse it safely as JSON
    const parsed = JSON.parse(content);

    return {
      statusCode: 200,
      body: JSON.stringify({
        score: parsed.score,
        useCases: parsed.useCases,
        techReadiness: parsed.techReadiness,
        report: content, // raw JSON string if needed
      }),
    };

  } catch (err) {
    console.error("ERROR", err.message, err.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong.",
        details: err.message,
      }),
    };
  }
};
