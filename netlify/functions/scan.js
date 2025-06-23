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
ou are an AI consultant. A charity or small business has just entered their website URL: ${website}

Your job is to give them a quick AI Readiness Snapshot based on what you can infer from their site.

First, provide a score out of 100 for how ready they appear to be for adopting AI in their organization (based on digital maturity, online presence, etc). Be realistic, not too generous.

Then, write a section with specific, practical AI use cases they could consider — especially related to their sector (charity, nonprofit, local business, etc). These should be actionable and understandable to non-technical users.

Finally, add a new section called “Technical AI Readiness” that gives:
- 2–3 quick observations about their website's technical potential for AI integration
- Mention tools, models, or APIs they might benefit from (e.g., Zapier, GPT-4o, OCR, Make.com)
- Note any limitations (e.g. if the site is basic/static, or lacks SSL, CRM etc) including any security limitations

Make sure on the technical / AI side some buzzwords and detailed technologies are always mentioned at least once. 

Write clearly and professionally, using bullet points or markdown style. Keep it to about 250–300 words.

+ "\n\n" +
"If you'd like to discuss your results or explore how to take the next step with AI, our team is happy to help. Book a free consultation to get tailored guidance based on your goals and tech stack."


`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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
