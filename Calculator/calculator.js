/**
 * 80年代街機風格計算機
 * 遵循 SOLID 原則的模組化設計
 */

(function() {
'use strict';

// ============ 計算引擎 (單一職責) ============

/**
 * @typedef {Object} CalculatorState
 * @property {string} display - 顯示的數值
 * @property {string} previousValue - 前一個數值
 * @property {string|null} operator - 當前運算符
 * @property {boolean} waitingForOperand - 是否等待新操作數
 * @property {number} calculationCount - 計算次數
 */

/**
 * 建立計算引擎
 * @returns {Object} 計算引擎介面
 */
function createCalculatorEngine() {
  /** @type {CalculatorState} */
  let state = {
    display: '0',
    previousValue: '',
    operator: null,
    waitingForOperand: false,
    calculationCount: 0
  };

  return {
    getState() {
      return { ...state };
    },

    inputDigit(digit) {
      if (state.waitingForOperand) {
        state.display = String(digit);
        state.waitingForOperand = false;
      } else {
        state.display = state.display === '0' ? String(digit) : state.display + digit;
      }
    },

    inputDecimal() {
      if (state.waitingForOperand) {
        state.display = '0.';
        state.waitingForOperand = false;
      } else if (state.display.indexOf('.') === -1) {
        state.display += '.';
      }
    },

    clear() {
      state.display = '0';
      state.previousValue = '';
      state.operator = null;
      state.waitingForOperand = false;
    },

    delete() {
      if (state.display.length > 1) {
        state.display = state.display.slice(0, -1);
      } else {
        state.display = '0';
      }
    },

    performOperation(nextOperator) {
      const inputValue = parseFloat(state.display);

      if (state.previousValue === '') {
        state.previousValue = inputValue;
      } else if (state.operator) {
        const currentValue = state.previousValue || 0;
        const newValue = this.calculate(currentValue, inputValue, state.operator);

        state.display = String(newValue);
        state.previousValue = newValue;
        state.calculationCount++;
      }

      state.waitingForOperand = true;
      state.operator = nextOperator;
    },

    calculate(firstOperand, secondOperand, operator) {
      switch (operator) {
        case '+':
          return firstOperand + secondOperand;
        case '-':
          return firstOperand - secondOperand;
        case '*':
          return firstOperand * secondOperand;
        case '/':
          return secondOperand !== 0 ? firstOperand / secondOperand : 0;
        case '%':
          return firstOperand * (secondOperand / 100);
        default:
          return secondOperand;
      }
    },

    getCalculationCount() {
      return state.calculationCount;
    }
  };
}

// ============ 顯示管理器 (單一職責) ============

/**
 * 建立顯示管理器
 * @param {HTMLElement} displayElement - 顯示元素
 * @param {HTMLElement} scoreElement - 分數元素
 * @returns {Object} 顯示管理器介面
 */
function createDisplayManager(displayElement, scoreElement) {
  if (!displayElement || !scoreElement) {
    throw new Error('Display elements are required');
  }

  return {
    updateDisplay(value) {
      const displayValue = parseFloat(value);
      const formattedValue = Number.isFinite(displayValue)
        ? (Math.abs(displayValue) > 999999999 
            ? displayValue.toExponential(2) 
            : displayValue.toString())
        : value;
      
      displayElement.textContent = formattedValue;
      this.playDisplayEffect();
    },

    updateScore(count) {
      scoreElement.textContent = String(count).padStart(3, '0');
    },

    playDisplayEffect() {
      displayElement.style.textShadow = '0 0 20px var(--neon-green), 0 0 30px var(--neon-green)';
      setTimeout(() => {
        displayElement.style.textShadow = '0 0 10px var(--neon-green), 0 0 20px var(--neon-green)';
      }, 100);
    },

    showError(message) {
      const originalColor = displayElement.style.color;
      displayElement.style.color = 'var(--neon-pink)';
      displayElement.textContent = message;
      
      setTimeout(() => {
        displayElement.style.color = originalColor;
        displayElement.textContent = '0';
      }, 2000);
    }
  };
}

// ============ 音效管理器 (單一職責) ============

/**
 * 建立音效管理器 (使用 Web Audio API)
 * @returns {Object} 音效管理器介面
 */
function createSoundManager() {
  let audioContext = null;
  let isEnabled = true;
  let lastPlayTime = 0;
  const MIN_INTERVAL = 20; // 最小播放間隔（毫秒）
  let activeOscillators = new Set(); // 追蹤活躍的振盪器
  const MAX_CONCURRENT_SOUNDS = 5; // 最大同時音效數

  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  return {
    playBeep(frequency = 440, duration = 50) {
      if (!isEnabled) return;

      // Throttling: 防止過於頻繁的音效播放
      const now = Date.now();
      if (now - lastPlayTime < MIN_INTERVAL) {
        return;
      }
      lastPlayTime = now;

      // 限制同時播放的音效數量
      if (activeOscillators.size >= MAX_CONCURRENT_SOUNDS) {
        return;
      }

      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'square'; // 復古音效

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        // 追蹤振盪器
        activeOscillators.add(oscillator);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration / 1000);

        // 清理已停止的振盪器
        oscillator.onended = () => {
          activeOscillators.delete(oscillator);
        };
      } catch (error) {
        console.warn('Sound playback failed:', error);
      }
    },

    playButtonPress() {
      this.playBeep(800, 30);
    },

    playOperation() {
      this.playBeep(600, 40);
    },

    playEquals() {
      this.playBeep(900, 80);
    },

    playError() {
      this.playBeep(200, 150);
    },

    toggle() {
      isEnabled = !isEnabled;
      return isEnabled;
    },

    isEnabled() {
      return isEnabled;
    },

    cleanup() {
      // 清理所有活躍的振盪器
      activeOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // 忽略已經停止的振盪器
        }
      });
      activeOscillators.clear();
      
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
    }
  };
}

