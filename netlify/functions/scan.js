// netlify/functions/scan.js
const fetch = require("node-fetch");

exports.handler = async function (event, context) {
  const { website } = JSON.parse(event.body || "{}");

  // Ensure proper URL format
  let validUrl = website.trim();
  if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
    validUrl = "https://" + validUrl;
  }

  try {
    // Attempt to fetch the site’s homepage HTML
    const res = await fetch(validUrl);
    const html = await res.text();

    // Simple checks for AI-readiness indicators
    const observations = [];

    if (!html.includes("blog")) {
      observations.push("📢 No blog or article content detected — low repurpose potential");
    }
    if (html.includes("shop") || html.includes("store")) {
      observations.push("🛍 Website has physical product mentions — automation opportunity");
    }
    if (html.includes("mailto:")) {
      observations.push("📬 Manual contact email detected — consider a chatbot or contact form assistant");
    }

    if (observations.length === 0) {
      observations.push("✅ Basic digital presence detected. Consider audit for next steps.");
    }

    const score = 45 + Math.floor(Math.random() * 30); // Simulate score

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: validUrl,
        score,
        observations,
        recommendation:
          "Consider adding an AI-powered newsletter or chatbot to increase engagement and efficiency.",
      }),
    };
  } catch (err) {
    console.error("Scan failed", err);
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Invalid URL or site could not be fetched.",
      }),
    };
  }
};
