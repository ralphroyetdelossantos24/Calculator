const displayEl = document.getElementById('display');
const historyEl = document.getElementById('history');

const buttonsEl = document.querySelector('.buttons');


let inputBuffer = '';
let justEvaluated = false;

function resetCalculator() {
  inputBuffer = '';
  setDisplay('0');
  setHistory('');
  justEvaluated = false;
}


function setDisplay(value) {
  displayEl.textContent = value;
}

function setHistory(value) {
  historyEl.textContent = value;
}

function formatNumber(num) {
  if (!Number.isFinite(num)) return 'Error';

  // Avoid long floating tails
  const abs = Math.abs(num);
  if (abs !== 0 && (abs >= 1e10 || abs < 1e-9)) {
    return num.toExponential(8).replace(/(?:\.0+|0+)e/, 'e');
  }

  const rounded = Math.round((num + Number.EPSILON) * 1e12) / 1e12;
  let s = String(rounded);

  // Strip trailing zeros only after decimal point
  if (s.includes('.')) {
    s = s.replace(/(\.\d*?[1-9])0+$/, '$1');
    s = s.replace(/\.0+$/, '');
  }
  return s;
}


function inputNumber(token) {
  if (justEvaluated) {
    inputBuffer = '';
    justEvaluated = false;
  }
  inputBuffer += token;
  setDisplay(inputBuffer);
}

function compute(a, op, b) {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
      return a * b;
    case '/':
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}


function setOperator(nextOp) {
  if (justEvaluated) {
    inputBuffer = '';
    justEvaluated = false;
  }
  inputBuffer += nextOp;
  setDisplay(inputBuffer);
}

function opToSymbol(op) {
  if (op === '*') return '×';
  if (op === '/') return '÷';
  return op;
}

function clearAll() {
  current = '0';
  previous = null;
  operator = null;
  justEvaluated = false;
  setHistory('');
  setDisplay('0');
}

function backspace() {
  if (justEvaluated) {
    // After result, backspace acts like clear current
    current = '0';
    justEvaluated = false;
    setDisplay(current);
    return;
  }

  if (current.length <= 1) {
    current = '0';
  } else {
    current = current.slice(0, -1);
    if (current === '-' || current === '') current = '0';
  }
}

function percent() {
  const cur = Number(current);
  if (!Number.isFinite(cur)) {
    current = 'Error';
    return;
  }

  // Android-style-ish:
  // If we're doing A + B% or A - B%, treat B% as A*(B/100).
  // Otherwise convert current to current/100.
  if (previous !== null && (operator === '+' || operator === '-')) {
    current = formatNumber(previous * (cur / 100));
  } else {
    current = formatNumber(cur / 100);
  }
}


function evaluate() {
  if (!inputBuffer) {
    setDisplay('0');
    return;
  }
  try {
    // Only allow numbers, operators, and decimal points
    if (!/^[-+*/.0-9 ]+$/.test(inputBuffer)) throw new Error('Invalid input');
    // Disallow invalid sequences (e.g., leading/trailing operator, .., etc.)
    // eslint-disable-next-line no-eval
    let result = eval(inputBuffer);
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      setDisplay(result);
      setHistory(inputBuffer);
      inputBuffer = String(result);
    } else {
      setDisplay('Error');
      setHistory('Invalid expression');
      inputBuffer = '';
    }
  } catch (e) {
    setDisplay('Error');
    setHistory('Invalid expression');
    inputBuffer = '';
  }
  justEvaluated = true;
}


buttonsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const number = btn.getAttribute('data-number');
  const op = btn.getAttribute('data-operator');
  const action = btn.getAttribute('data-action');

  if (number !== null) {
    inputNumber(number);
    return;
  }

  if (op) {
    setOperator(op);
    return;
  }

  if (action === 'clear') {
    resetCalculator();
    return;
  }

  if (action === 'delete') {
    inputBuffer = inputBuffer.slice(0, -1);
    setDisplay(inputBuffer || '0');
    return;
  }

  if (action === 'percent') {
    // Not supported in this mode
    setDisplay('Error');
    setHistory('Percent not supported');
    inputBuffer = '';
    justEvaluated = true;
    return;
  }

  if (action === 'calculate') {
    evaluate();
  }
});

// Keyboard support (minimal)

document.addEventListener('keydown', (e) => {
  const k = e.key;
  if ((k >= '0' && k <= '9') || k === '.' || k === '+' || k === '-' || k === '*' || k === '/') {
    if (justEvaluated) {
      inputBuffer = '';
      justEvaluated = false;
    }
    inputBuffer += k;
    setDisplay(inputBuffer);
    e.preventDefault();
    return;
  }
  if (k === 'Enter' || k === '=') {
    evaluate();
    e.preventDefault();
    return;
  }
  if (k === 'Backspace') {
    inputBuffer = inputBuffer.slice(0, -1);
    setDisplay(inputBuffer || '0');
    e.preventDefault();
    return;
  }
  if (k === 'Escape') {
    resetCalculator();
    return;
  }
});


// Theme changer logic
const themeChanger = document.getElementById('theme-changer');
function setTheme(theme) {
  document.body.classList.remove('theme-light', 'theme-color');
  if (theme === 'light') {
    document.body.classList.add('theme-light');
  } else if (theme === 'color') {
    document.body.classList.add('theme-color');
  }
  localStorage.setItem('calc-theme', theme);
}

if (themeChanger) {
  // Load saved theme
  const savedTheme = localStorage.getItem('calc-theme') || 'dark';
  themeChanger.value = savedTheme;
  setTheme(savedTheme);
  themeChanger.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });
}


// Init
resetCalculator();
