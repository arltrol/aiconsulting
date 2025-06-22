const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { website, email, name } = JSON.parse(event.body || '{}');

    if (!website || !email || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing input fields' })
      };
    }

    const prompt = `You are an expert AI consultant. Based on the website "${website}", provide a brief AI readiness assessment. Identify any areas where AI could offer value, opportunities for automation or insight, and how prepared this organization seems to be from their public website alone. Be specific but concise (max 200 words).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const resultText = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: resultText,
        website: website
      })
    };
  } catch (error) {
    console.error('❌ Error in scan function:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Server error occurred',
        detail: error.message || 'Unknown error'
      })
    };
  }
};
