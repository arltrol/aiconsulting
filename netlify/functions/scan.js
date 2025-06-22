const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const { website } = JSON.parse(event.body);

    // Validate the website input
    if (!website || !website.startsWith('http')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid website URL provided.' }),
      };
    }

    // Fetch website content
    const response = await fetch(website);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${website}: ${response.statusText}`);
    }
    const html = await response.text();

    // Simulate AI readiness score
    const score = Math.floor(Math.random() * 100) + 1;

    return {
      statusCode: 200,
      body: JSON.stringify({
        scannedUrl: website,
        score: score,
        message: "AI readiness scan completed successfully",
      }),
    };
  } catch (error) {
    console.error("❌ SCAN FAILED", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong on the server.",
        details: error.message,
      }),
    };
  }
};
