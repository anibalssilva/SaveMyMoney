import React, { useRef } from 'react';
import './DateInput.css';

/**
 * Componente de Input de Data com formato brasileiro DD/MM/YYYY
 * Mostra o formato brasileiro para o usuário mas mantém YYYY-MM-DD internamente
 */
const DateInput = ({ value, onChange, className = '', placeholder = 'DD/MM/YYYY', ...props }) => {
  const dateInputRef = useRef(null);

  // Converte YYYY-MM-DD para DD/MM/YYYY
  const formatToDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Converte DD/MM/YYYY para YYYY-MM-DD
  const formatToISO = (brDate) => {
    if (!brDate) return '';
    const cleaned = brDate.replace(/\D/g, '');
    if (cleaned.length !== 8) return '';
    const day = cleaned.slice(0, 2);
    const month = cleaned.slice(2, 4);
    const year = cleaned.slice(4, 8);
    return `${year}-${month}-${day}`;
  };

  // Valida data brasileira
  const isValidDate = (dateStr) => {
    const cleaned = dateStr.replace(/\D/g, '');
    if (cleaned.length !== 8) return false;

    const day = parseInt(cleaned.slice(0, 2));
    const month = parseInt(cleaned.slice(2, 4));
    const year = parseInt(cleaned.slice(4, 8));

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;

    // Verifica se a data é válida
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
  };

  // Aplica máscara DD/MM/YYYY durante digitação
  const handleTextChange = (e) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove não-dígitos

    // Limita a 8 dígitos
    if (input.length > 8) {
      input = input.slice(0, 8);
    }

    // Aplica máscara
    let formatted = '';
    if (input.length > 0) {
      formatted = input.slice(0, 2);
      if (input.length >= 3) {
        formatted += '/' + input.slice(2, 4);
      }
      if (input.length >= 5) {
        formatted += '/' + input.slice(4, 8);
      }
    }

    e.target.value = formatted;

    // Se a data estiver completa e válida, converte para ISO e notifica onChange
    if (input.length === 8 && isValidDate(formatted)) {
      const isoDate = formatToISO(formatted);
      onChange({ target: { value: isoDate } });
    } else if (!formatted) {
      // Se limpar o campo, notifica onChange com string vazia
      onChange({ target: { value: '' } });
    }
  };

  // Handler para quando o calendário nativo é usado
  const handleDatePickerChange = (e) => {
    onChange(e);
  };

  // Abre o calendário nativo ao clicar no ícone
  const openDatePicker = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="date-input-wrapper">
      {/* Input visual com formato brasileiro */}
      <input
        type="text"
        className={`date-input-text ${className}`}
        defaultValue={formatToDisplay(value)}
        onChange={handleTextChange}
        placeholder={placeholder}
        maxLength="10"
        {...props}
      />

      {/* Input date oculto para calendário nativo */}
      <input
        ref={dateInputRef}
        type="date"
        className="date-input-picker"
        value={value || ''}
        onChange={handleDatePickerChange}
        tabIndex={-1}
      />

      {/* Ícone de calendário */}
      <button
        type="button"
        className="date-input-calendar-icon"
        onClick={openDatePicker}
        tabIndex={-1}
        aria-label="Abrir calendário"
      >
        📅
      </button>
    </div>
  );
};

export default DateInput;
