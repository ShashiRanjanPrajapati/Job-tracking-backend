require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { testConnection } = require("./config/db");
const applicationsRouter = require("./routes/applications.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.send("Welcome to the job Tracker API");
});

app.use("/applications", applicationsRouter);
app.use("/api/applications", applicationsRouter);

app.use((req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await testConnection();
        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server due to database connection error:", err.message);
    }
}

startServer();
