
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt"); // ✅ Added for password hashing

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",           // your MySQL username
  password: "cse123",     // your MySQL password
  database: "event_booking"
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err);
    process.exit(1);
  }
  console.log("🟢 MySQL Connected!");
});

// ===========================
// 🟩 User Registration Route
// ===========================
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const checkQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkQuery, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (results.length > 0) {
      return res.json({ success: false, message: "Email already registered" });
    }

    try {
      // ✅ Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
      db.query(insertQuery, [name, email, hashedPassword], (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error hashing password" });
    }
  });
});

// ===========================
// 🔑 User Login Route
// ===========================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: "Database error" });
    }
    if (results.length > 0) {
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } }); 
      } else {
        res.json({ success: false, message: "Invalid email or password" });
      }
    } else {
      res.json({ success: false, message: "Invalid email or password" });
    }
  });
});

// ===========================
// 🎫 Book Event Route
// ===========================
app.post("/book", (req, res) => {
  const { name, email, phone, event, seats, payment } = req.body;

  const sql = "INSERT INTO bookings (name, email, phone, event, seats, payment_method) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [name, email, phone, event, seats, payment];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Error saving booking:", err);
      return res.status(500).json({ message: "Booking failed" });
    }
    res.json({ success: true, id: result.insertId });
  });
});

// ===========================
// 📋 Get Bookings by Email
// ===========================
app.get("/bookings/:email", (req, res) => {
  const email = req.params.email;

  const sql = "SELECT * FROM bookings WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error retrieving bookings:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, data: results });
  });
});

// ===========================
// ❌ Cancel Booking Route
// ===========================
app.delete("/cancel/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM bookings WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting booking:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "No booking found for this id" });
    }
  });
});

// ===========================
// 🚀 START SERVER
// ===========================
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
