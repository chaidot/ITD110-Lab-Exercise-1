import "./Login.css";
import { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = "http://localhost:5000/login";
const REGISTER_URL = "http://localhost:5000/register";

const LoginForm = ({ onLogin }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const url = isRegistering ? REGISTER_URL : API_URL;
            const response = await axios.post(url, formData);
            
            if (response.data.success) {
                toast.success(`${isRegistering ? "Registration" : "Login"} successful!`);
                
                if (isRegistering) {
                    setIsRegistering(false);
                    setFormData({ email: '', password: '' });
                } else {
                    const { user, token } = response.data;
                    localStorage.setItem('user', JSON.stringify(user));
                    if (token) {
                        localStorage.setItem('token', token);
                    }
                    onLogin(user, token);
                }
            } else {
                setError(response.data.message || "Invalid email or password.");
                toast.error(response.data.message || `${isRegistering ? "Registration" : "Login"} failed.`);
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || 
                               "Error connecting to server or invalid credentials.";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="login-container">
            <ToastContainer />
            <form onSubmit={handleSubmit} className="login-form">
                <h2>{isRegistering ? "Register" : "Login"}</h2>
                
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" className="submit-button">
                    {isRegistering ? "Register" : "Login"}
                </button>

                <div className="switch-form">
                    <p>{isRegistering ? "Already have an account?" : "Don't have an account?"}</p>
                    <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="switch-button"
                    >
                        {isRegistering ? "Switch to Login" : "Switch to Register"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;