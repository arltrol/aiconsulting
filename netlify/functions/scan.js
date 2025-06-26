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

  if (!website) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Missing website" })
  };
}

// Set fallback for name/email if not provided
const safeName = name || "Anonymous";
const safeEmail = email || "anonymous@youraiconsultant.london";

     const systemPrompt = "You are a professional AI strategy consultant helping small charities and SMEs.";
    
const userPrompt = `
The client has submitted their website: ${website}

Your job is to analyze their AI readiness and return ONLY a valid JSON object like this (with double quotes and no trailing commas):

Return ONLY a valid JSON object with all keys in double quotes, like this:
{
  "score": 76,
  "useCases": ["example use case", "another use case"],
  "techReadiness": ["tech insight 1", "tech insight 2", "tech insight 3"]
}

Follow these instructions:
- Score (0–100): Based on digital maturity, security, integrations, and content structure. Score should be on lower / conservative side to reflect upside potential. 
- useCases: 3 practical, non-technical AI use cases tailored to this charity or SME (e.g. donor insights, process automation, FAQ bots).
- techReadiness:
  • Always include 3 technical observations or suggestions — make them actionable.
  • Mention specific AI tools (e.g. GPT-4o, Whisper, Zapier, Make, Claude, OCR, chatbots).
  • Check for missing basics like SSL certificate, mobile responsiveness, or structured data.
  • Comment on site tech stack if visible (static HTML? WordPress? CMS?).
  • Suggest realistic automations or upgrades.
  • Include at least one website security or infrastructure point if possible.

End with this CTA in plain text:
"If you'd like to explore how to apply these ideas or see AI in action, book a free 30-min strategy call: https://calendly.com/roland2017/30min"

Only return valid JSON — no explanation or extra text.

`;

    function fixJSON(messyString) {
  try {
    const match = messyString.match(/{[\s\S]*}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("fixJSON error:", e);
  }
  return null;
}


    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or fallback to gpt-3.5-turbo if needed
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    });


    // Try to parse it safely as JSON
    let content = completion.choices[0].message.content.trim();

// Remove Markdown code block markers if present
if (content.startsWith("```json")) {
  content = content.replace(/^```json\s*/, "").replace(/```$/, "").trim();
} else if (content.startsWith("```")) {
  content = content.replace(/^```\s*/, "").replace(/```$/, "").trim();
}

const parsed = fixJSON(content);
if (!parsed) {
  console.error("❌ Failed to recover JSON:", content);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: "The AI response could not be parsed as valid JSON.",
      raw: content
    }),
  };
}

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