// ============ 按鈕處理器 (單一職責) ============

/**
 * 建立按鈕處理器
 * @param {Object} engine - 計算引擎
 * @param {Object} display - 顯示管理器
 * @param {Object} sound - 音效管理器
 * @returns {Object} 按鈕處理器介面
 */
function createButtonHandler(engine, display, sound) {
  if (!engine || !display || !sound) {
    throw new Error('All dependencies are required');
  }

  const operatorMap = {
    'add': '+',
    'subtract': '-',
    'multiply': '*',
    'divide': '/'
  };

  return {
    handleNumber(value) {
      sound.playButtonPress();
      if (value === '.') {
        engine.inputDecimal();
      } else {
        engine.inputDigit(value);
      }
      display.updateDisplay(engine.getState().display);
    },

    handleOperator(action) {
      sound.playOperation();
      const operator = operatorMap[action];
      if (operator) {
        engine.performOperation(operator);
        display.updateDisplay(engine.getState().display);
      }
    },

    handleEquals() {
      sound.playEquals();
      engine.performOperation('=');
      const state = engine.getState();
      display.updateDisplay(state.display);
      display.updateScore(state.calculationCount);
    },

    handleClear() {
      sound.playButtonPress();
      engine.clear();
      display.updateDisplay('0');
    },

    handleDelete() {
      sound.playButtonPress();
      engine.delete();
      display.updateDisplay(engine.getState().display);
    },

    handlePercent() {
      sound.playOperation();
      engine.performOperation('%');
      display.updateDisplay(engine.getState().display);
    }
  };
}

// ============ 輸入對話框管理器 (單一職責) ============

/**
 * 建立輸入對話框管理器
 * @param {Object} sound - 音效管理器
 * @returns {Object} 對話框管理器介面
 */
