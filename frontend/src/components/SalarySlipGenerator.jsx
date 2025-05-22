import React, { useState, useRef } from 'react';
import { Button, Form, Modal, Row, Col } from 'react-bootstrap';
import html2pdf from 'html2pdf.js';

const branchAddresses = {
  mohali: 'SCF 62, Third Floor, Phase 7, Sector 61, Sahibzada Ajit Singh Nagar, Punjab, Mohali, India 160062',
  thane: '201, Anant Laxmi Chambers, Dada Patil Marg, opp. Waman Hari Pethe Jewellers, Thane, Maharashtra - 400602',
  vashi: 'Corporate Wing, F-185(A, behind Inorbit Mall, Sector 30, Vashi, Navi Mumbai - 400703',
  borivali: 'A/401, Court Chamber, Opp. Moksh Plaza, S.V. Road, Borivali (W) - 400092'
};

const SalarySlipGenerator = () => {
  const [show, setShow] = useState(false);
  const [branch, setBranch] = useState('');
  const [address, setAddress] = useState('');
  const [ptOption, setPtOption] = useState('');
  const [customPT, setCustomPT] = useState('');
  const [earnings, setEarnings] = useState({
    basic: '',
    hra: '',
    special: '',
    conveyance: '',
    ot: '',
    arrears: '',
    incentives: ''
  });
  const [deductions, setDeductions] = useState({
    esic: '',
    mlwf: '',
    other: ''
  });

  const [formData, setFormData] = useState({
    employeeName: '',
    employeeSurname: '',
    personalId: '',
    employeeId: '',
    uanNumber: '',
    designation: '',
    fromDate: '',
    toDate: '',
    remarks: ''
  });

  const [logo, setLogo] = useState(null);
  const [signature, setSignature] = useState(null);
  const slipRef = useRef();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Disallow negative numbers for numeric fields:
    if (
      ['basic', 'hra', 'special', 'conveyance', 'ot', 'arrears', 'incentives',
       'esic', 'mlwf', 'other', 'customPT'].includes(name) && value !== ''
    ) {
      if (!/^\d*\.?\d*$/.test(value)) return; // allow only digits and decimal
    }
    if (Object.keys(earnings).includes(name)) {
      setEarnings({ ...earnings, [name]: value });
    } else if (Object.keys(deductions).includes(name)) {
      setDeductions({ ...deductions, [name]: value });
    } else if (name === 'customPT') {
      setCustomPT(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const handleBranchChange = (e) => {
    const selectedBranch = e.target.value;
    setBranch(selectedBranch);
    setAddress(branchAddresses[selectedBranch] || '');
  };

  const calculateTotal = () => {
    const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + parseFloat(val || 0), 0);
    const pt = ptOption === 'custom' ? parseFloat(customPT || 0) : parseFloat(ptOption || 0);
    const totalDeductions =
      parseFloat(deductions.esic || 0) +
      parseFloat(deductions.mlwf || 0) +
      parseFloat(deductions.other || 0) +
      (isNaN(pt) ? 0 : pt);
    const net = totalEarnings - totalDeductions;
    return { totalEarnings, totalDeductions, net, pt: isNaN(pt) ? 0 : pt };
  };

  const validateForm = () => {
    // Basic validation for required fields
    if (!branch) return false;
    if (!formData.employeeName.trim()) return false;
    if (!formData.employeeId.trim()) return false;
    if (!formData.fromDate || !formData.toDate) return false;
    // Check dates validity
    if (new Date(formData.fromDate) > new Date(formData.toDate)) return false;
    // Earnings numeric check
    for (const key in earnings) {
      if (earnings[key] === '') return false;
      if (isNaN(parseFloat(earnings[key]))) return false;
    }
    // Deductions numeric check
    for (const key in deductions) {
      if (deductions[key] === '') return false;
      if (isNaN(parseFloat(deductions[key]))) return false;
    }
    // PT custom input check
    if (ptOption === 'custom') {
      if (customPT === '' || isNaN(parseFloat(customPT))) return false;
    }
    return true;
  };

  const handleDownload = () => {
    if (!validateForm()) {
      alert('Please fill all required fields correctly before downloading the salary slip.');
      return;
    }
    const element = slipRef.current;
    html2pdf().set({
      margin: 0.5,
      filename: `${formData.employeeName}_salary_slip.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(element).save();

    setTimeout(() => {
      handleClose();
      setFormData({
        employeeName: '',
        employeeSurname: '',
        personalId: '',
        employeeId: '',
        uanNumber: '',
        designation: '',
        fromDate: '',
        toDate: '',
        remarks: ''
      });
      setBranch('');
      setAddress('');
      setPtOption('');
      setCustomPT('');
      setEarnings({ basic: '', hra: '', special: '', conveyance: '', ot: '', arrears: '', incentives: '' });
      setDeductions({ esic: '', mlwf: '', other: '' });
      setLogo(null);
      setSignature(null);
    }, 1000);
  };

  const { totalEarnings, totalDeductions, net, pt } = calculateTotal();

  return (
    <>
      <Button variant="primary" onClick={handleShow} className="my-3">
        Generate Salary Slip
      </Button>

      <Modal show={show} onHide={handleClose} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Salary Slip Generator</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Branch</Form.Label>
                  <Form.Select onChange={handleBranchChange} value={branch}>
                    <option value="">Select Branch</option>
                    <option value="mohali">Mohali</option>
                    <option value="thane">Thane</option>
                    <option value="vashi">Vashi</option>
                    <option value="borivali">Borivali</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Employee Name</Form.Label>
                  <Form.Control
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    placeholder="First Name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Surname</Form.Label>
                  <Form.Control
                    name="employeeSurname"
                    value={formData.employeeSurname}
                    onChange={handleChange}
                    placeholder="Last Name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Employee ID</Form.Label>
                  <Form.Control name="employeeId" value={formData.employeeId} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Personal ID</Form.Label>
                  <Form.Control name="personalId" value={formData.personalId} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>UAN Number</Form.Label>
                  <Form.Control name="uanNumber" value={formData.uanNumber} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Designation</Form.Label>
                  <Form.Control name="designation" value={formData.designation} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>From Date</Form.Label>
                  <Form.Control type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>To Date</Form.Label>
                  <Form.Control type="date" name="toDate" value={formData.toDate} onChange={handleChange} />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label>Branch Address</Form.Label>
              <Form.Control as="textarea" rows={3} value={address} readOnly />
            </Form.Group>

            <h5 className="mt-4">Earnings</h5>
            <Row>
              {Object.entries(earnings).map(([key, value]) => (
                <Col md={4} key={key}>
                  <Form.Group className="mb-2">
                    <Form.Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Form.Label>
                    <Form.Control
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <h5 className="mt-4">Deductions</h5>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>PT Deduction</Form.Label>
                  <Form.Select value={ptOption} onChange={(e) => setPtOption(e.target.value)}>
                    <option value="">Select PT</option>
                    <option value="0">No PT</option>
                    <option value="200">PT 200</option>
                    <option value="300">PT 300</option>
                    <option value="custom">Custom PT</option>
                  </Form.Select>
                </Form.Group>
                {ptOption === 'custom' && (
                  <Form.Group className="mt-2">
                    <Form.Control
                      type="text"
                      name="customPT"
                      value={customPT}
                      onChange={handleChange}
                      placeholder="Enter PT amount"
                    />
                  </Form.Group>
                )}
              </Col>

              {Object.entries(deductions).map(([key, value]) => (
                <Col md={3} key={key}>
                  <Form.Group>
                    <Form.Label>{key.toUpperCase()}</Form.Label>
                    <Form.Control
                      type="text"
                      name={key}
                      value={value}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>

            <h5 className="mt-4">Upload Logo & Signature</h5>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Logo</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e) => handleFileChange(e, setLogo)} />
                  {logo && <img src={logo} alt="Logo" style={{ maxWidth: '150px', marginTop: '10px' }} />}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Signature</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSignature)} />
                  {signature && <img src={signature} alt="Signature" style={{ maxWidth: '150px', marginTop: '10px' }} />}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mt-3">
              <Form.Label>Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Remarks"
              />
            </Form.Group>
          </Form>

          {/* Salary Slip Preview */}
          <div
            ref={slipRef}
            style={{
              border: '1px solid #333',
              padding: '20px',
              marginTop: '20px',
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              backgroundColor: '#fff',
              maxWidth: '700px',
              margin: '20px auto'
            }}
          >
            {/* Header with Logo and Branch */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {logo && <img src={logo} alt="Logo" style={{ maxHeight: '80px' }} />}
              <div style={{ textAlign: 'right' }}>
                <h3>{branch ? branch.charAt(0).toUpperCase() + branch.slice(1) : 'Branch'}</h3>
                <p>{address}</p>
              </div>
            </div>

            <hr />

            {/* Employee & Period Info */}
            <div style={{ marginBottom: '20px' }}>
              <h4>Salary Slip</h4>
              <p>
                <strong>Employee:</strong> {formData.employeeName} {formData.employeeSurname} <br />
                <strong>Employee ID:</strong> {formData.employeeId} <br />
                <strong>Personal ID:</strong> {formData.personalId} <br />
                <strong>UAN Number:</strong> {formData.uanNumber} <br />
                <strong>Designation:</strong> {formData.designation} <br />
                <strong>Period:</strong> {formData.fromDate} to {formData.toDate} <br />
                <strong>Remarks:</strong> {formData.remarks}
              </p>
            </div>

            {/* Earnings Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eee' }}>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Earnings</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(earnings).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                      {Number(value).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>Total Earnings</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                    {totalEarnings.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Deductions Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#eee' }}>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Deductions</th>
                  <th style={{ border: '1px solid #333', padding: '8px' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {/* PT Deduction shown here */}
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>Professional Tax (PT)</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                    {pt.toFixed(2)}
                  </td>
                </tr>
                {Object.entries(deductions).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ border: '1px solid #333', padding: '8px' }}>
                      {key.toUpperCase()}
                    </td>
                    <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                      {Number(value).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>Total Deductions</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>
                    {totalDeductions.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Net Pay */}
            <h4 style={{ textAlign: 'right', marginRight: '10px' }}>
              Net Pay: ₹{net.toFixed(2)}
            </h4>

            {/* Signature */}
            <div style={{ textAlign: 'right', marginTop: '50px' }}>
              {signature && <img src={signature} alt="Signature" style={{ maxHeight: '80px' }} />}
              <p>Authorized Signature</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleDownload}>
            Download PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SalarySlipGenerator;
