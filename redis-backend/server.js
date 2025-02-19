const express = require('express');
const redis = require('redis');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create single Redis client
const client = redis.createClient({
    url: 'redis://@127.0.0.1:6379'
});

// Redis connection handling
client.on('error', (err) => console.error('Redis Client Error:', err));

// Connect to Redis before setting up routes
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');

        // Middleware
        app.use(cors());
        app.use(bodyParser.json());

        // Pass Redis client to auth routes
        const authRoutes = require('./LoginServer')(client);  // Pass client to LoginServer.js
        app.use('/', authRoutes);

        // RBAC
        const SECRET_KEY = "your_secret_key";

        const users = {
            user1: { username: "user1", password: "pass123", role: "admin" },
            user2: { username: "user2", password: "pass123", role: "user" },
        };

        // Login endpoint
        app.post("/login", async (req, res) => {
            const { username, password } = req.body;
            const user = users[username];

            if (!user || user.password !== password) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generate token & store role in Redis
            const token = jwt.sign({ username, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
            await client.set(username, user.role);

            res.json({ token, role: user.role });
        });

        // Get user role from Redis
        app.get("/role/:username", async (req, res) => {
            const role = await client.get(req.params.username);
            res.json({ role });
        });


        
// CRUD Operations

// Create (C)
app.post('/students', async (req, res) => {
  const { id, name, course, age, address, email, enrollmentDate, phone } = req.body;

  // Validate input fields
  if (!id || !name || !course || !age || !address || !email || !enrollmentDate || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Set student data in Redis
    const studentData = { name, course, age, address, email, enrollmentDate, phone };

    // Save student data in Redis hash
    await client.hSet(`student:${id}`, 'name', studentData.name);
    await client.hSet(`student:${id}`, 'course', studentData.course);
    await client.hSet(`student:${id}`, 'age', studentData.age);
    await client.hSet(`student:${id}`, 'address', studentData.address);
    await client.hSet(`student:${id}`, 'email', studentData.email);
    await client.hSet(`student:${id}`, 'enrollmentDate', studentData.enrollmentDate);
    await client.hSet(`student:${id}`, 'phone', studentData.phone);

    // Respond with success message
    res.status(201).json({ message: 'Student saved successfully' });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ message: 'Failed to save student' });
  }
});



// Read all students (R)
app.get('/students', async (req, res) => {
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      const data = { id: key.split(':')[1], ...(await client.hGetAll(key)) };
      return data;
    }));
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Read single student
app.get('/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const student = await client.hGetAll(`student:${id}`);
    if (Object.keys(student).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Search students
app.get('/students/search', async (req, res) => {
  const { field, term } = req.query;
  try {
    const keys = await client.keys('student:*');
    const students = await Promise.all(keys.map(async (key) => {
      const data = { id: key.split(':')[1], ...(await client.hGetAll(key)) };
      return data;
    }));
    const filtered = students.filter(student =>
      student[field]?.toLowerCase().includes(term.toLowerCase())
    );
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Update (U)
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const { name, course, age, address, email, enrollmentDate, phone } = req.body;

  if (!name && !course && !age && !address && !email && !enrollmentDate && !phone) {
    return res.status(400).json({ message: 'At least one field is required to update' });
  }

  try {
    const existingStudent = await client.hGetAll(`student:${id}`);
    if (Object.keys(existingStudent).length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student data in Redis
    if (name) await client.hSet(`student:${id}`, 'name', name);
    if (course) await client.hSet(`student:${id}`, 'course', course);
    if (age) await client.hSet(`student:${id}`, 'age', age);
    if (address) await client.hSet(`student:${id}`, 'address', address);
    if (email) await client.hSet(`student:${id}`, 'email', email);
    if (enrollmentDate) await client.hSet(`student:${id}`, 'enrollmentDate', enrollmentDate);
    if (phone) await client.hSet(`student:${id}`, 'phone', phone);

    res.status(200).json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});


// Delete (D)
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await client.del(`student:${id}`);
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});



        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        process.exit(1);
    }
})();