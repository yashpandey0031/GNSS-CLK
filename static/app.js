const API = "https://gnss-clk.onrender.com/predict";

let currentChart = null;

async function uploadAndPredict(file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);

    xhr.open("POST", API, true);

    // Progress %
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        document.getElementById("progressBar").style.width = pct + "%";
        document.getElementById("status").innerText = `Uploading... ${pct}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(xhr.responseText);
      }
    };

    xhr.onerror = () => reject("Network error");

    xhr.send(fd);
  });
}

document.getElementById("btnPredict").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Please select a CSV file.");
    return;
  }

  const status = document.getElementById("status");
  status.innerText = "Starting upload...";

  // Detect cold start by using a timeout
  let coldStart = true;
  const warmupTimer = setTimeout(() => {
    if (coldStart) {
      status.innerText =
        "Warming up Render free server... this may take 20–40 seconds.";
    }
  }, 3000); // If no response in 3 sec → likely cold start

  try {
    const data = await uploadAndPredict(file);

    coldStart = false;
    clearTimeout(warmupTimer);
    status.innerText = "Processing complete.";

    showResults(data.predictions);
  } catch (err) {
    coldStart = false;
    clearTimeout(warmupTimer);

    // If first request failed but server woke up later
    if (err.includes("Network error")) {
      status.innerText = "Server woke up. Click Predict again to continue.";
      return;
    }

    status.innerText = "Error: " + err;
  }
});

function showResults(preds) {
  // Show area
  document.getElementById("results").classList.remove("hidden");

  // Build table
  // --- SHOW ONLY FIRST 20 ROWS IN TABLE (PREVIEW) ---
  const previewCount = 20;
  const preview = preds.slice(0, previewCount);

  const rows = preview
    .map(
      (p, i) =>
        `<tr>
          <td>${i + 1}</td>
          <td>${p.ts}</td>
          <td>${Number(p.pred).toExponential(16)}</td>
      </tr>`
    )
    .join("");

  document.getElementById("table_body").innerHTML = rows;

  // Build CSV download
  const csv =
    "index,timestamp,prediction\n" +
    preds
      .map((p, i) => `${i + 1},${p.ts},${Number(p.pred).toExponential(16)}`)
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const dl = document.getElementById("downloadBtn");
  dl.href = url;
  dl.download = "predictions.csv";
  dl.style.display = "inline-block";

  // Render Chart
  drawChart(
    preds.map((p) => p.ts),
    preds.map((p) => Number(p.pred))
  );
}

function drawChart(labels, data) {
  const ctx = document.getElementById("chart").getContext("2d");

  if (currentChart) currentChart.destroy();

  currentChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Predicted Clock Bias (seconds)",
          data: data,
          borderColor: "#33fffa",
          borderWidth: 1,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: { display: true, title: { display: true, text: "Timestamp" } },
        y: { display: true, title: { display: true, text: "Bias (sec)" } },
      },
    },
  });
}
