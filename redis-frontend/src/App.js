import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './Login.js';
import './App.css';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const API_URL = 'http://localhost:5000/students';


const InputMethodModal = ({ isOpen, onClose, onSelectInputMethod, inputMethod, formData, handleChange, handleAddSubmit, handleEditSubmit, isEditing, handleCSVUpload }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div className="form-container">
        <h3>Select Input Method</h3>
        <div className="modal-buttons">
          <button 
            onClick={() => onSelectInputMethod('manual')} 
          >
            Manual Entry
          </button>
          <button 
            onClick={() => onSelectInputMethod('csv')} 
          >
            Upload CSV
          </button>
          
        </div>

        {inputMethod === 'manual' && (
          <form onSubmit={isEditing ? handleEditSubmit : handleAddSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>ID:</label>
              <input 
                type="text" 
                name="id" 
                placeholder="ID" 
                value={formData.id} 
                onChange={handleChange} 
                required 
                disabled={isEditing} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Name:</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Course:</label>
              <input 
                type="text" 
                name="course" 
                placeholder="Course" 
                value={formData.course} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Age:</label>
              <input 
                type="number" 
                name="age" 
                placeholder="Age" 
                value={formData.age} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Address:</label>
              <input 
                type="text" 
                name="address" 
                placeholder="Address" 
                value={formData.address} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Email:</label>
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Enrollment Date:</label>
              <input 
                type="date" 
                name="enrollmentDate" 
                placeholder="Enrollment Date" 
                value={formData.enrollmentDate} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '45%' }}>
              <label>Phone:</label>
              <input 
                type="tel" 
                name="phone" 
                placeholder="Phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required 
              />
            </div>
            <button type="submit">
          {isEditing ? "Update Student" : "Add Student"}
        </button>
          </form>
        )}

        {inputMethod === 'csv' && (
          <div className="csv-upload">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
            />
            <p>
              Please ensure your CSV file has the following columns in order:<br />
              ID, Name, Course, Age, Address, Email, Enrollment Date, Phone
            </p>
          </div>
        )}

        <button 
          onClick={onClose} 
          style={{ 
            margin: '10px', 
            padding: '10px 20px', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            backgroundColor: '#e63946', 
            color: 'black', 
            border: 'none', 
            fontSize: '16px',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

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
  const [inputMethod, setInputMethod] = useState('manual');
  const [isModalOpen, setIsModalOpen] = useState(false);
  //RBAC
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);



  //Login
  const userRoles = {
    admin: ["add_student", "edit_student", "delete_student", "view_students"],
    user: ["add_student", "edit_student", "delete_student", "view_students"],
    student: ["view_students"],
  };

  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.role) return false;
    const permissions = userRoles[currentUser.role] || [];
    return permissions.includes(permission);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }
    setLoading(false);
  }, []);
  

  useEffect(() => {
    if (!isAuthenticated) return; 
    fetchStudents();
  }, [isAuthenticated]);
  
  
  // Event handlers
  const handleLogin = (user, token) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    
    toast.success('Logged in successfully!');
  };

  //Logout
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    toast.success('Logged out successfully');

    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setCurrentUser(null);
      setShowLogoutModal(false);
      
    }, 800);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };


  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }


  const handleSelectInputMethod = (method) => {
    setInputMethod(method);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const headerMap = {
      id: "id",
      name: "name",
      course: "course",
      age: "age",
      address: "address",
      email: "email",
      "enrollmentdate": "enrollmentDate",
      phone: "phone"
    };

    Papa.parse(file, {
      header: true,
      transformHeader: (header) => {
        const normalizedHeader = header.trim().toLowerCase();
        return headerMap[normalizedHeader] || normalizedHeader;
      },
      complete: async (result) => {
        console.log("Raw parsed data:", result.data);

        const csvData = result.data
          .filter(row => {
            return Object.values(row).some(value => value !== undefined && value !== null && String(value).trim() !== "");
          })
          .map(student => {
            const cleanedStudent = {
              id: student.id?.toString().trim() || null,
              name: student.name?.toString().trim() || null,
              course: student.course?.toString().trim() || null,
              age: student.age ? parseInt(student.age.toString().trim(), 10) : null,
              address: student.address?.toString().trim() || null,
              email: student.email?.toString().trim() || null,
              enrollmentDate: student.enrollmentDate?.toString().trim() || null,
              phone: student.phone?.toString().trim() || null,
            };

            console.log("Cleaned student data:", cleanedStudent);

            const missingFields = Object.entries(cleanedStudent)
              .filter(([key, value]) => {
                const isEmpty = !value && value !== 0;
                if (isEmpty) {
                  console.warn(`Field "${key}" is empty for student ${cleanedStudent.id}`);
                }
                return isEmpty;
              })
              .map(([key]) => key);

            if (missingFields.length > 0) {
              console.warn(`Student ${cleanedStudent.id} missing fields: ${missingFields.join(', ')}`);
            }

            return cleanedStudent;
          });

        console.log("Processed data (cleaned):", csvData);

        const invalidRows = csvData.filter(student => {
          const missingFields = [];
          if (!student.id) missingFields.push('id');
          if (!student.name) missingFields.push('name');
          if (!student.course) missingFields.push('course');
          if (student.age === null) missingFields.push('age');
          if (!student.address) missingFields.push('address');
          if (!student.email) missingFields.push('email');
          if (!student.enrollmentDate) missingFields.push('enrollmentDate');
          if (!student.phone) missingFields.push('phone');

          if (missingFields.length > 0) {
            console.error(`Invalid row for student ${student.id}:`, {
              missingFields,
              rowData: student
            });
          }

          return missingFields.length > 0;
        });

        if (invalidRows.length > 0) {
          console.error("Invalid rows detected:", invalidRows);
          toast.error(`CSV contains ${invalidRows.length} row(s) with missing required fields. Please ensure all fields are filled.`);
          return;
        }

        if (csvData.length === 0) {
          toast.error('No valid data found in CSV');
          return;
        }

        try {
          for (const student of csvData) {
            console.log("Attempting to upload student:", student);
            const response = await axios.post(API_URL, student);
            console.log("Upload response:", response.data);
          }

          toast.success('CSV uploaded successfully!');
          fetchStudents();
        } catch (error) {
          console.error('Upload error:', {
            error,
            errorResponse: error.response?.data,
            errorMessage: error.message
          });
          const errorMessage = error.response?.data?.message || error.message;
          toast.error(`Error uploading CSV: ${errorMessage}`);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        toast.error('Error parsing CSV file');
      }
    });
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(API_URL);
      const sortedStudents = response.data.sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ""), 10); // Extract numeric part
        const numB = parseInt(b.id.replace(/\D/g, ""), 10);
        return numA - numB;
      });
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Error fetching students!');
    }
  };

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
      setIsModalOpen(false); // Close modal after submission
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
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Error updating student!');
    }
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Student deleted!");
      await fetchStudents();
    } catch (error) {
      toast.error("Error deleting student!");
    }
  };
  

  const handleEdit = (student) => {
    setFormData(student);
    setIsEditing(true);
    setInputMethod('manual');
    setIsModalOpen(true); // Open modal when editing
  };

  const courseData = students.reduce((acc, student) => {
    const course = student.course;
    acc[course] = (acc[course] || 0) + 1;
    return acc;
  }, {});

  const courseChartData = Object.entries(courseData).map(([course, count]) => ({
    name: course,
    students: count,
  }));

  const ageData = students.reduce((acc, student) => {
    acc[student.age] = (acc[student.age] || 0) + 1;
    return acc;
  }, {});

  const ageChartData = Object.entries(ageData).map(([age, count]) => ({
    name: age,
    students: count,
  }));

  const enrollmentData = students.reduce((acc, student) => {
    const date = new Date(student.enrollmentDate);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[yearMonth] = (acc[yearMonth] || 0) + 1;
    return acc;
  }, {});

  const enrollmentChartData = Object.entries(enrollmentData).map(([date, count]) => ({
    date,
    students: count,
  }));

  return (
    <>
    <div className='Header'> 
    <button className="logout-button" onClick={handleLogout} >Logout</button>
  </div>
  {showLogoutModal && (
        <div className="modal-overlay-logout">
          <div className="modal-card-logout">
            <h3>Are you sure you want to logout?</h3>
            <div className="modal-actions-out">
              <button onClick={cancelLogout} className="cancel-btn">
                Cancel
              </button>
              <button onClick={confirmLogout} className="confirm-btn">
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    
    <div className="container" style={{ textAlign: 'center', alignContent: 'center' }}>
      <h1>Student Management System</h1>

      <div className="search-section">
        <select value={searchField} onChange={(e) => setSearchField(e.target.value)}>
          <option value="name">Name</option>
          <option value="course">Course</option>
          <option value="email">Email</option>
          <option value="id">ID</option>
        </select>
        <input
          type="text"
          placeholder="Enter search term..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={handleSearch} id="search-button">Search</button>
        <button onClick={handleResetSearch} id="reset-button">Reset</button>
      </div>

      {hasPermission("add_student") && (
        <button
        onClick={() => {
          setIsEditing(false); // Ensure it's not in edit mode
          setFormData({       // Reset form data
            id: '',
            name: '',
            course: '',
            age: '',
            address: '',
            email: '',
            enrollmentDate: '',
            phone: ''
          });
          setIsModalOpen(true); // Open modal
        }}
        className='add-btn'
        id="cssAddButton"
      >
        Add Student
      </button>
      
      
          )}


      <InputMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectInputMethod={handleSelectInputMethod}
        inputMethod={inputMethod}
        formData={formData}
        handleChange={handleChange}
        handleAddSubmit={handleAddSubmit}
        handleEditSubmit={handleEditSubmit}
        isEditing={isEditing}
        handleCSVUpload={handleCSVUpload} />

      <h2 style={{ color: "#40B5AD", fontSize: "24px", fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
        Student List
      </h2>

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

                  {hasPermission("edit_student") && (
                  <button id="edit-button" onClick={() => handleEdit(student)}>Edit</button> )}

                {hasPermission("delete_student") && (
                  <button id="delete-button" onClick={() => handleDelete(student.id)}>Delete</button> )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Charts Section */}
      <h2 style={{ color: "#40B5AD", fontSize: "24px", fontWeight: "bold", fontFamily: "Arial, sans-serif" }}>
        Data Visualization
      </h2>

      <div className="chart-container" style={{ padding: "20px", backgroundColor: "#f4f7fc", borderRadius: "8px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <h3>Number of Students per Course</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={courseChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" label={{ value: 'Course', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="students" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>

        <h3>Age Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={ageChartData} dataKey="students" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
              {ageChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <h3>Enrollment Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={enrollmentChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" label={{ value: 'Date (Year-Month)', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="students" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ToastContainer />
    </div></>
  );
}

export default App;