const API_URL = "https://text-summarizer-nlp-1.onrender.com/summarize";

async function summarizeText() {
    const text = document.getElementById("inputText").value;
    const loading = document.getElementById("loading");
    const summaryText = document.getElementById("summaryText");
    const scoreText = document.getElementById("scoreText");

    if (!text.trim()) {
        alert("Please enter some text!");
        return;
    }

    loading.classList.remove("hidden");
    summaryText.innerText = "";
    scoreText.innerText = "";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (data.error) {
            summaryText.innerText = data.error;
            scoreText.innerText = "--";
        } else {
            summaryText.innerText = data.summary;
            scoreText.innerText = data.quality_score;
        }

    } catch (error) {
        summaryText.innerText = "Error connecting to API";
        scoreText.innerText = "--";
    }

    loading.classList.add("hidden");
}

function clearText() {
    document.getElementById("inputText").value = "";
    document.getElementById("summaryText").innerText = "Your summary will appear here...";
    document.getElementById("scoreText").innerText = "--";
}