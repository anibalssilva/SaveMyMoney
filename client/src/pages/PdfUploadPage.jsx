import React, { useState } from 'react';
import { uploadPdfStatement } from '../services/api';

const PdfUploadPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [extractedTransactions, setExtractedTransactions] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedTransactions([]);
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a PDF file.');
      return;
    }

    const formData = new FormData();
    formData.append('statement', file);

    setLoading(true);
    setMessage('');
    setExtractedTransactions([]);

    try {
      const { data } = await uploadPdfStatement(formData);
      setExtractedTransactions(data);
      setMessage(`${data.length} transaction(s) extracted successfully!`);
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'An error occurred during PDF processing.';
      setMessage(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Upload Bank Statement (PDF)</h2>
      <p>Select a PDF bank statement to extract transactions.</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
        </div>
        
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Processing...' : 'Extract Transactions'}
        </button>
      </form>

      {file && <p style={{marginTop: '1rem'}}>Selected file: {file.name}</p>}

      {message && <p style={{ marginTop: '1rem', color: message.startsWith('Error') ? 'red' : 'green' }}>{message}</p>}

      {extractedTransactions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4>Extracted Transactions:</h4>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {extractedTransactions.map((t, index) => (
              <li key={index} style={{ background: '#f4f4f4', margin: '0.5rem 0', padding: '0.5rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{new Date(t.date).toLocaleDateString()} - {t.description}</span>
                <span style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PdfUploadPage;
