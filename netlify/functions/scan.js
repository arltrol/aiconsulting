const fetch = require('node-fetch');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    let urlInput = body.website.trim();

    // Add https:// if missing
    let fullUrl = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;

    // Validate URL
    try {
      new URL(fullUrl);
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid website URL' })
      };
    }

    // Fetch website content
    const res = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = await res.text();

    // Clean up content
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);

    // Prepare OpenAI API request
    const prompt = `
You are an AI consultant. Based on the following scraped website content, provide:

1. AI Readiness Score out of 100
2. 3–4 observations
3. 1 top recommendation

Be concise. Write in a tone suitable for charities or SMEs.

--- Website Content ---
${textContent}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI consultant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5
      })
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          result: data.choices[0].message.content.trim()
        })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI response was invalid." })
      };
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" })
    };
  }
};
