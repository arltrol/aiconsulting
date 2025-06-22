const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { website } = JSON.parse(event.body || "{}");

    if (!website || !website.includes(".")) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid website URL" }),
      };
    }

    const fullUrl = website.startsWith("http") ? website : `https://${website}`;

    // Fetch live website content
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (AI Readiness Bot)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Simple keyword checks (could be made smarter)
    const hasBlog = html.includes("/blog") || html.includes("blog-post");
    const hasNewsletter = html.includes("newsletter") || html.includes("mailchimp");
    const hasShop = html.includes("/shop") || html.includes("add-to-cart");
    const hasForms = html.includes("<form") && html.includes("contact");

    const score = 50 + (hasBlog ? 10 : 0) + (hasNewsletter ? 10 : 0) + (hasForms ? 10 : 0);

    const observations = [];

    if (!hasBlog) observations.push("📢 No blog content detected — low repurpose potential");
    if (!hasShop) observations.push("🛍 Physical shop only — online automation opportunity");
    if (!hasForms) observations.push("📬 Manual contact workflows — consider chatbot or AI assistant");

    const recommendation = "Add an AI-powered newsletter or chatbot to automate donor engagement.";

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: website,
        score,
        observations,
        recommendation,
      }),
    };
  } catch (err) {
    console.error("Function error:", err); // Netlify will log this
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
};
