const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const User = require("./models/user");

const studentRouter = require('./routes/student');
const technicianRouter = require('./routes/technician');
const reportRouter = require('./routes/reports');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Update static file serving to point to root directory
app.use(express.static(path.join(__dirname, "..")));

// MongoDB connection - Use environment variable for Render deployment
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fixtrack";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log(err));

// Register route
app.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Allow admin to be created only programmatically
    if (role === 'admin' && email !== 'ceerhod@cmrcet.ac.in') {
      return res.status(400).json({ message: "Admin role can only be assigned to ceerhod@cmrcet.ac.in" });
    }

    if (!email.endsWith("@cmrcet.ac.in")) {
      return res.status(400).json({ message: "Only @cmrcet.ac.in emails allowed" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role });
    await newUser.save();

    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Special case for admin login
    if (email === 'ceerhod@cmrcet.ac.in' && password === '1234') {
      // Check if admin user exists, if not create it
      let adminUser = await User.findOne({ email: 'ceerhod@cmrcet.ac.in' });
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('1234', 10);
        adminUser = new User({ 
          email: 'ceerhod@cmrcet.ac.in', 
          password: hashedPassword, 
          role: 'admin' 
        });
        await adminUser.save();
      }
      
      return res.json({ message: "Login successful", role: 'admin' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({ message: "Login successful", role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mount student and technician dashboard routers
app.use('/students', studentRouter);
app.use('/technicians', technicianRouter);
app.use('/api/reports', reportRouter);

// Admin routes
app.get('/api/admin/reports', async (req, res) => {
  try {
    const Report = require('./models/report');
    const reports = await Report.find({}).sort({ createdAt: -1 });
    
    // Calculate statistics
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const inProgressReports = reports.filter(r => r.status === 'in-progress').length;
    
    const stats = {
      total: totalReports,
      resolved: resolvedReports,
      pending: pendingReports,
      inProgress: inProgressReports
    };
    
    console.log("Admin reports stats:", stats);
    
    res.json({
      reports,
      stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/admin/technicians', async (req, res) => {
  try {
    const Technician = require('./models/technician');
    const User = require('./models/user');
    
    // Get all users with technician role
    const technicianUsers = await User.find({ role: 'technician' });
    
    // Get all technicians from Technician collection
    const technicians = await Technician.find({});
    
    // Create a map of technician emails to technician objects for easy lookup
    const technicianMap = new Map();
    technicians.forEach(tech => {
      technicianMap.set(tech.email, tech);
    });
    
    // Combine the data: for each technician user, either use their Technician profile or create a minimal one
    const combinedTechnicians = technicianUsers.map(user => {
      const existingTech = technicianMap.get(user.email);
      if (existingTech) {
        // Technician profile exists, return it
        return existingTech;
      } else {
        // No profile exists yet, create a minimal technician object
        return {
          email: user.email,
          name: user.email.split('@')[0], // Use email username as default name
          designation: 'Technician', // Default designation
          workload: 0,
          resolved: 0
        };
      }
    });
    
    // Add workload information to each technician
    const Report = require('./models/report');
    for (let tech of combinedTechnicians) {
      // Skip if this is a plain object (not a Mongoose document)
      if (typeof tech.toObject === 'function') {
        const assignedReports = await Report.find({ 
          assignedTechnicianId: tech.email,
          status: { $in: ['pending', 'in-progress'] }
        });
        
        const resolvedReports = await Report.find({ 
          assignedTechnicianId: tech.email,
          status: 'resolved'
        });
        
        tech.workload = assignedReports.length;
        tech.resolved = resolvedReports.length;
      } else {
        // For plain objects, add the properties directly
        const assignedReports = await Report.find({ 
          assignedTechnicianId: tech.email,
          status: { $in: ['pending', 'in-progress'] }
        });
        
        const resolvedReports = await Report.find({ 
          assignedTechnicianId: tech.email,
          status: 'resolved'
        });
        
        tech.workload = assignedReports.length;
        tech.resolved = resolvedReports.length;
      }
    }
    
    res.json(combinedTechnicians);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Default route to serve index.html from root directory
app.get("/", (req, res) => {
  // Handle case where file might not exist in production
  try {
    res.sendFile(path.join(__dirname, "..", "index.html"));
  } catch (err) {
    res.status(404).send("File not found");
  }
});

// Route to serve login.html from root directory
app.get("/login", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "..", "login.html"));
  } catch (err) {
    res.status(404).send("File not found");
  }
});

// Route to serve register.html from root directory
app.get("/register", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "..", "register.html"));
  } catch (err) {
    res.status(404).send("File not found");
  }
});

// Route to serve main.html from root directory
app.get("/main", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "..", "main.html"));
  } catch (err) {
    res.status(404).send("File not found");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));