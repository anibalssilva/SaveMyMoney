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
  const [facingMode, setFacingMode] = useState('environment'); // 'user' = frontal, 'environment' = traseira

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
        // Corrigir orientação da imagem
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Definir dimensões do canvas
            canvas.width = img.width;
            canvas.height = img.height;

            // Desenhar imagem corrigida
            ctx.drawImage(img, 0, 0);

            // Converter para blob
            canvas.toBlob((blob) => {
                const correctedImageSrc = URL.createObjectURL(blob);
                setImageSrc(correctedImageSrc);

                const capturedFile = new File([blob], "webcam-receipt.jpeg", { type: "image/jpeg" });
                setFile(capturedFile);
            }, 'image/jpeg', 0.95);
        };
        img.src = capturedImageSrc;

        setShowCamera(false);
        setExtractedTransactions([]);
        setMessage('');
    }
  }, [webcamRef]);

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Por favor, selecione um arquivo ou tire uma foto.');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', file);

    setLoading(true);
    setMessage('Processando cupom fiscal...');
    setExtractedTransactions([]);

    try {
      const { data } = await uploadReceipt(formData);
      setExtractedTransactions(data);
      setMessage(`✅ ${data.length} item(ns) extraído(s) com sucesso!`);

      // Limpar imagem e arquivo após extração bem-sucedida
      setImageSrc(null);
      setFile(null);

      // Scroll para ver os resultados
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'Ocorreu um erro durante o processamento do OCR.';
      setMessage(`❌ Erro: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>📸 Scanner de Cupom Fiscal</h2>
      <p>Tire uma foto do cupom fiscal ou faça upload de uma imagem. Os itens serão extraídos automaticamente.</p>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setShowCamera(!showCamera)} style={{ marginRight: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          {showCamera ? '❌ Fechar Câmera' : '📷 Abrir Câmera'}
        </button>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" />
        <label htmlFor="file-upload" style={{ padding: '0.5rem 1rem', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', display: 'inline-block' }}>
          📁 Escolher Arquivo
        </label>
      </div>

      {showCamera && (
        <div style={{ marginBottom: '1rem' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%"
            videoConstraints={{
              facingMode: facingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              aspectRatio: { ideal: 16/9 }
            }}
            screenshotQuality={1}
            style={{
              transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
            }}
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <button onClick={capture} style={{ flex: 1 }}>📸 Capturar Foto</button>
            <button onClick={switchCamera} style={{ flex: 1 }}>🔄 Trocar Câmera</button>
          </div>
        </div>
      )}

      {imageSrc && (
        <div style={{ marginBottom: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
          <h4>📋 Preview do Cupom:</h4>
          <img src={imageSrc} alt="Receipt preview" style={{ width: '100%', borderRadius: '4px', border: '2px solid #ddd' }} />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={loading || !file}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            cursor: loading || !file ? 'not-allowed' : 'pointer',
            background: loading || !file ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Processando...' : '🔍 Extrair Itens do Cupom'}
        </button>
      </form>

      {message && (
        <p style={{
          marginTop: '1rem',
          padding: '0.75rem',
          borderRadius: '4px',
          background: message.includes('❌') ? '#ffebee' : '#e8f5e9',
          color: message.includes('❌') ? '#c62828' : '#2e7d32',
          fontWeight: 'bold'
        }}>
          {message}
        </p>
      )}

      {extractedTransactions.length > 0 && (
        <div style={{ marginTop: '2rem', background: '#f0f7ff', padding: '1rem', borderRadius: '8px' }}>
          <h4>✅ Itens Extraídos ({extractedTransactions.length}):</h4>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            ℹ️ A imagem foi removida. Revise os itens abaixo:
          </p>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {extractedTransactions.map((t, index) => (
              <li key={index} style={{
                background: 'white',
                margin: '0.5rem 0',
                padding: '0.75rem',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontWeight: '500' }}>{t.description}</span>
                <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>R$ {t.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OcrUploadPage;
