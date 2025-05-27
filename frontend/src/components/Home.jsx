import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import logo from '../assets/logo55.png';
import 'animate.css';

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i) => {
    const delay = i * 0.5;
    return {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay, type: 'spring', duration: 1.5, bounce: 0 },
        opacity: { delay, duration: 0.01 },
      },
    };
  },
};

const shape = {
  strokeWidth: 10,
  strokeLinecap: 'round',
  fill: 'transparent',
};

const Home = () => {
  const [position, setPosition] = useState(1); // 0 = Employee, 1 = Neutral, 2 = Admin
  const navigate = useNavigate();

 const handleToggleClick = (event) => {
  const toggleWidth = event.currentTarget.offsetWidth;
  const clickX = event.nativeEvent.offsetX;
  const zoneWidth = toggleWidth / 3;

  let newPosition = 1;
  let navigateTo = null;

  if (clickX < zoneWidth) {
    newPosition = 0; // Employee
    navigateTo = '/employee';
  } else if (clickX > 2 * zoneWidth) {
    newPosition = 2; // Admin
    navigateTo = '/admin';
  } else {
    newPosition = 1; // Neutral
  }

  // Set the toggle knob position to animate it
  setPosition(newPosition);

  // If navigation is needed, wait for animation to finish (~400ms)
  if (navigateTo) {
    setTimeout(() => {
      navigate(navigateTo);
    }, 400);
  }
};



  const getX = () => (position === 0 ? -100 : position === 2 ? 100 : 0);
  const getRotate = () => (position === 0 ? -15 : position === 2 ? 15 : 0);
  const getLabel = () => (position === 0 ? '👷 Employee Panel' : position === 2 ? '🛠️ Admin Panel' : '⚪ Select Panel');

  return (
    <Container className="text-center mt-5 animate__animated animate__fadeIn">
      <motion.img
        src={logo}
        alt="Quastech Logo"
        style={{ width: 200, marginBottom: 30 }}
        animate={{ x: getX(), rotate: getRotate() }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
        className="animate__animated animate__bounceIn"
      />

      <h1 className="mb-4 fw-bold">Welcome to Quastech Attendance System</h1>

      {/* Toggle Labels */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '120px', fontWeight: 'bold', marginBottom: 10 }}>
        <span style={{ color: position === 0 ? '#ff0088' : '#888' }}>👷 Employee</span>
        <span style={{ color: position === 2 ? '#0d63f8' : '#888' }}>🛠️ Admin</span>
      </div>

      {/* Toggle Switch */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div
          onClick={handleToggleClick}
          style={{
            width: 180,
            height: 60,
            backgroundColor: 'rgba(153, 17, 255, 0.15)',
            borderRadius: 50,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#ff0088',
              position: 'absolute',
              left: position === 0 ? 10 : position === 1 ? 65 : 120,
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>{getLabel()}</div>

      {/* Decorative Path Drawing Animation */}
      <motion.svg
        width="600"
        height="600"
        viewBox="0 0 600 600"
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '80vw', marginTop: 50 }}
      >
        <motion.circle cx="100" cy="100" r="80" stroke="#ff0088" variants={draw} custom={1} style={shape} />
        <motion.line x1="220" y1="30" x2="360" y2="170" stroke="#8df0cc" variants={draw} custom={2} style={shape} />
        <motion.line x1="220" y1="170" x2="360" y2="30" stroke="#8df0cc" variants={draw} custom={2.5} style={shape} />
        <motion.rect width="140" height="140" x="410" y="30" rx="20" stroke="#0d63f8" variants={draw} custom={3} style={shape} />
        <motion.circle cx="100" cy="300" r="80" stroke="#0d63f8" variants={draw} custom={2} style={shape} />
        <motion.line x1="220" y1="230" x2="360" y2="370" stroke="#ff0088" custom={3} variants={draw} style={shape} />
        <motion.line x1="220" y1="370" x2="360" y2="230" stroke="#ff0088" custom={3.5} variants={draw} style={shape} />
        <motion.rect width="140" height="140" x="410" y="230" rx="20" stroke="#8df0cc" custom={4} variants={draw} style={shape} />
        <motion.circle cx="100" cy="500" r="80" stroke="#8df0cc" variants={draw} custom={3} style={shape} />
        <motion.line x1="220" y1="430" x2="360" y2="570" stroke="#0d63f8" variants={draw} custom={4} style={shape} />
        <motion.line x1="220" y1="570" x2="360" y2="430" stroke="#0d63f8" variants={draw} custom={4.5} style={shape} />
        <motion.rect width="140" height="140" x="410" y="430" rx="20" stroke="#ff0088" variants={draw} custom={5} style={shape} />
      </motion.svg>
    </Container>
  );
};

export default Home;
