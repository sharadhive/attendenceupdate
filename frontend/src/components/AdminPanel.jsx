import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Container, Form, Button, Table, Accordion, Image } from 'react-bootstrap';
import * as XLSX from 'xlsx';

function AdminPanel() {
  const [branchName, setBranchName] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchPassword, setNewBranchPassword] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeAttendance, setSelectedEmployeeAttendance] = useState({});
  const [activeEmployeeId, setActiveEmployeeId] = useState(null);

  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      const decoded = jwtDecode(storedToken);
      setBranchName(decoded.name);
      fetchEmployees(decoded.name, storedToken);
    } else {
      localStorage.removeItem('adminToken');
    }
  }, []);

  const login = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', {
        name: branchName,
        password,
      });
      const token = res.data.token;
      localStorage.setItem('adminToken', token);
      setToken(token);
      const decoded = jwtDecode(token);
      setBranchName(decoded.name);
      fetchEmployees(decoded.name, token);
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setBranchName('');
    setEmployees([]);
    setActiveEmployeeId(null);
    setSelectedEmployeeAttendance({});
  };

  const fetchEmployees = async (branchNameToUse, tokenToUse) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/employees/${branchNameToUse}`, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      setEmployees(res.data);
    } catch (err) {
      alert('Failed to fetch employees');
    }
  };

  const createBranch = async () => {
    try {
      await axios.post('http://localhost:5000/api/admin/register-branch', {
        branchName: newBranchName,
        password: newBranchPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Branch created successfully');
      setNewBranchName('');
      setNewBranchPassword('');
    } catch (err) {
      alert('Branch creation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const createEmployee = async () => {
    try {
      await axios.post('http://localhost:5000/api/admin/create-employee', {
        email: newEmpEmail,
        password: newEmpPassword,
        branch: branchName,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Employee created');
      fetchEmployees(branchName, token);
      setNewEmpEmail('');
      setNewEmpPassword('');
    } catch (err) {
      alert('Failed to create employee: ' + (err.response?.data?.message || err.message));
    }
  };

  const viewAttendance = async (empId) => {
    const newId = activeEmployeeId === empId ? null : empId;
    setActiveEmployeeId(newId);
    if (!newId) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/admin/attendance/${empId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedEmployeeAttendance(prev => ({ ...prev, [empId]: res.data }));
    } catch {
      alert('Failed to load attendance');
    }
  };

  const exportToExcel = (data, filename = 'attendance.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    XLSX.writeFile(workbook, filename);
  };

  const updateAttendance = async (empId, recordId, status, remarks) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/attendance/${recordId}`, {
        status,
        remarks,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedRecords = selectedEmployeeAttendance[empId].map(rec =>
        rec._id === recordId ? { ...rec, status, remarks } : rec
      );
      setSelectedEmployeeAttendance(prev => ({ ...prev, [empId]: updatedRecords }));
      alert('Attendance updated');
    } catch {
      alert('Failed to update attendance');
    }
  };

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <Container className="p-4">
      <style>
     {`
      .hover-enlarge {
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
        z-index: 1;
      }

      .hover-enlarge:hover {
        position: fixed;
        top: 0;
        left: 0;
        width: 50vw;
        height: 100vh;
        object-fit: contain;
        background-color: rgba(0, 0, 0, 0.85);
        padding: 20px;
        z-index: 9999;
      }
    `}
      </style>

      <h2>Admin Panel</h2>

      {!token && (
        <Form className="mb-3">
          <Form.Group>
            <Form.Label>Branch Name</Form.Label>
            <Form.Control
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <Button className="mt-2" onClick={login}>Login</Button>
        </Form>
      )}

      {token && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Logged in as: <strong>{branchName}</strong></h5>
            <Button variant="danger" size="sm" onClick={logout}>Logout</Button>
          </div>

          <h5 className="mt-4">Employees</h5>
          <Accordion activeKey={activeEmployeeId}>
            {employees.map(emp => (
              <Accordion.Item eventKey={emp._id} key={emp._id}>
                <Accordion.Header onClick={() => viewAttendance(emp._id)}>
                  {emp.email}
                </Accordion.Header>
                <Accordion.Body>
                  {(selectedEmployeeAttendance[emp._id] || []).length > 0 && (
                    <Button
                      size="sm"
                      className="mb-2"
                      onClick={() =>
                        exportToExcel(selectedEmployeeAttendance[emp._id], `${emp.email}_attendance.xlsx`)
                      }
                    >
                      Download Attendance
                    </Button>
                  )}
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Break In</th>
                        <th>Break Out</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Status</th>
                        <th>Remark</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedEmployeeAttendance[emp._id] || []).map((rec, i) => {
                        // const editable = isToday(rec.date);  
                                                const editable = true; 
                        return (
                          <tr key={i}>
                            <td>{new Date(rec.date).toLocaleDateString("en-IN")}</td>
                            <td>{rec.checkInPhoto && <Image src={rec.checkInPhoto} thumbnail width={30} className="hover-enlarge" />}<br />{rec.checkIn && new Date(rec.checkIn).toLocaleTimeString("en-IN")}</td>
                            <td>{rec.breakInPhoto && <Image src={rec.breakInPhoto} thumbnail width={30} className="hover-enlarge" />}<br />{rec.breakIn && new Date(rec.breakIn).toLocaleTimeString("en-IN")}</td>
                            <td>{rec.breakOutPhoto && <Image src={rec.breakOutPhoto} thumbnail width={30} className="hover-enlarge" />}<br />{rec.breakOut && new Date(rec.breakOut).toLocaleTimeString("en-IN")}</td>
                            <td>{rec.checkOutPhoto && <Image src={rec.checkOutPhoto} thumbnail width={30} className="hover-enlarge" />}<br />{rec.checkOut && new Date(rec.checkOut).toLocaleTimeString("en-IN")}</td>
                            <td>{rec.totalHours ? rec.totalHours.toFixed(2) : '—'}</td>
                            <td>
                              {editable ? (
                                <Form.Select
                                  size="sm"
                                  value={rec.status || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedEmployeeAttendance[emp._id]];
                                    updated[i].status = e.target.value;
                                    setSelectedEmployeeAttendance(prev => ({ ...prev, [emp._id]: updated }));
                                  }}
                                >
                                  <option value="On-time">On-time</option>
                                  <option value="Week Off">Week Off</option>
                                  <option value="Half-day">Half-day</option>
                                  <option value="Late">Late</option>
                                  <option value="Absent">Absent</option>
                                </Form.Select>
                              ) : rec.status || '—'}
                            </td>
                            <td>
                              {editable ? (
                                <Form.Control
                                  size="sm"
                                  type="text"
                                  value={rec.remarks || ''}
                                  onChange={(e) => {
                                    const updated = [...selectedEmployeeAttendance[emp._id]];
                                    updated[i].remarks = e.target.value;
                                    setSelectedEmployeeAttendance(prev => ({ ...prev, [emp._id]: updated }));
                                  }}
                                />
                              ) : rec.remarks || '—'}
                            </td>
                            <td>
                              {editable && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() =>
                                    updateAttendance(emp._id, rec._id, rec.status, rec.remarks)
                                  }
                                >
                                  Save
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>

          <Form className="mt-4">
            <h5>Add New Branch</h5>
            <Form.Group className="mb-2">
              <Form.Label>Branch Name</Form.Label>
              <Form.Control
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newBranchPassword}
                onChange={(e) => setNewBranchPassword(e.target.value)}
              />
            </Form.Group>
            <Button onClick={createBranch}>Create Branch</Button>
          </Form>

          <Form className="mt-4">
            <h5>Add New Employee</h5>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newEmpPassword}
                onChange={(e) => setNewEmpPassword(e.target.value)}
              />
            </Form.Group>
            <Button onClick={createEmployee}>Create Employee</Button>
          </Form>
        </>
      )}
    </Container>
  );
}

export default AdminPanel;
