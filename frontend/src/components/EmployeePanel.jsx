import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, ListGroup, Image } from 'react-bootstrap';
import Webcam from 'react-webcam';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const EmployeePanel = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [token, setToken] = useState(localStorage.getItem('employeeToken') || '');
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const webcamRef = useRef(null);

  // Axios instance with token
  const getApi = () =>
    axios.create({
      baseURL: 'http://localhost:5000/api/employee',
      headers: { Authorization: `Bearer ${token}` },
    });

  // Login
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/employee/login', { email, password });
      const t = res.data.token;
      localStorage.setItem('employeeToken', t);
      setToken(t);
      setMessage('Login successful');
      setError('');
      fetchAttendance(t);
    } catch (err) {
      setError(err.response?.data || 'Login failed');
      setMessage('');
    }
  };

  // Decode token to get employee ID
  const getUserIdFromToken = (jwtToken) => {
    if (!jwtToken) return '';
    try {
      const payload = jwtDecode(jwtToken);
      return payload._id;
    } catch (err) {
      console.error('JWT Decode Error:', err);
      return '';
    }
  };

  // Fetch attendance (uses employee route now)
  const fetchAttendance = async (jwt = token) => {
    if (!jwt) {
      setError('Invalid token');
      return;
    }

    try {
      const api = getApi();
      const res = await api.get('/attendance'); // uses employee route
      if (res.data && res.data.length > 0) {
        setAttendance(res.data);
      } else {
        setAttendance([]);
        setMessage('No attendance records found.');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance');
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (imageData) => {
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('upload_preset', 'projectatte');

    const res = await axios.post('https://api.cloudinary.com/v1_1/dakytbufv/image/upload', formData);
    return res.data.secure_url;
  };

  // Check-In
  const captureAndCheckIn = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = await fetch(imageSrc).then(res => res.blob());

    if (!imageSrc) {
      setError('Please capture a selfie before checking in.');
      return;
    }

    try {
      const uploadedUrl = await uploadToCloudinary(blob);
      const api = getApi();
      await api.post('/checkin', { photoUrl: uploadedUrl });
      setPhotoUrl(uploadedUrl);
      setMessage('Checked in successfully');
      setError('');
      fetchAttendance();
    } catch (err) {
      console.error('Check-in failed:', err);
      setError(err.response?.data || 'Check-in failed');
      setMessage('');
    }
  };

  // Check-Out
  const captureAndCheckOut = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    const blob = await fetch(imageSrc).then(res => res.blob());

    if (!imageSrc) {
      setError('Please capture a selfie before checking out.');
      return;
    }

    try {
      const uploadedUrl = await uploadToCloudinary(blob);
      const api = getApi();
      await api.post('/checkout', { photoUrl: uploadedUrl });
      setPhotoUrl(uploadedUrl);
      setMessage('Checked out successfully');
      setError('');
      fetchAttendance();
    } catch (err) {
      console.error('Check-out failed:', err);
      setError(err.response?.data || 'Check-out failed');
      setMessage('');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    setToken('');
    setAttendance([]);
    setMessage('Logged out');
  };

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [token]);

  return (
    <Container className="my-4">
      <Card className="p-4 shadow">
        <h2 className="mb-4">Employee Panel</h2>

        {!token && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Email:</Form.Label>
              <Form.Control value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password:</Form.Label>
              <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" onClick={handleLogin}>Login</Button>
          </>
        )}

        {token && (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              className="mb-3"
            />
            <Row className="mb-3">
              <Col>
                <Button variant="success" onClick={captureAndCheckIn}>Check In with Selfie</Button>
              </Col>
              <Col>
                <Button variant="danger" onClick={captureAndCheckOut}>Check Out with Selfie</Button>
              </Col>
            </Row>

            <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Logout</Button>

            <hr />

            <h5>Attendance History</h5>
            <ListGroup>
              {attendance.map((entry) => (
                <ListGroup.Item key={entry._id}>
                  <Row>
                    <Col md={3}>
                      <strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}<br />
                      <strong>In:</strong> {entry.checkIn ? new Date(entry.checkIn).toLocaleTimeString() : '-'}<br />
                      <strong>Out:</strong> {entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString() : '-'}
                    </Col>
                    <Col md={3}>
                      <Image src={entry.checkInPhoto} alt="CheckIn" fluid rounded />
                    </Col>
                    <Col md={3}>
                      <Image src={entry.checkOutPhoto} alt="CheckOut" fluid rounded />
                    </Col>
                    <Col md={3}>
                      <strong>Total Hours:</strong> {entry.totalHours?.toFixed(2) || '-'}
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}

        {message && <Alert className="mt-3" variant="success">{message}</Alert>}
        {error && <Alert className="mt-3" variant="danger">{error}</Alert>}
      </Card>
    </Container>
  );
};

export default EmployeePanel;
