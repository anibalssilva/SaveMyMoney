import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { uploadReceipt, saveOcrTransactions } from '../services/api';
import api from '../services/api';
import './OcrUploadPage.css';

const OcrUploadPage = () => {
  const formatCap = (s) => (typeof s === 'string' && s.length > 0)
    ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    : s;
  const [file, setFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [extractedTransactions, setExtractedTransactions] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Track selected items
  const [extractedMetadata, setExtractedMetadata] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [categories, setCategories] = useState([]); // All available categories
  const [selectedCategory, setSelectedCategory] = useState(null); // Selected category for all items
  const [subcategories, setSubcategories] = useState([]); // Subcategories for selected category
  const [editingItem, setEditingItem] = useState(null); // Index of item being edited

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔍 Fetching categories from API...');
        const response = await api.get('/transactions/categories');
        console.log('✅ Categories API response:', response.data);
        console.log('✅ Is array?', Array.isArray(response.data));
        console.log('✅ Length:', response.data?.length);
        // Ensure it's always an array
        const categoriesData = Array.isArray(response.data) ? response.data : [];
        setCategories(categoriesData);
        console.log('✅ Categories state set to:', categoriesData);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setCategories([]); // Fallback to empty array on error
      }
    };
    fetchCategories();
  }, []);

  // Update item in the list
  const updateItem = (index, field, value) => {
    setExtractedTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove item from list
  const removeItem = (index) => {
    setExtractedTransactions(prev => prev.filter((_, i) => i !== index));
    setSelectedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  // Apply category to all items
  const applyCategoryToAll = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setExtractedTransactions(prev => prev.map(item => ({
        ...item,
        category: category.name,
        categoryId: category.id
      })));
      setSelectedCategory(category);

      // Load subcategories for this category
      await loadSubcategories(categoryId);
    }
  };

  // Load subcategories for a category
  const loadSubcategories = async (categoryId) => {
    try {
      console.log(`🔍 Loading subcategories for: ${categoryId}`);
      const response = await api.get(`/transactions/subcategories/${categoryId}`);
      console.log('✅ Subcategories loaded:', response.data);
      setSubcategories(response.data);
    } catch (error) {
      console.error('❌ Error loading subcategories:', error);
      setSubcategories([{ id: 'outros', name: 'Outros', emoji: '💡' }]);
    }
  };

  // Update subcategory for a specific item
  const updateSubcategory = (index, subcategoryId) => {
    const subcategory = subcategories.find(s => s.id === subcategoryId);
    if (subcategory) {
      setExtractedTransactions(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          subcategory: subcategory.name,
          subcategoryId: subcategory.id,
          subcategoryEmoji: subcategory.emoji,
          subcategoryAutoDetected: false // Manual selection
        };
        return updated;
      });
    }
  };

  // Add new item manually
  const addManualItem = () => {
    const newItem = {
      description: '',
      amount: 0,
      category: selectedCategory?.name || 'Outras eventuais',
      categoryId: selectedCategory?.id || 'outras',
      subcategory: 'Outros',
      subcategoryId: 'outros',
      subcategoryEmoji: '💡',
      subcategoryAutoDetected: false,
      type: 'expense',
      isManual: true // Flag to identify manual items
    };

    setExtractedTransactions(prev => [...prev, newItem]);
    setEditingItem(extractedTransactions.length); // Start editing the new item
    setSelectedItems(prev => [...prev, extractedTransactions.length]); // Auto-select new item
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImageSrc(URL.createObjectURL(selectedFile));
      setExtractedTransactions([]);
      setSelectedItems([]);
      setExtractedMetadata(null);
      setIsSaved(false);
      setMessage('');
    }
  };

  const capture = useCallback(() => {
    const capturedImageSrc = webcamRef.current.getScreenshot();
    if (capturedImageSrc) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrast = 1.5;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const enhanced = factor * (gray - 128) + 128;
          const value = Math.max(0, Math.min(255, enhanced));
          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);
        ctx.filter = 'contrast(1.2) brightness(1.1) saturate(0)';
        ctx.drawImage(canvas, 0, 0);

        canvas.toBlob((blob) => {
          const correctedImageSrc = URL.createObjectURL(blob);
          setImageSrc(correctedImageSrc);
          const capturedFile = new File([blob], "webcam-receipt.jpeg", { type: "image/jpeg" });
          setFile(capturedFile);
        }, 'image/jpeg', 0.98);
      };
      img.src = capturedImageSrc;

      setShowCamera(false);
      setExtractedTransactions([]);
      setSelectedItems([]);
      setExtractedMetadata(null);
      setIsSaved(false);
      setMessage('');
    }
  }, [webcamRef]);

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  // NEW: Toggle item selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // NEW: Select/Deselect all items
  const toggleSelectAll = () => {
    if (selectedItems.length === extractedTransactions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(extractedTransactions.map((_, index) => index));
    }
  };

  const handleSaveToDatabase = async () => {
    if (selectedItems.length === 0) {
      setMessage('❌ Selecione pelo menos um item para salvar.');
      return;
    }

    if (isSaved) {
      setMessage('ℹ️ Estes dados já foram salvos no banco de dados.');
      return;
    }

    setSaving(true);
    setMessage('💾 Salvando no banco de dados...');

    try {
      // Only save selected items
      const itemsToSave = selectedItems.map(index => extractedTransactions[index]);

      const { data } = await saveOcrTransactions({
        items: itemsToSave,
        metadata: extractedMetadata
      });

      setIsSaved(true);
      setMessage(`✅ ${data.message || 'Transações salvas com sucesso!'}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'Erro ao salvar no banco de dados.';
      setMessage(`❌ Erro: ${errMsg}`);
    } finally {
      setSaving(false);
    }
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
    setSelectedItems([]);
    setExtractedMetadata(null);

    try {
      const { data } = await uploadReceipt(formData);
      console.log('OCR Response:', data); // Debug log

      const items = data.items || [];
      const metadata = data.metadata || {};

      setExtractedTransactions(items);
      // Auto-select all items by default
      setSelectedItems(items.map((_, index) => index));
      setExtractedMetadata(metadata);
      setIsSaved(false);

      // Set auto-detected category or default
      if (metadata && metadata.autoCategory) {
        console.log('Auto-detected category:', metadata.autoCategory);
        setSelectedCategory(metadata.autoCategory);
        // Load subcategories for auto-detected category
        if (metadata.autoCategory.id) {
          loadSubcategories(metadata.autoCategory.id);
        }
      } else if (categories.length > 0) {
        // Default to "Outras eventuais" if no category detected
        console.log('Using default category');
        const defaultCategory = categories.find(c => c.id === 'outras') || categories[categories.length - 1];
        setSelectedCategory(defaultCategory);
        if (defaultCategory.id) {
          loadSubcategories(defaultCategory.id);
        }
      } else {
        console.warn('No categories loaded yet');
      }

      let successMsg = `✅ ${items.length} item(ns) extraído(s) com sucesso! Revise e selecione os itens que deseja salvar.`;
      if (metadata) {
        const methodNames = {
          'openai-vision': '🤖 IA Vision',
          'tesseract+parser': '📝 OCR+Parser',
          'hybrid': '🔄 Híbrido'
        };
        successMsg += ` | Método: ${methodNames[metadata.method] || metadata.method}`;
      }

      setMessage(successMsg);
      setImageSrc(null);
      setFile(null);

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'Ocorreu um erro durante o processamento do OCR.';
      const suggestions = error.response?.data?.suggestions || [];

      let fullMsg = `❌ Erro: ${errMsg}`;
      if (suggestions.length > 0) {
        fullMsg += '\n\n' + suggestions.join('\n');
      }

      setMessage(fullMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-page-container">
      {/* Header */}
      <div className="ocr-header">
        <h1 className="ocr-title">📸 Scanner de Cupom Fiscal</h1>
        <p className="ocr-subtitle">
          Tire uma foto ou faça upload do cupom. Nosso sistema extrai automaticamente todos os dados.
        </p>
      </div>

      {/* Camera Tips */}
      {showCamera && (
        <div className="camera-tips">
          <h4>💡 Dicas para melhor captura</h4>
          <ul>
            <li>Use boa iluminação (natural é melhor)</li>
            <li>Mantenha o cupom reto e plano</li>
            <li>Enquadre apenas a área dos produtos e valores</li>
            <li>Evite sombras sobre o texto</li>
            <li>Aguarde o foco automático ajustar</li>
          </ul>
        </div>
      )}

      {/* Upload Controls */}
      <div className="upload-controls">
        <button
          onClick={() => setShowCamera(!showCamera)}
          className="ocr-btn ocr-btn-camera"
        >
          {showCamera ? '❌ Fechar Câmera' : '📷 Abrir Câmera'}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="ocr-btn ocr-btn-file"
        >
          📁 Escolher Arquivo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </button>
      </div>

      {/* Webcam */}
      {showCamera && (
        <div className="webcam-container">
          <div className="webcam-wrapper">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{
                facingMode: facingMode,
                width: { min: 1920, ideal: 3840, max: 4096 },
                height: { min: 1080, ideal: 2160, max: 2160 },
                aspectRatio: { ideal: 16/9 },
                advanced: [
                  { focusMode: 'continuous' },
                  { exposureMode: 'continuous' },
                  { whiteBalanceMode: 'continuous' }
                ]
              }}
              screenshotQuality={1}
              style={{
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
          </div>
          <div className="webcam-controls">
            <button onClick={capture} className="ocr-btn ocr-btn-camera">
              📸 Capturar Foto
            </button>
            <button onClick={switchCamera} className="ocr-btn ocr-btn-file">
              🔄 Trocar Câmera
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {imageSrc && (
        <div className="preview-container">
          <div className="preview-header">
            📋 Preview do Cupom
          </div>
          <img src={imageSrc} alt="Receipt preview" className="preview-image" />
        </div>
      )}

      {/* Extract Button */}
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={loading || !file}
          className="extract-button"
        >
          {loading ? (
            <span className="extract-button-loading">
              <span className="extract-spinner"></span>
              Processando...
            </span>
          ) : (
            <>🔍 Extrair Itens do Cupom</>
          )}
        </button>
      </form>

      {/* Message */}
      {message && (
        <div className={`message-alert ${message.includes('❌') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Results */}
      {extractedTransactions.length > 0 && (
        <div className="results-container">
          {console.log('🔍 RENDER DEBUG:')}
          {console.log('  extractedTransactions.length:', extractedTransactions.length)}
          {console.log('  categories.length:', categories.length)}
          {console.log('  selectedCategory:', selectedCategory)}
          {console.log('  extractedMetadata:', extractedMetadata)}

          {/* Metadata */}
          {extractedMetadata && (
            <div className="metadata-card">
              <h4 className="metadata-header">📄 Informações do Cupom Fiscal</h4>
              <div className="metadata-grid">
                {(extractedMetadata.establishmentName || extractedMetadata.establishment) && (
                  <div className="metadata-item">
                    <div className="metadata-label">🏪 Estabelecimento</div>
                    <div className="metadata-value">{extractedMetadata.establishmentName || extractedMetadata.establishment}</div>
                  </div>
                )}

                {extractedMetadata.cnpj && (
                  <div className="metadata-item">
                    <div className="metadata-label">🔢 CNPJ</div>
                    <div className="metadata-value">{extractedMetadata.cnpj}</div>
                  </div>
                )}

                {extractedMetadata.date && (
                  <div className="metadata-item">
                    <div className="metadata-label">📅 Data</div>
                    <div className="metadata-value">{extractedMetadata.date}</div>
                  </div>
                )}

                {extractedMetadata.total !== undefined && (
                  <div className="metadata-item metadata-item-total">
                    <div className="metadata-label">💰 Total</div>
                    <div className="metadata-value">R$ {extractedMetadata.total.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Selector - ALWAYS SHOW if categories loaded */}
          {categories.length > 0 && (
            <div className="category-card">
              <h4 className="category-header">📂 Categoria da Despesa</h4>
              <div className="category-selector-wrapper">
                {selectedCategory && (
                  <div className="auto-category-badge">
                    <span className="auto-category-label">
                      {selectedCategory.id === 'outras' ? 'Categoria padrão:' : 'Auto-detectado:'}
                    </span>
                    <span className="auto-category-value">
                      {selectedCategory.emoji} {formatCap(selectedCategory.name)}
                    </span>
                    {extractedMetadata?.establishmentName && selectedCategory.id !== 'outras' && (
                      <span className="establishment-name">
                        (baseado em: {extractedMetadata.establishmentName})
                      </span>
                    )}
                  </div>
                )}
                <div className="category-selector">
                  <label htmlFor="category-dropdown" className="category-label">
                    Alterar categoria manualmente:
                  </label>
                  <select
                    id="category-dropdown"
                    value={selectedCategory?.id || 'outras'}
                    onChange={(e) => applyCategoryToAll(e.target.value)}
                    className="category-dropdown"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {formatCap(cat.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="items-card">
            <div className="items-card-header">
              <h4 className="items-header">
                ✅ Itens Extraídos ({extractedTransactions.length})
              </h4>
              <button
                onClick={toggleSelectAll}
                className="select-all-btn"
                type="button"
              >
                {selectedItems.length === extractedTransactions.length ? '❌ Desmarcar Todos' : '✅ Selecionar Todos'}
              </button>
            </div>

            <p className="items-info">
              ℹ️ Selecione os itens que deseja salvar. Clique em ✏️ para editar ou 🗑️ para remover ({selectedItems.length} selecionado{selectedItems.length !== 1 ? 's' : ''})
            </p>

            <ul className="items-list">
              {extractedTransactions.map((t, index) => (
                <li
                  key={index}
                  className={`item-row ${selectedItems.includes(index) ? 'item-row-selected' : ''} ${editingItem === index ? 'item-row-editing' : ''}`}
                >
                  <div className="item-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(index)}
                      onChange={() => toggleItemSelection(index)}
                      className="item-checkbox"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {editingItem === index ? (
                    // Edit mode
                    <div className="item-edit-mode">
                      <input
                        type="text"
                        value={t.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="item-edit-input item-edit-description"
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Descrição do item"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={t.amount}
                        onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="item-edit-input item-edit-amount"
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                      />
                      {subcategories.length > 0 && (
                        <select
                          value={t.subcategoryId || 'outros'}
                          onChange={(e) => updateSubcategory(index, e.target.value)}
                          className="item-edit-input item-edit-subcategory"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {subcategories.map(subcat => (
                            <option key={subcat.id} value={subcat.id}>
                              {subcat.emoji} {formatCap(subcat.name)}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(null);
                        }}
                        className="item-action-btn item-save-btn"
                        title="Salvar alterações"
                      >
                        ✅
                      </button>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="item-content-wrapper">
                        <div className="item-content" onClick={() => toggleItemSelection(index)}>
                          <span className="item-description">{t.description}</span>
                          <span className="item-amount">R$ {t.amount.toFixed(2)}</span>
                        </div>
                        {subcategories.length > 0 && (
                          <div className="item-subcategory-row">
                            {t.subcategoryAutoDetected && (
                              <span className="subcategory-auto-badge">Auto:</span>
                            )}
                            <select
                              value={t.subcategoryId || 'outros'}
                              onChange={(e) => updateSubcategory(index, e.target.value)}
                              className="item-subcategory-dropdown"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {subcategories.map(subcat => (
                                <option key={subcat.id} value={subcat.id}>
                                  {subcat.emoji} {formatCap(subcat.name)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem(index);
                          }}
                          className="item-action-btn item-edit-btn"
                          title="Editar item"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Tem certeza que deseja remover este item?')) {
                              removeItem(index);
                            }
                          }}
                          className="item-action-btn item-delete-btn"
                          title="Remover item"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* Add Missing Item Button */}
            <button
              onClick={addManualItem}
              type="button"
              className="add-item-btn"
            >
              ➕ Adicionar Item Faltante
            </button>

            <div className="total-summary">
              <div>
                <span className="total-label">Total Selecionado:</span>
                <span className="total-items-count">
                  ({selectedItems.length} de {extractedTransactions.length} itens)
                </span>
              </div>
              <span className="total-value">
                R$ {selectedItems.reduce((sum, index) => sum + extractedTransactions[index].amount, 0).toFixed(2)}
              </span>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveToDatabase}
              disabled={saving || isSaved || selectedItems.length === 0}
              className={`save-button ${isSaved ? 'save-button-saved' : saving ? 'save-button-saving' : selectedItems.length === 0 ? 'save-button-disabled' : 'save-button-active'}`}
            >
              {isSaved
                ? '✅ Salvo no Banco de Dados'
                : saving
                  ? '💾 Salvando...'
                  : selectedItems.length === 0
                    ? '⚠️ Selecione itens para salvar'
                    : `💾 Salvar ${selectedItems.length} Item(ns) no MongoDB`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OcrUploadPage;
