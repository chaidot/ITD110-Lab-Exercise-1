import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Papa from 'papaparse';

const API_URL = 'http://localhost:5000/students';

function App() {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    course: '',
    age: '',
    address: '',
    email: '',
    enrollmentDate: '',
    phone: ''
  });
  const [students, setStudents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [inputMethod, setInputMethod] = useState('manual'); // New state for input method

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: async (result) => {
        const csvData = result.data
          .slice(1) // Skip header row
          .map((row) => ({
            id: row[0],
            name: row[1],
            course: row[2],
            age: row[3],
            address: row[4],
            email: row[5],
            enrollmentDate: row[6],
            phone: row[7]
          }))
          .filter((student) => student.id); // Filter out empty rows

        try {
          await axios.post(`${API_URL}/bulk`, { students: csvData });
          toast.success('CSV uploaded successfully!');
          fetchStudents();
        } catch (error) {
          toast.error('Error uploading CSV!');
          console.error('Upload Error:', error.response?.data || error.message);
        }
      },
      header: false,
      skipEmptyLines: true,
    });
  };

  

  // Existing functions remain the same
  const fetchStudents = async () => {
    try {
      const response = await axios.get(API_URL);
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error fetching students!');
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const searchValue = student[searchField]?.toString().toLowerCase() || '';
      return searchValue.includes(searchTerm.toLowerCase());
    });

    setFilteredStudents(filtered);
    
    if (filtered.length === 0) {
      toast.info("No students found.");
    } else {
      toast.success(`Found ${filtered.length} student(s)`);
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setFilteredStudents(students);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      toast.success('Student added successfully!');
      fetchStudents();
      setFormData({
        id: '',
        name: '',
        course: '',
        age: '',
        address: '',
        email: '',
        enrollmentDate: '',
        phone: ''
      });
    } catch (error) {
      toast.error('Error adding student!');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/${formData.id}`, formData);
      toast.success('Student updated successfully!');
      fetchStudents();
      setFormData({
        id: '',
        name: '',
        course: '',
        age: '',
        address: '',
        email: '',
        enrollmentDate: '',
        phone: ''
      });
      setIsEditing(false);
    } catch (error) {
      toast.error('Error updating student!');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success('Student deleted!');
      fetchStudents();
    } catch (error) {
      toast.error('Error deleting student!');
    }
  };

  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
    setInputMethod('manual'); // Force manual input when editing
  };

  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Student Management System</h1>

      {/* Search Section */}
      <div className="search-section" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "15px",
        backgroundColor: "#e3f2fd",
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
        marginBottom: "20px",
      }}>
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #1a5276",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          <option value="name">Name</option>
          <option value="course">Course</option>
          <option value="email">Email</option>
          <option value="id">ID</option>
        </select>

        <input
          type="text"
          placeholder="Enter search term..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #1a5276",
            width: "200px",
          }}
        />

        <button onClick={handleSearch} id="search-button">Search</button>
        <button onClick={handleResetSearch} id="reset-button">Reset</button>
      </div>

      {/* Input Method Selector */}
      {!isEditing && (
        <div className="input-method-selector" style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "10px" }}>
            Input Method:
            <select
              value={inputMethod}
              onChange={(e) => setInputMethod(e.target.value)}
              style={{
                marginLeft: "10px",
                padding: "5px",
                borderRadius: "4px"
              }}
            >
              <option value="manual">Manual Entry</option>
              <option value="csv">Upload CSV</option>
            </select>
          </label>
        </div>
      )}

      {/* Form Section */}
      {inputMethod === 'manual' ? (
        <form onSubmit={isEditing ? handleEditSubmit : handleAddSubmit}>
          <input type="text" name="id" placeholder="ID" value={formData.id} onChange={handleChange} required disabled={isEditing} />
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input type="text" name="course" placeholder="Course" value={formData.course} onChange={handleChange} required />
          <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} required />
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="date" name="enrollmentDate" placeholder="Enrollment Date" value={formData.enrollmentDate} onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required />
          <button className='add-btn' id ="cssAddButton" type="submit">{isEditing ? "Update Student" : "Add Student"}</button>
        </form>
      ) : (
        <div className="csv-upload" style={{ margin: "20px 0" }}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleCSVUpload}
            style={{ margin: "10px" }}
          />
          <p style={{ fontSize: "0.9em", color: "#666" }}>
            Please ensure your CSV file has the following columns in order:<br />
            ID, Name, Course, Age, Address, Email, Enrollment Date, Phone
          </p>
        </div>
      )}

      {/* Student List Table */}
      <h2>Student List</h2>
      <table border="1" align="center" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Age</th>
            <th>Address</th>
            <th>Email</th>
            <th>Enrollment Date</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.name}</td>
              <td>{student.course}</td>
              <td>{student.age}</td>
              <td>{student.address}</td>
              <td>{student.email}</td>
              <td>{student.enrollmentDate}</td>
              <td>{student.phone}</td>
              <td>
                <div className="action-buttons">
                  <button id="edit-button" onClick={() => handleEdit(student)}>Edit</button>
                  <button id="delete-button" onClick={() => handleDelete(student.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ToastContainer />
    </div>
  );
}

export default App;