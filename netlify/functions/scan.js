document.getElementById("scan-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const website = document.getElementById("website").value;
  const resultsContainer = document.getElementById("scan-results");
  const scannedUrlSpan = document.getElementById("scanned-url");
  const errorMessage = document.getElementById("error-message");
  const loadingIndicator = document.getElementById("loading-indicator");

  resultsContainer.style.display = "none";
  errorMessage.style.display = "none";
  loadingIndicator.style.display = "block";

  try {
    const response = await fetch("/.netlify/functions/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, website })
    });

    loadingIndicator.style.display = "none";
    resultsContainer.style.display = "block";
    scannedUrlSpan.innerText = website;

    if (!response.ok) {
      const text = await response.text();
      errorMessage.style.display = "block";
      errorMessage.innerHTML = `❌ Something went wrong.<br>Status: ${response.status}<br>Message: ${text}`;
      console.error("Server error:", response.status, text);
      return;
    }

    const result = await response.json();

    if (result.success) {
      document.getElementById("result-text").innerHTML = result.report || "✅ Scan complete.";
      errorMessage.style.display = "none";
    } else {
      errorMessage.style.display = "block";
      errorMessage.innerHTML = `❌ ${result.message || "Scan failed unexpectedly."}`;
      console.error("Function error:", result);
    }
  } catch (err) {
    loadingIndicator.style.display = "none";
    resultsContainer.style.display = "block";
    scannedUrlSpan.innerText = website;

    errorMessage.style.display = "block";
    errorMessage.innerHTML = `❌ Network or unexpected error.<br>${err.message}`;
    console.error("Exception thrown:", err);
  }
});