function createInputDialogManager(sound) {
  return {
    /**
     * 顯示輸入對話框
     * @param {string} title - 對話框標題
     * @param {Array} fields - 輸入欄位配置 [{label, placeholder, type}]
     * @returns {Promise<Array|null>} 輸入值陣列，或取消時返回 null
     */
    async show(title, fields) {
      sound.playOperation();
      
      return new Promise((resolve) => {
        // 建立遮罩層
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        
        // 建立對話框
        const dialog = document.createElement('div');
        dialog.className = 'input-dialog';
        
        // 標題
        const titleEl = document.createElement('div');
        titleEl.className = 'dialog-title';
        titleEl.textContent = title;
        dialog.appendChild(titleEl);
        
        // 輸入欄位容器
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'dialog-inputs';
        
        const inputs = fields.map((field, index) => {
          const group = document.createElement('div');
          group.className = 'dialog-input-group';
          
          const label = document.createElement('label');
          label.className = 'dialog-label';
          label.textContent = field.label;
          label.setAttribute('for', `dialog-input-${index}`);
          
          const input = document.createElement('input');
          input.className = 'dialog-input';
          input.id = `dialog-input-${index}`;
          input.type = 'text'; // 改用 text 以便自訂驗證
          input.placeholder = field.placeholder || '';
          input.inputMode = 'decimal'; // 行動裝置顯示數字鍵盤
          input.autocomplete = 'off';
          input.setAttribute('maxlength', '15'); // 限制輸入長度
          
          // 只允許數字、小數點、負號
          input.addEventListener('keydown', (e) => {
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
            const isNumber = /^[0-9]$/.test(e.key);
            const isDecimal = e.key === '.' && !input.value.includes('.');
            const isMinus = e.key === '-' && input.selectionStart === 0 && !input.value.includes('-');
            const isCtrlA = (e.ctrlKey || e.metaKey) && e.key === 'a';
            const isCtrlCV = (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v');
            
            if (!isNumber && !isDecimal && !isMinus && !allowedKeys.includes(e.key) && !isCtrlA && !isCtrlCV) {
              e.preventDefault();
            }
          });
          
          // 貼上時驗證（更嚴格）
          input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            // 限制長度和格式
            const validNumber = pastedText.match(/^-?\d{1,15}(\.\d{1,10})?$/);
            if (validNumber) {
              const num = parseFloat(pastedText);
              // 防止極端數值
              if (Math.abs(num) <= Number.MAX_SAFE_INTEGER) {
                input.value = pastedText;
              }
            }
          });
          
          // 失焦時驗證數值範圍
          input.addEventListener('blur', (e) => {
            const num = parseFloat(input.value);
            if (!isNaN(num) && Math.abs(num) > Number.MAX_SAFE_INTEGER) {
              input.value = '';
              input.placeholder = '數值過大，請重新輸入';
            }
          });
          
          group.appendChild(label);
          group.appendChild(input);
          inputsContainer.appendChild(group);
          
          return input;
        });
        
        dialog.appendChild(inputsContainer);
        
        // 按鈕容器
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'dialog-buttons';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn dialog-btn-confirm';
        confirmBtn.textContent = '計算';
        confirmBtn.onclick = () => {
          sound.playEquals();
          const values = inputs.map(input => parseFloat(input.value) || 0);
          cleanup();
          resolve(values);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn dialog-btn-cancel';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = () => {
          sound.playButtonPress();
          cleanup();
          resolve(null);
        };
        
        buttonsContainer.appendChild(confirmBtn);
        buttonsContainer.appendChild(cancelBtn);
        dialog.appendChild(buttonsContainer);
        
        // 清理函式
        function cleanup() {
          overlay.remove();
          dialog.remove();
        }
        
        // ESC 鍵取消
        const escHandler = (e) => {
          if (e.key === 'Escape') {
            cleanup();
            resolve(null);
            document.removeEventListener('keydown', escHandler);
          }
        };
        document.addEventListener('keydown', escHandler);
        
        // Enter 鍵確認（避免重複綁定，已在上方處理）
        inputs.forEach((input, index) => {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (index < inputs.length - 1) {
                inputs[index + 1].focus();
                inputs[index + 1].select();
              } else {
                confirmBtn.click();
              }
            }
          });
          
          // 聚焦時全選，方便快速輸入
          input.addEventListener('focus', () => {
            setTimeout(() => input.select(), 50);
          });
        });
        
        // 加入 DOM
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 聚焦第一個輸入框並全選
        setTimeout(() => {
          inputs[0].focus();
          inputs[0].select();
        }, 100);
      });
    }
  };
}

// ============ 快捷計算服務 (單一職責) ============

/**
 * 建立快捷計算服務
 * @returns {Object} 快捷計算服務介面
 */
function createQuickCalculatorService() {
  return {
    /**
     * 殖利率計算 (現金股利 ÷ 股價)
     * @param {number} dividend - 現金股利
     * @param {number} stockPrice - 股價
     * @returns {number} 殖利率 (%)
     */
    calculateYield(dividend, stockPrice) {
      if (stockPrice === 0) throw new Error('股價不能為零');
      return (dividend / stockPrice) * 100;
    },

    /**
     * 本益比計算 (股價 ÷ EPS)
     * @param {number} stockPrice - 股價
     * @param {number} eps - 每股盈餘
     * @returns {number} 本益比
     */
    calculatePERatio(stockPrice, eps) {
      if (eps === 0) throw new Error('EPS 不能為零');
      return stockPrice / eps;
    },

    /**
     * 複利計算 (本金 × (1 + 利率)^年數)
     * @param {number} principal - 本金
     * @param {number} rate - 年利率 (%)
     * @param {number} years - 年數
     * @returns {number} 終值
     */
    calculateCompoundInterest(principal, rate, years) {
      const rateDecimal = rate / 100;
      return principal * Math.pow(1 + rateDecimal, years);
    },

    /**
     * 漲跌幅計算 ((現價 - 原價) ÷ 原價 × 100%)
     * @param {number} currentPrice - 現價
     * @param {number} originalPrice - 原價
     * @returns {number} 漲跌幅 (%)
     */
    calculateChangeRate(currentPrice, originalPrice) {
      if (originalPrice === 0) throw new Error('原價不能為零');
      return ((currentPrice - originalPrice) / originalPrice) * 100;
    }
  };
}

