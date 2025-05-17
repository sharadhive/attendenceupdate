import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';
import logo from '../assets/logo55.png'; // updated path to renamed logo
import 'animate.css';

function Home() {
  const navigate = useNavigate();

  return (
    <Container className="text-center mt-5 animate__animated animate__fadeIn">
      <img
        src={logo}
        alt="Company Logo"
        style={{ width: '200px', marginBottom: '30px' }}
        className="animate__animated animate__bounceIn"
      />
      <h1 className="mb-4 fw-bold">Welcome to Quastech Attendance System</h1>
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4} className="mb-3">
          <Button
            variant="primary"
            size="lg"
            className="w-100 animate__animated animate__fadeInLeft"
            onClick={() => navigate('/employee')}
          >
            👷 Employee Panel
          </Button>
        </Col>
        <Col xs={12} md={6} lg={4}>
          <Button
            variant="success"
            size="lg"
            className="w-100 animate__animated animate__fadeInRight"
            onClick={() => navigate('/admin')}
          >
            🛠️ Admin Panel
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
