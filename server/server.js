const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

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
// amazonq-ignore-next-line
// amazonq-ignore-next-line
// amazonq-ignore-next-line
// amazonq-ignore-next-line
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

// [POST] /api/report - User submits a new disaster report with file upload
app.post('/api/report', upload.single('image'), async (req, res) => {
    try {
        let aiResult = null;
        let imagePath = null;
        
        // If image was uploaded, analyze it with AI
        if (req.file) {
            imagePath = req.file.path;
            
            // Run AI analysis
            const pythonProcess = spawn('python', ['predict_model.py', imagePath]);
            let dataString = '';
            
            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });
            
            await new Promise((resolve) => {
                pythonProcess.on('close', () => {
                    aiResult = dataString.trim();
                    resolve();
                });
            });
        }
        
        // Validate location is not a disaster type
        const disasterTypes = ['flood', 'earthquake', 'cyclone', 'wildfire', 'landslide'];
        const location = req.body.location.toLowerCase();
        if (disasterTypes.includes(location)) {
            return res.status(400).json({ error: "Location cannot be a disaster type. Please enter a city/state name." });
        }
        
        // Extract disaster type from AI result
        const predictedType = aiResult && aiResult.includes('sure this is:') ? 
            aiResult.split('sure this is: ')[1].split('\n')[0].replace('\r', '').trim() : "Unknown";
        
        // Check if there's existing DISASTER news (not military exercises) for this type and location
        let initialStatus = "Pending News Verification";
        if (predictedType !== "Unknown") {
            const existingNews = await Report.findOne({
                source: "Google News",
                disaster_type: { $regex: new RegExp(predictedType, 'i') },
                $or: [
                    { title: { $regex: new RegExp(req.body.location, 'i') } },
                    { text: { $regex: new RegExp(req.body.location, 'i') } }
                ],
                // Exclude military exercises and non-disaster news
                title: { 
                    $not: /exercise|military|drill|training|desert cyclone/i 
                },
                $or: [
                    { title: /damage|destroyed|killed|injured|evacuated|relief|rescue|emergency|magnitude|richter|seismic/i },
                    { text: /damage|destroyed|killed|injured|evacuated|relief|rescue|emergency|magnitude|richter|seismic/i }
                ],
                timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } // Last 24 hours
            });
            
            if (existingNews) {
                initialStatus = "Verified";
            }
        }
        
        const newReport = new Report({
            source: "User Upload",
            title: req.body.title || "User Reported Incident",
            text: req.body.description,
            location: req.body.location,
            image_url: imagePath || req.body.image_url,
            disaster_type: predictedType,
            status: initialStatus
        });
        
        await newReport.save();
        
        // Only trigger news verification if not already verified
        if (initialStatus === "Pending News Verification" && aiResult && aiResult.includes('sure this is:')) {
            setTimeout(async () => {
                try {
                    const axios = require('axios');
                    await axios.post('http://localhost:5000/api/verify-with-news');
                } catch (err) {
                    console.log('Auto news verification failed:', err.message);
                }
            }, 2000);
        }
        
        const message = initialStatus === "Verified" ? 
            "Report Submitted and Verified! Matches existing news coverage." :
            "Report Submitted Successfully! Checking news for verification...";
            
        res.json({ 
            message: message, 
            report: newReport,
            ai_result: aiResult 
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to save report" });
    }
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

// [PUT] /api/report/:id/status - Update report status
app.put('/api/report/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        res.json({ message: "Status updated", report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] /api/verify-with-news - Verify reports against news
app.post('/api/verify-with-news', async (req, res) => {
    try {
        const feedparser = require('feedparser');
        
        // Get pending reports
        const pendingReports = await Report.find({ 
            status: "Pending News Verification",
            disaster_type: { $ne: "Unknown" }
        });
        
        let verifiedCount = 0;
        
        for (const report of pendingReports) {
            // Search for disaster type + location in news
            const searchQuery = `${report.disaster_type.toLowerCase()}+${report.location.replace(' ', '+')}+when:1d`;
            const newsUrl = `https://news.google.com/rss/search?q=${searchQuery}&hl=en-IN&gl=IN&ceid=IN:en`;
            
            try {
                const feed = feedparser.parse(newsUrl);
                
                let verified = false;
                // Check if any recent news matches both disaster type and location
                for (const entry of feed.entries.slice(0, 10)) {
                    const newsTitle = entry.title.toLowerCase();
                    const location = report.location.toLowerCase();
                    const disasterType = report.disaster_type.toLowerCase().replace('\r', '');
                    
                    // Must match BOTH disaster type AND specific location
                    // Also check that user's report title makes sense with AI prediction
                    const userTitle = report.title.toLowerCase();
                    const makesLogicalSense = !(
                        (disasterType === 'wildfire' && userTitle.includes('rain')) ||
                        (disasterType === 'earthquake' && userTitle.includes('flood')) ||
                        (userTitle.includes('normal') && disasterType !== 'unknown')
                    );
                    
                    if (newsTitle.includes(disasterType) && newsTitle.includes(location) && makesLogicalSense) {
                        verified = true;
                        break;
                    }
                }
                
                if (verified) {
                    await Report.findByIdAndUpdate(report._id, { status: "Verified" });
                    verifiedCount++;
                } else {
                    await Report.findByIdAndUpdate(report._id, { status: "Unverified - No News Match" });
                }
            } catch (err) {
                console.error(`News check failed for report ${report._id}:`, err);
                await Report.findByIdAndUpdate(report._id, { status: "Verification Failed" });
            }
        }
        
        res.json({ message: `${verifiedCount} reports verified with news` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] /api/fix-misclassified - Fix obviously wrong AI predictions
app.post('/api/fix-misclassified', async (req, res) => {
    try {
        // Fix reports where title/description doesn't match AI prediction
        const reports = await Report.find({ status: "Verified" });
        let fixedCount = 0;
        
        for (const report of reports) {
            const title = report.title.toLowerCase();
            const text = report.text.toLowerCase();
            const disasterType = report.disaster_type.toLowerCase().replace('\r', '');
            
            // Check if title/description contradicts AI prediction
            const isObviouslyWrong = (
                (disasterType === 'wildfire' && (title.includes('rain') || title.includes('normal'))) ||
                (disasterType === 'earthquake' && title.includes('flood')) ||
                (title.includes('normal') && disasterType !== 'unknown')
            );
            
            if (isObviouslyWrong) {
                await Report.findByIdAndUpdate(report._id, { 
                    status: "Misclassified - Needs Review",
                    disaster_type: "Unknown"
                });
                fixedCount++;
            }
        }
        
        res.json({ message: `${fixedCount} misclassified reports corrected` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [POST] /api/verify-all - Auto-verify reports with disaster_type
app.post('/api/verify-all', async (req, res) => {
    try {
        const result = await Report.updateMany(
            { 
                status: "Under Review", 
                disaster_type: { $ne: "Unknown" } 
            },
            { status: "Verified" }
        );
        res.json({ message: `${result.modifiedCount} reports verified` });
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