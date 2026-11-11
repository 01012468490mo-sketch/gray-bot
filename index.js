console.log("Gray Bot is running...");

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Gray Bot is Online!");
});

app.listen(3000, () => {
  console.log("Bot is online on port 3000");
});
