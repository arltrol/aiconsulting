const fetch = require("node-fetch");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.handler = async function (event) {
  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing website URL" }),
      };
    }

    // 🔧 Clean + validate input URL
    const cleanUrl = url.startsWith("http") ? url.trim() : `https://${url.trim()}`;
    let pageContent = "";

    try {
      const response = await fetch(cleanUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${cleanUrl}: ${response.status}`);
      pageContent = await response.text();
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Could not load website: ${err.message}` }),
      };
    }

    // 🧠 Call OpenAI with scraped content
    const gptPrompt = `
      A charity website says:
      ---
      ${pageContent.slice(0, 4000)}
      ---
      Based on this, what 3 ways could this organization use AI to increase impact or reduce admin? Be specific and use plain English.
    `;

    const aiResponse = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      messages: [{ role: "user", content: gptPrompt }],
    });

    const resultText = aiResponse?.data?.choices?.[0]?.message?.content || "No result from AI.";

    return {
      statusCode: 200,
      body: JSON.stringify({ result: resultText }),
    };

  } catch (err) {
    console.error("❌ Server error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
};
