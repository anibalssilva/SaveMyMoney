import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { uploadReceipt } from '../services/api';

const OcrUploadPage = () => {
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [showCamera, setShowCamera] = useState(false);

  const webcamRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        setFile(selectedFile);
        setImageSrc(URL.createObjectURL(selectedFile));
        setExtractedTransactions([]);
        setMessage('');
    }
  };

  const capture = useCallback(() => {
    const capturedImageSrc = webcamRef.current.getScreenshot();
    if (capturedImageSrc) {
        setImageSrc(capturedImageSrc);
        // Convert base64 to blob for file upload
        fetch(capturedImageSrc)
        .then(res => res.blob())
        .then(blob => {
            const capturedFile = new File([blob], "webcam-receipt.jpeg", { type: "image/jpeg" });
            setFile(capturedFile);
        });
        setShowCamera(false);
        setExtractedTransactions([]);
        setMessage('');
    }
  }, [webcamRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file or capture a photo.');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    setLoading(true);
    setMessage('');
    setExtractedTransactions([]);

    try {
      const { data } = await uploadReceipt(formData);
      setExtractedTransactions(data);
      setMessage(`${data.length} transaction(s) extracted successfully!`);
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'An error occurred during OCR processing.';
      setMessage(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Upload Receipt for OCR</h2>
      <p>Upload an image of a receipt or use your camera to take a picture.</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setShowCamera(!showCamera)} style={{ marginRight: '1rem' }}>
          {showCamera ? 'Close Camera' : 'Open Camera'}
        </button>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      {showCamera && (
        <div style={{ marginBottom: '1rem' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
          />
          <button onClick={capture}>Capture photo</button>
        </div>
      )}

      {imageSrc && (
        <div style={{ marginBottom: '1rem' }}>
          <h4>Preview:</h4>
          <img src={imageSrc} alt="Receipt preview" style={{ width: '100%', borderRadius: '4px' }} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Processing...' : 'Extract Transactions'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

      {extractedTransactions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4>Extracted Transactions:</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {extractedTransactions.map((t, index) => (
              <li key={index} style={{ background: '#f4f4f4', margin: '0.5rem 0', padding: '0.5rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.description}</span>
                <span>R$ {t.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OcrUploadPage;
