document.getElementById('scanForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const website = document.getElementById('website').value;
  const resultSection = document.getElementById('scan-result');
  const scannedSite = document.getElementById('scanned-site');
  const scanOutput = document.getElementById('scan-output');

  // Show the result section and scanned website
  resultSection.style.display = 'block';
  scannedSite.innerText = website;
  scanOutput.innerHTML = '⏳ Scanning...';

  try {
    const response = await fetch('/.netlify/functions/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ website })
    });

    const data = await response.json();

    if (!response.ok) {
      // If server responded but not OK, throw the error message if available
      throw new Error(data.error || 'Unknown error occurred');
    }

    scanOutput.innerHTML = `<pre>${data.result}</pre>`;
  } catch (error) {
    console.error('Scan error:', error);
    scanOutput.innerHTML = `❌ <strong>Something went wrong.</strong><br><code>${error.message}</code>`;
  }
});