// ============ 快捷計算處理器 (依賴注入) ============

/**
 * 格式化數字為千分位格式
 * @param {number} num - 要格式化的數字
 * @param {number} decimals - 小數位數
 * @returns {string} 格式化後的字串
 */
function formatNumberWithCommas(num, decimals = 2) {
  const fixed = num.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * 建立快捷計算處理器
 * @param {Object} quickCalc - 快捷計算服務
 * @param {Object} dialogManager - 對話框管理器
 * @param {Object} displayManager - 顯示管理器
 * @param {Object} soundManager - 音效管理器
 * @returns {Object} 快捷計算處理器介面
 */
function createQuickCalculatorHandler(quickCalc, dialogManager, displayManager, soundManager) {
  if (!quickCalc || !dialogManager || !displayManager || !soundManager) {
    throw new Error('All dependencies are required');
  }

  const calculators = {
    'yield': {
      title: '💰 殖利率計算',
      fields: [
        { label: '現金股利 ($)', placeholder: '例如: 5' },
        { label: '股價 ($)', placeholder: '例如: 100' }
      ],
      calculate: (values) => quickCalc.calculateYield(values[0], values[1]),
      unit: '%'
    },
    'pe-ratio': {
      title: '📊 本益比計算',
      fields: [
        { label: '股價 ($)', placeholder: '例如: 100' },
        { label: 'EPS ($)', placeholder: '例如: 5' }
      ],
      calculate: (values) => quickCalc.calculatePERatio(values[0], values[1]),
      unit: '倍'
    },
    'compound': {
      title: '📈 複利計算',
      fields: [
        { label: '本金 ($)', placeholder: '例如: 10000' },
        { label: '年利率 (%)', placeholder: '例如: 5' },
        { label: '年數', placeholder: '例如: 10' }
      ],
      calculate: (values) => quickCalc.calculateCompoundInterest(values[0], values[1], values[2]),
      unit: '$'
    },
    'change-rate': {
      title: '🔄 漲跌幅計算',
      fields: [
        { label: '現價 ($)', placeholder: '例如: 110' },
        { label: '原價 ($)', placeholder: '例如: 100' }
      ],
      calculate: (values) => quickCalc.calculateChangeRate(values[0], values[1]),
      unit: '%'
    }
  };

  return {
    async handleQuickCalculation(type) {
      const calculator = calculators[type];
      if (!calculator) {
        console.error('Unknown calculator type:', type);
        return;
      }

      try {
        const values = await dialogManager.show(calculator.title, calculator.fields);
        
        if (values === null) {
          // 使用者取消
          return;
        }

        const result = calculator.calculate(values);
        const displayValue = formatNumberWithCommas(result, 2);
        
        displayManager.updateDisplay(displayValue);
        soundManager.playEquals();
        
        // 短暫顯示單位提示
        setTimeout(() => {
          console.log(`結果: ${displayValue} ${calculator.unit}`);
        }, 100);
        
      } catch (error) {
        soundManager.playError();
        displayManager.showError('ERROR');
        console.error('Calculation error:', error.message);
      }
    }
  };
}

// ============ 鍵盤控制器 (介面隔離) ============

/**
 * 建立鍵盤控制器
 * @param {Object} buttonHandler - 按鈕處理器
 * @returns {Object} 鍵盤控制器介面
 */
function createKeyboardController(buttonHandler) {
  const keyMap = {
    '0': () => buttonHandler.handleNumber('0'),
    '1': () => buttonHandler.handleNumber('1'),
    '2': () => buttonHandler.handleNumber('2'),
    '3': () => buttonHandler.handleNumber('3'),
    '4': () => buttonHandler.handleNumber('4'),
    '5': () => buttonHandler.handleNumber('5'),
    '6': () => buttonHandler.handleNumber('6'),
    '7': () => buttonHandler.handleNumber('7'),
    '8': () => buttonHandler.handleNumber('8'),
    '9': () => buttonHandler.handleNumber('9'),
    '.': () => buttonHandler.handleNumber('.'),
    '+': () => buttonHandler.handleOperator('add'),
    '-': () => buttonHandler.handleOperator('subtract'),
    '*': () => buttonHandler.handleOperator('multiply'),
    '/': () => buttonHandler.handleOperator('divide'),
    'Enter': () => buttonHandler.handleEquals(),
    '=': () => buttonHandler.handleEquals(),
    'Escape': () => buttonHandler.handleClear(),
    'Backspace': () => buttonHandler.handleDelete(),
    '%': () => buttonHandler.handlePercent(),
    ' ': () => buttonHandler.handleClear() // Space key clears display
  };

  return {
    handleKeyPress(event) {
      // 如果對話框開啟中，不處理鍵盤事件（讓對話框處理）
      const dialogOpen = document.querySelector('.input-dialog');
      if (dialogOpen) {
        return;
      }
      
      const handler = keyMap[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    },

    attach() {
      document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },

    detach() {
      document.removeEventListener('keydown', this.handleKeyPress.bind(this));
    }
  };
}

// ============ 應用程式初始化 (依賴注入) ============

/**
 * 初始化計算機應用程式
 */
function initCalculator() {
  // 取得 DOM 元素
  const displayElement = document.getElementById('display');
  const scoreElement = document.getElementById('calculation-count');
  const buttonGrid = document.querySelector('.button-grid');
  const quickCalcPanel = document.querySelector('.quick-calc-panel');

  if (!displayElement || !scoreElement || !buttonGrid) {
    console.error('Required DOM elements not found');
    return;
  }

  // 建立各模組 (依賴注入)
  const engine = createCalculatorEngine();
  const displayManager = createDisplayManager(displayElement, scoreElement);
  const soundManager = createSoundManager();
  const buttonHandler = createButtonHandler(engine, displayManager, soundManager);
  const keyboardController = createKeyboardController(buttonHandler);
  
  // 建立快捷計算模組
  const dialogManager = createInputDialogManager(soundManager);
  const quickCalcService = createQuickCalculatorService();
  const quickCalcHandler = createQuickCalculatorHandler(
    quickCalcService,
    dialogManager,
    displayManager,
    soundManager
  );

  // 設定按鈕事件監聽
  buttonGrid.addEventListener('click', (event) => {
    const button = event.target.closest('.btn');
    if (!button) return;

    const action = button.dataset.action;
    const value = button.dataset.value;

    if (value !== undefined) {
      buttonHandler.handleNumber(value);
    } else if (action) {
      const actionMap = {
        'clear': () => buttonHandler.handleClear(),
        'delete': () => buttonHandler.handleDelete(),
        'percent': () => buttonHandler.handlePercent(),
        'add': () => buttonHandler.handleOperator('add'),
        'subtract': () => buttonHandler.handleOperator('subtract'),
        'multiply': () => buttonHandler.handleOperator('multiply'),
        'divide': () => buttonHandler.handleOperator('divide'),
        'equals': () => buttonHandler.handleEquals()
      };

      const handler = actionMap[action];
      if (handler) {
        handler();
      }
    }
  });

  // 設定快捷計算按鈕事件監聽
  if (quickCalcPanel) {
    quickCalcPanel.addEventListener('click', (event) => {
      const button = event.target.closest('.btn-quick');
      if (!button) return;

      const quickType = button.dataset.quick;
      if (quickType) {
        quickCalcHandler.handleQuickCalculation(quickType);
      }
    });
  }

  // 啟用鍵盤控制
  keyboardController.attach();

  // 初始化顯示
  displayManager.updateDisplay('0');
  displayManager.updateScore(0);

  console.log('🎮 RETRO CALC initialized - Ready Player One!');
  
  // 頁面卸載時清理資源
  window.addEventListener('beforeunload', () => {
    keyboardController.detach();
    if (soundManager.cleanup) {
      soundManager.cleanup();
    }
  });
  
  // 提供清理方法供外部調用
  window.calculatorCleanup = () => {
    keyboardController.detach();
    if (soundManager.cleanup) {
      soundManager.cleanup();
    }
  };
}

// 當 DOM 載入完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}

})(); // End of IIFE
