const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

// Initialize App
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ---------------------------------------------------------
// 1. DATABASE CONNECTION (MongoDB Atlas)
// ---------------------------------------------------------
// ACTION: Replace with your real User/Password
const MONGO_URI = "mongodb+srv://premzade12:zadeprem1234@disasterresponse.poetiqv.mongodb.net/disaster_db?retryWrites=true&w=majority&appName=DisasterResponse";

// FIX: Removed deprecated options { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.connect(MONGO_URI)
.then(() => console.log("✅ MongoDB Atlas Connected Successfully"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ---------------------------------------------------------
// 2. DATABASE SCHEMAS (Matches Report Pg. 29)
// ---------------------------------------------------------

// Report Schema
const ReportSchema = new mongoose.Schema({
    source: String,
    title: String,
    text: String,
    summary: String,
    link: String,
    timestamp: { type: Date, default: Date.now },
    image_url: String,
    disaster_type: String,
    location: String,
    status: { type: String, default: "Pending" }
});
const Report = mongoose.model('reports', ReportSchema);

// NGO Schema
const NGOSchema = new mongoose.Schema({
    name: String,
    location: String,
    specialization: String,
    contact: String
});
const NGO = mongoose.model('ngos', NGOSchema);

// ---------------------------------------------------------
// 3. API ROUTES (Matches Report Pg. 31)
// ---------------------------------------------------------

// [GET] /api/reports - Fetch all reports for the Dashboard
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find().sort({ timestamp: -1 }).limit(50);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] /api/report - User submits a new disaster report
app.post('/api/report', async (req, res) => {
    try {
        const newReport = new Report({
            source: "User Upload",
            title: req.body.title || "User Reported Incident",
            text: req.body.description,
            location: req.body.location,
            image_url: req.body.image_url,
            status: "Under Review"
        });
        await newReport.save();
        res.json({ message: "Report Submitted Successfully!", report: newReport });
    } catch (err) {
        res.status(500).json({ error: "Failed to save report" });
    }
});

// [POST] /api/analyze - AI Analysis
app.post('/api/analyze', (req, res) => {
    const { imagePath } = req.body;
    console.log(`🤖 Starting AI Analysis for: ${imagePath}`);

    // Adjust path '../predict_model.py' if necessary based on your folder structure
    const pythonProcess = spawn('python', ['predict_model.py', imagePath]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`AI Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        res.json({ ai_result: dataString.trim() });
    });
});

// [GET] /api/alerts - Fetch Alerts for NGOs
app.get('/api/alerts', async (req, res) => {
    try {
        const urgentReports = await Report.find({ status: "Verified" }).sort({ timestamp: -1 });
        res.json(urgentReports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] /api/stats - For Admin Dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const totalReports = await Report.countDocuments();
        const verifiedReports = await Report.countDocuments({ status: "Verified" });
        const ngoCount = await NGO.countDocuments();
        
        res.json({
            total_reports: totalReports,
            verified_emergencies: verifiedReports,
            active_ngos: ngoCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// 4. START SERVER
// ---------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING ON: http://localhost:${PORT}`);
    console.log(`📡 Database: MongoDB Atlas (Cloud)`);
    console.log(`-----------------------------------------------`);
});