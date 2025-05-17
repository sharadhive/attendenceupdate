// Top imports unchanged
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
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const webcamRef = useRef(null);

  // ✅ Simple and cross-browser friendly selfie camera constraints
  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: { ideal: 'user' }, // front-facing
  };

  const getApi = () =>
    axios.create({
      baseURL: 'http://localhost:5000/api/employee',
      headers: { Authorization: `Bearer ${token}` },
    });

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
      const payload = jwtDecode(t);
      setEmployeeEmail(payload.email || '');
      setMessage('Login successful');
      setError('');
      fetchAttendance(t);
    } catch (err) {
      setError(err.response?.data || 'Login failed');
      setMessage('');
    }
  };

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

  const fetchAttendance = async (jwt = token) => {
    if (!jwt) {
      setError('Invalid token');
      return;
    }

    try {
      const api = getApi();
      const res = await api.get('/attendance');
      if (res.data && res.data.length > 0) {
        setAttendance(res.data);
      } else {
        setAttendance([]);
        setMessage('No attendance records found.');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  const uploadToCloudinary = async (imageData) => {
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('upload_preset', 'projectatte');

    const res = await axios.post('https://api.cloudinary.com/v1_1/dakytbufv/image/upload', formData);
    return res.data.secure_url;
  };

  const captureImage = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image');
      return '';
    }
    const blob = await fetch(imageSrc).then((res) => res.blob());
    return await uploadToCloudinary(blob);
  };

  const captureAndCheckIn = async () => {
    try {
      const uploadedUrl = await captureImage();
      if (!uploadedUrl) return;

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

  const captureAndCheckOut = async () => {
    try {
      const uploadedUrl = await captureImage();
      if (!uploadedUrl) return;

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

  const captureAndBreakIn = async () => {
    try {
      const uploadedUrl = await captureImage();
      const api = getApi();
      await api.post('/breakin', { photoUrl: uploadedUrl });
      setMessage('Break in recorded');
      setError('');
      fetchAttendance();
    } catch (err) {
      console.error('Break in failed:', err);
      setError(err.response?.data || 'Break in failed');
      setMessage('');
    }
  };

  const captureAndBreakOut = async () => {
    try {
      const uploadedUrl = await captureImage();
      const api = getApi();
      await api.post('/breakout', { photoUrl: uploadedUrl });
      setMessage('Break out recorded');
      setError('');
      fetchAttendance();
    } catch (err) {
      console.error('Break out failed:', err);
      setError(err.response?.data || 'Break out failed');
      setMessage('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('employeeToken');
    setToken('');
    setAttendance([]);
    setEmployeeEmail('');
    setMessage('Logged out');
  };

  useEffect(() => {
    if (token) {
      const payload = jwtDecode(token);
      setEmployeeEmail(payload.email || '');
      fetchAttendance();
    }
  }, [token]);

  return (
    <Container className="my-4">
      <Card className="p-4 shadow">
        <h2 className="mb-4">
          Welcome {employeeEmail && ` - ${employeeEmail}`}
        </h2>

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
            {/* ✅ Working webcam preview */}
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              style={{ width: '100%', borderRadius: '10px', marginBottom: '16px' }}
            />

            <Row className="mb-3">
              <Col>
                <Button variant="success" onClick={captureAndCheckIn}>Check In with Selfie</Button>
              </Col>
              <Col>
                <Button variant="warning" onClick={captureAndBreakIn}>Break In (optional photo)</Button>
              </Col>
              <Col>
                <Button variant="info" onClick={captureAndBreakOut}>Break Out (optional photo)</Button>
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
                  <Row className="align-items-center">
                    <Col md={9}>
                      <div className="mb-2">
                        <p><strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <div className="d-flex justify-content-between flex-wrap align-items-start gap-3 mb-2">
                        <div className="text-center">
                          <strong>Check In</strong><br />
                          {entry.checkInPhoto && <Image src={entry.checkInPhoto} fluid rounded style={{ maxHeight: '130px' }} />}
                          <div>{entry.checkIn ? new Date(entry.checkIn).toLocaleTimeString() : '-'}</div>
                        </div>
                        <div className="text-center">
                          <strong>Check Out</strong><br />
                          {entry.checkOutPhoto && <Image src={entry.checkOutPhoto} fluid rounded style={{ maxHeight: '130px' }} />}
                          <div>{entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString() : '-'}</div>
                        </div>
                        <div className="text-center">
                          <strong>Break In</strong><br />
                          {entry.breakInPhoto && <Image src={entry.breakInPhoto} fluid rounded style={{ maxHeight: '130px' }} />}
                          <div>{entry.breakIn ? new Date(entry.breakIn).toLocaleTimeString() : '-'}</div>
                        </div>
                        <div className="text-center">
                          <strong>Break Out</strong><br />
                          {entry.breakOutPhoto && <Image src={entry.breakOutPhoto} fluid rounded style={{ maxHeight: '130px' }} />}
                          <div>{entry.breakOut ? new Date(entry.breakOut).toLocaleTimeString() : '-'}</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={3} className="text-end">
                      <p><strong>Total Hours:</strong> {entry.totalHours?.toFixed(2) || '-'}</p>
                      <p><strong>Status:</strong> {entry.status || 'N/A'}</p>
                      <p><strong>Remark:</strong> {entry.remarks || 'N/A'}</p>
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
