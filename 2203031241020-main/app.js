const express = require("express");
const cors = require("cors");
const urlRoutes = require("./routes/urlRoutes");
const { nanoid } = require("nanoid");
const fakeData = require("./controllers/fakeData"); // shared in-memory store

const readline = require("readline");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/", urlRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Enter URL details below:");
  promptUserForURL(); // 👈 call CLI prompt
});

// CLI prompt function
function promptUserForURL() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Original URL: ", (originalUrl) => {
    if (!originalUrl) return rl.close();

    rl.question("Shortcode (optional): ", (shortCode) => {
      rl.question(
        "Validity in minutes (optional, default 30): ",
        (validity) => {
          const shortId = shortCode.trim() || nanoid(6);
          const validMinutes = parseInt(validity) || 30;
          const expirationTime = new Date(
            Date.now() + validMinutes * 60 * 1000
          );

          if (fakeData.fakeUrls[shortId]) {
            console.log("❌ This shortcode already exists.");
          } else {
            fakeData.fakeUrls[shortId] = {
              originalUrl,
              shortId,
              createdAt: new Date(),
              expiresAt: expirationTime,
            };
            fakeData.fakeAnalytics[shortId] = [];

            console.log(`Short URL Created`);
            console.log(`http://localhost:${PORT}/${shortId}`);
            console.log(`Expires at: ${expirationTime.toISOString()}`);
          }

          rl.close();
        }
      );
    });
  });
}
