const express = require('express');
const redis = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to Redis
const client = redis.createClient({
  url: 'redis://@127.0.0.1:6379'  // Default Redis connection
});

client.connect()
  .then(() => console.log('Connected to Redis'))
  .catch(err => console.error('Redis connection error:', err));

// CRUD Operations

// Route to save student data
app.post('/students', async (req, res) => {
  const { id, name, course, age, address } = req.body;

  // Validate input fields
  if (!id || !name || !course || !age || !address) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Set student data in Redis (using object syntax for Redis v4 and above)
    const studentData = { name, course, age, address };

    // Save student data in Redis hash
    await client.hSet(`student:${id}`, 'name', studentData.name);
    await client.hSet(`student:${id}`, 'course', studentData.course);
    await client.hSet(`student:${id}`, 'age', studentData.age);
    await client.hSet(`student:${id}`, 'address', studentData.address);

    // Force Redis to persist data
    await client.bgsave();

    // Respond with success message
    res.status(201).json({ message: 'Student saved successfully' });
  } catch (error) {
    console.error('Error saving student:', error);
    res.status(500).json({ message: 'Failed to save student' });
  }
});


// Read (R)
app.get('/students/:id', async (req, res) => {
  const id = req.params.id;
  const student = await client.hGetAll(`student:${id}`);
  if (Object.keys(student).length === 0) {
    return res.status(404).json({ message: 'Student not found' });
  }
  res.json(student);
});

// Read all students
app.get('/students', async (req, res) => {
  const keys = await client.keys('student:*');
  const students = await Promise.all(keys.map(async (key) => {
    return { id: key.split(':')[1], ...(await client.hGetAll(key)) };
  }));
  res.json(students);
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


// Delete
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  await client.del(`student:${id}`);
  res.status(200).json({ message: 'Student deleted successfully' });
});

// Bulk insert students
app.post('/students/bulk', async (req, res) => {
  try {
      const { students } = req.body; // Expecting an array of student objects

      if (!Array.isArray(students) || students.length === 0) {
          return res.status(400).json({ message: "Invalid student data" });
      }

      // Store each student in Redis
      for (const student of students) {
          const { id, name, course, age, address } = student;
          if (!id || !name || !course || !age || !address) {
              return res.status(400).json({ message: "All fields are required for each student" });
          }

          await client.hSet(`student:${id}`, {
              name,
              course,
              age,
              address
          });
      }

      res.status(201).json({ message: "Students added successfully!" });
  } catch (error) {
      console.error("Error inserting students:", error);
      res.status(500).json({ message: "Server error", error });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});