/**
 * Utilitários para manipulação de datas no formato brasileiro (DD/MM/AAAA)
 */

/**
 * Converte data do formato YYYY-MM-DD para DD/MM/YYYY
 * @param {string} isoDate - Data no formato YYYY-MM-DD
 * @returns {string} Data no formato DD/MM/YYYY
 */
export const isoToBrazilian = (isoDate) => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converte data do formato DD/MM/YYYY para YYYY-MM-DD
 * @param {string} brDate - Data no formato DD/MM/YYYY
 * @returns {string} Data no formato YYYY-MM-DD
 */
export const brazilianToISO = (brDate) => {
  if (!brDate) return '';
  const [day, month, year] = brDate.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Formata Date object para DD/MM/YYYY
 * @param {Date} date - Objeto Date
 * @returns {string} Data no formato DD/MM/YYYY
 */
export const formatDateBR = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Valida se uma string está no formato DD/MM/YYYY
 * @param {string} dateStr - String de data
 * @returns {boolean} true se válida
 */
export const isValidBRDate = (dateStr) => {
  if (!dateStr) return false;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);

  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() === parseInt(month) - 1 &&
    date.getDate() === parseInt(day)
  );
};

/**
 * Converte Date ou string ISO para formato YYYY-MM-DD (para comparações)
 * @param {Date|string} date - Data
 * @returns {string} Data no formato YYYY-MM-DD
 */
export const toISODateString = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Obtém a data atual no formato DD/MM/YYYY
 * @returns {string} Data atual em formato DD/MM/YYYY
 */
export const getTodayBR = () => {
  return formatDateBR(new Date());
};

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns {string} Data atual em formato YYYY-MM-DD
 */
export const getTodayISO = () => {
  return toISODateString(new Date());
};
