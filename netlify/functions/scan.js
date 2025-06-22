const OpenAI = require("openai");
const nodemailer = require("nodemailer");

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
    let { website, name, email } = body;

    if (!website || !name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing website, name, or email" }),
      };
    }

    // Normalize website input
    if (!website.startsWith("http")) {
      website = `https://${website}`;
    }

    // Create prompt
    const prompt = `
You are an expert AI consultant. Based on the public-facing website at ${website}, generate a concise but insightful 'AI Readiness Report' aimed at non-technical leadership. 
Include:
1. AI Readiness Score out of 100 (briefly justify)
2. Potential AI Use Cases
3. Digital Maturity observations
4. Key risks or blockers
5. Short-Term, Medium-Term, and Long-Term recommendations
Respond with markdown formatting. Keep the tone professional but friendly.
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

    // Email Roland with notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NOTIFY_EMAIL,
        pass: process.env.NOTIFY_PASS,
      },
    });

    const mailOptions = {
      from: `"AI Scan Bot" <${process.env.NOTIFY_EMAIL}>`,
      to: "roland.arlt@gmail.com",
      subject: `✅ New AI Scan: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nWebsite: ${website}\n\n---\n\n${result}`,
    };

    await transporter.sendMail(mailOptions);

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
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong",
        details: err.message,
      }),
    };
  }
};
