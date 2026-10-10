/**
 * CulinaryScale Pro - Enterprise Recipe Scaling & Formulation Engine
 * Vanilla JavaScript (ES6+) - Strict Client-Side Architecture
 */

(function () {
  'use strict';

  // LocalStorage Key
  const STORAGE_KEY = 'culinaryscale_pro_recipe_v2';

  // DOM Elements - Inputs
  const form = document.getElementById('recipeForm');
  const dishNameInput = document.getElementById('dishName');
  const originalServingsInput = document.getElementById('originalServings');
  const wantedServingsInput = document.getElementById('wantedServings');
  const ratioBadge = document.getElementById('liveRatioBadge');

  // Ingredient Inputs (3 sets)
  const ingredients = [
    {
      name: document.getElementById('ing1Name'),
      qty: document.getElementById('ing1Qty'),
      unit: document.getElementById('ing1Unit'),
      num: 1,
    },
    {
      name: document.getElementById('ing2Name'),
      qty: document.getElementById('ing2Qty'),
      unit: document.getElementById('ing2Unit'),
      num: 2,
    },
    {
      name: document.getElementById('ing3Name'),
      qty: document.getElementById('ing3Qty'),
      unit: document.getElementById('ing3Unit'),
      num: 3,
    },
  ];

  // Action Buttons
  const scaleBtn = document.getElementById('scaleBtn');
  const resetBtn = document.getElementById('resetBtn');
  const exportBtn = document.getElementById('exportBtn');
  const printBtn = document.getElementById('printBtn');
  const alertBanner = document.getElementById('alertBanner');
  const alertList = document.getElementById('alertList');
  const toastNotice = document.getElementById('toastNotice');
  const toastMessage = document.getElementById('toastMessage');

  // Output Views
  const outputEmptyState = document.getElementById('outputEmptyState');
  const outputActiveView = document.getElementById('outputActiveView');
  const resultDishTitle = document.getElementById('resultDishTitle');
  const metricOrigServings = document.getElementById('metricOrigServings');
  const metricNewServings = document.getElementById('metricNewServings');
  const metricScaleRatio = document.getElementById('metricScaleRatio');
  const resultsTableBody = document.getElementById('resultsTableBody');

  // Storage Status Indicator
  const storageSyncStatus = document.getElementById('storageSyncStatus');

  // Preset Recipes for Quick Testing
  const PRESET_RECIPES = {
    pasta: {
      dishName: 'Tuscan Herb Pasta Primavera',
      originalServings: '4',
      wantedServings: '10',
      ingredients: [
        { name: 'Artisan Penne Rigate', qty: '400', unit: 'g' },
        { name: 'Extra Virgin Olive Oil', qty: '60', unit: 'ml' },
        { name: 'Parmigiano-Reggiano', qty: '75', unit: 'g' },
      ],
    },
    sourdough: {
      dishName: 'Country Sourdough Boule',
      originalServings: '2',
      wantedServings: '6',
      ingredients: [
        { name: 'Unbleached Bread Flour', qty: '900', unit: 'g' },
        { name: 'Active Sourdough Starter', qty: '180', unit: 'g' },
        { name: 'Filtered Spring Water', qty: '650', unit: 'ml' },
      ],
    },
    brule: {
      dishName: 'Classic Bourbon Vanilla Crème Brûlée',
      originalServings: '6',
      wantedServings: '15',
      ingredients: [
        { name: 'Heavy Whipping Cream', qty: '720', unit: 'ml' },
        { name: 'Organic Egg Yolks', qty: '6', unit: 'pcs' },
        { name: 'Granulated Castor Sugar', qty: '100', unit: 'g' },
      ],
    },
  };

  /**
   * Helper: Precision Decimal Formatter
   * Handles decimal quantities without floating point precision artifacts.
   * e.g., 2.33333333 -> 2.333, 1.50000 -> 1.5, 4.000 -> 4
   */
  function formatQuantity(val) {
    if (isNaN(val) || !isFinite(val)) return '0';
    // Round to 3 decimal places
    const rounded = Math.round(val * 1000) / 1000;
    // Format nicely: remove trailing zeroes after decimal point
    return parseFloat(rounded.toFixed(3)).toString();
  }

  /**
   * Live Scaling Ratio Preview
   */
  function updateLiveRatio() {
    const orig = parseFloat(originalServingsInput.value);
    const wanted = parseFloat(wantedServingsInput.value);

    if (!isNaN(orig) && orig > 0 && !isNaN(wanted) && wanted > 0) {
      const ratio = wanted / orig;
      ratioBadge.textContent = `${formatQuantity(ratio)}×`;
      ratioBadge.style.color = '#0d9488';
    } else {
      ratioBadge.textContent = '—';
      ratioBadge.style.color = '#64748b';
    }
  }

  /**
   * Clear all inline validation errors and banner
   */
  function clearValidationErrors() {
    alertBanner.classList.remove('visible');
    alertList.innerHTML = '';

    const invalidInputs = document.querySelectorAll('.input-control.is-invalid');
    invalidInputs.forEach((input) => {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    });

    const errorMsgs = document.querySelectorAll('.field-error-msg');
    errorMsgs.forEach((msg) => {
      msg.classList.remove('visible');
      msg.textContent = '';
    });
  }

  /**
   * Mark an input as invalid and display error
   */
  function setFieldError(inputElement, errorElementId, message) {
    inputElement.classList.add('is-invalid');
    inputElement.setAttribute('aria-invalid', 'true');

    const errorEl = document.getElementById(errorElementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }

    const li = document.createElement('li');
    li.textContent = message;
    alertList.appendChild(li);
  }

  /**
   * Validation Engine
   * Returns: { isValid: boolean, errors: string[], data: object | null }
   */
  function validateForm() {
    clearValidationErrors();
    const errors = [];

    const dishNameVal = dishNameInput.value.trim();
    const origServingsVal = originalServingsInput.value.trim();
    const wantedServingsVal = wantedServingsInput.value.trim();

    // 1. Dish Name Validation
    if (!dishNameVal) {
      const msg = 'Dish name is required and cannot be empty.';
      setFieldError(dishNameInput, 'dishNameError', msg);
      errors.push(msg);
    }

    // 2. Original Servings Validation
    if (!origServingsVal) {
      const msg = 'Original servings is required.';
      setFieldError(originalServingsInput, 'origServingsError', msg);
      errors.push(msg);
    } else {
      const origNum = Number(origServingsVal);
      if (isNaN(origNum) || !isFinite(origNum)) {
        const msg = 'Original servings must be a valid numeric value.';
        setFieldError(originalServingsInput, 'origServingsError', msg);
        errors.push(msg);
      } else if (origNum <= 0) {
        const msg = 'Original servings must be greater than zero (cannot be zero or negative).';
        setFieldError(originalServingsInput, 'origServingsError', msg);
        errors.push(msg);
      }
    }

    // 3. Wanted Servings Validation
    if (!wantedServingsVal) {
      const msg = 'Wanted servings is required.';
      setFieldError(wantedServingsInput, 'wantedServingsError', msg);
      errors.push(msg);
    } else {
      const wantedNum = Number(wantedServingsVal);
      if (isNaN(wantedNum) || !isFinite(wantedNum)) {
        const msg = 'Wanted servings must be a valid numeric value.';
        setFieldError(wantedServingsInput, 'wantedServingsError', msg);
        errors.push(msg);
      } else if (wantedNum <= 0) {
        const msg = 'Wanted servings must be greater than zero (cannot be zero or negative).';
        setFieldError(wantedServingsInput, 'wantedServingsError', msg);
        errors.push(msg);
      }
    }

    // 4. Validate All Three Ingredients
    const validatedIngredients = [];
    ingredients.forEach((ing) => {
      const nameVal = ing.name.value.trim();
      const qtyVal = ing.qty.value.trim();
      const unitVal = ing.unit.value;

      // Validate Ingredient Name
      if (!nameVal) {
        const msg = `Ingredient #${ing.num} name is required and cannot be empty.`;
        setFieldError(ing.name, `ing${ing.num}NameError`, msg);
        errors.push(msg);
      }

      // Validate Ingredient Quantity
      if (!qtyVal) {
        const msg = `Ingredient #${ing.num} original quantity is required.`;
        setFieldError(ing.qty, `ing${ing.num}QtyError`, msg);
        errors.push(msg);
      } else {
        const qtyNum = Number(qtyVal);
        if (isNaN(qtyNum) || !isFinite(qtyNum)) {
          const msg = `Ingredient #${ing.num} quantity must be a valid number.`;
          setFieldError(ing.qty, `ing${ing.num}QtyError`, msg);
          errors.push(msg);
        } else if (qtyNum <= 0) {
          const msg = `Ingredient #${ing.num} quantity must be greater than zero.`;
          setFieldError(ing.qty, `ing${ing.num}QtyError`, msg);
          errors.push(msg);
        } else {
          validatedIngredients.push({
            name: nameVal,
            origQty: qtyNum,
            unit: unitVal,
          });
        }
      }
    });

    if (errors.length > 0) {
      alertBanner.classList.add('visible');
      // Scroll to alert if on mobile
      alertBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        dishName: dishNameVal,
        origServings: parseFloat(origServingsVal),
        wantedServings: parseFloat(wantedServingsVal),
        ingredients: validatedIngredients,
      },
    };
  }

  /**
   * Scalable Recipe Calculation Engine
   * Formula: newQuantity = originalQuantity * (wantedServings / originalServings)
   */
  function calculateRecipe() {
    const validation = validateForm();

    if (!validation.isValid) {
      // Per requirements: "servings field is empty zero,negative or invalid show a error message as clearly and do not diplay the calculated result"
      hideCalculatedResult();
      return;
    }

    const { dishName, origServings, wantedServings, ingredients: ingList } = validation.data;
    const ratio = wantedServings / origServings;

    // Calculate each new ingredient quantity using the specified formula
    const calculatedIngredients = ingList.map((item) => {
      const scaledQty = item.origQty * ratio;
      return {
        name: item.name,
        origQty: item.origQty,
        scaledQty: scaledQty,
        unit: item.unit,
      };
    });

    const calculationResult = {
      dishName,
      origServings,
      wantedServings,
      ratio,
      ingredients: calculatedIngredients,
      timestamp: new Date().toISOString(),
    };

    // Render the output
    renderCalculatedResult(calculationResult);

    // Save inputs and test valid result to browser local storage
    saveToLocalStorage(calculationResult);

    // Show brief feedback toast
    showToast('Recipe scaled and saved to Local Storage!');
  }

  /**
   * Render the Calculated Result in the Output Card
   */
  function renderCalculatedResult(result) {
    resultDishTitle.textContent = result.dishName;
    metricOrigServings.textContent = formatQuantity(result.origServings);
    metricNewServings.textContent = formatQuantity(result.wantedServings);
    metricScaleRatio.textContent = `${formatQuantity(result.ratio)}×`;

    // Clear and build the ingredients table rows
    resultsTableBody.innerHTML = '';
    result.ingredients.forEach((ing) => {
      const row = document.createElement('div');
      row.className = 'results-table-row';

      const origText = `${formatQuantity(ing.origQty)} ${ing.unit}`;
      const scaledText = formatQuantity(ing.scaledQty);

      row.innerHTML = `
        <div class="res-col-name">
          <span class="res-bullet" aria-hidden="true"></span>
          <span>${escapeHtml(ing.name)}</span>
        </div>
        <div class="res-col-orig tabular-nums">${origText}</div>
        <div class="res-col-scaled">
          <span class="scaled-value-badge tabular-nums">${scaledText}</span>
          <span class="scaled-unit-text">${escapeHtml(ing.unit)}</span>
        </div>
      `;

      resultsTableBody.appendChild(row);
    });

    // Toggle views
    outputEmptyState.style.display = 'none';
    outputActiveView.classList.add('visible');
  }

  /**
   * Hide the Calculated Result (on invalid input or reset)
   */
  function hideCalculatedResult() {
    outputActiveView.classList.remove('visible');
    outputEmptyState.style.display = 'flex';
  }

  /**
   * LocalStorage Engine: Save Inputs & Valid Result
   */
  function saveToLocalStorage(lastValidResult = null) {
    try {
      const payload = {
        inputs: {
          dishName: dishNameInput.value,
          originalServings: originalServingsInput.value,
          wantedServings: wantedServingsInput.value,
          ingredients: ingredients.map((ing) => ({
            name: ing.name.value,
            qty: ing.qty.value,
            unit: ing.unit.value,
          })),
        },
        lastValidResult: lastValidResult || getSavedValidResult(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (storageSyncStatus) {
        storageSyncStatus.innerHTML = '<span class="status-dot"></span> Synced to LocalStorage';
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  /**
   * Retrieve existing saved result if present
   */
  function getSavedValidResult() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.lastValidResult || null;
    } catch {
      return null;
    }
  }

  /**
   * Restore state from LocalStorage on page load / refresh
   */
  function restoreFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.inputs) return;

      // Restore inputs
      const { inputs, lastValidResult } = parsed;
      if (inputs.dishName !== undefined) dishNameInput.value = inputs.dishName;
      if (inputs.originalServings !== undefined) originalServingsInput.value = inputs.originalServings;
      if (inputs.wantedServings !== undefined) wantedServingsInput.value = inputs.wantedServings;

      if (Array.isArray(inputs.ingredients)) {
        inputs.ingredients.forEach((item, index) => {
          if (ingredients[index]) {
            if (item.name !== undefined) ingredients[index].name.value = item.name;
            if (item.qty !== undefined) ingredients[index].qty.value = item.qty;
            if (item.unit !== undefined) ingredients[index].unit.value = item.unit;
          }
        });
      }

      updateLiveRatio();

      // If a valid result was previously saved, restore and display it!
      if (lastValidResult && lastValidResult.dishName && Array.isArray(lastValidResult.ingredients)) {
        renderCalculatedResult(lastValidResult);
      }
    } catch (e) {
      console.error('Failed to restore from LocalStorage:', e);
    }
  }

  /**
   * Load Preset Recipe
   */
  function loadPreset(key) {
    const recipe = PRESET_RECIPES[key];
    if (!recipe) return;

    dishNameInput.value = recipe.dishName;
    originalServingsInput.value = recipe.originalServings;
    wantedServingsInput.value = recipe.wantedServings;

    recipe.ingredients.forEach((item, index) => {
      if (ingredients[index]) {
        ingredients[index].name.value = item.name;
        ingredients[index].qty.value = item.qty;
        ingredients[index].unit.value = item.unit;
      }
    });

    clearValidationErrors();
    updateLiveRatio();
    calculateRecipe();
    showToast(`Loaded preset: "${recipe.dishName}"`);
  }

  /**
   * Quick Scaler Multipliers (+1, -1, 0.5x, 2x, 3x)
   */
  function applyQuickScale(type) {
    let currentWanted = parseFloat(wantedServingsInput.value) || 0;
    const currentOrig = parseFloat(originalServingsInput.value) || 1;

    switch (type) {
      case 'inc1':
        currentWanted = Math.max(1, currentWanted + 1);
        break;
      case 'dec1':
        currentWanted = Math.max(1, currentWanted - 1);
        break;
      case 'half':
        currentWanted = Math.max(0.5, currentOrig * 0.5);
        break;
      case 'double':
        currentWanted = currentOrig * 2;
        break;
      case 'triple':
        currentWanted = currentOrig * 3;
        break;
    }

    wantedServingsInput.value = formatQuantity(currentWanted);
    updateLiveRatio();
    calculateRecipe();
  }

  /**
   * Reset / Clear Form
   */
  function resetForm() {
    form.reset();
    clearValidationErrors();
    updateLiveRatio();
    hideCalculatedResult();

    try {
      localStorage.removeItem(STORAGE_KEY);
      if (storageSyncStatus) {
        storageSyncStatus.innerHTML = '<span class="status-dot"></span> LocalStorage Cleared';
      }
    } catch (e) {
      console.warn('LocalStorage clear error:', e);
    }

    showToast('Form reset and saved data cleared.');
  }

  /**
   * Export / Copy Scaled Recipe Text to Clipboard
   */
  function copyRecipeToClipboard() {
    const title = resultDishTitle.textContent;
    const origServings = metricOrigServings.textContent;
    const newServings = metricNewServings.textContent;
    const ratio = metricScaleRatio.textContent;

    const rows = document.querySelectorAll('.results-table-row');
    if (!rows.length) {
      showToast('No calculated recipe to copy.');
      return;
    }

    let text = `====================================\n`;
    text += `SCALED RECIPE: ${title.toUpperCase()}\n`;
    text += `====================================\n`;
    text += `Original Servings : ${origServings}\n`;
    text += `Scaled Servings   : ${newServings}\n`;
    text += `Scaling Factor    : ${ratio}\n\n`;
    text += `SCALED INGREDIENTS:\n`;

    rows.forEach((row) => {
      const name = row.querySelector('.res-col-name').textContent.trim();
      const orig = row.querySelector('.res-col-orig').textContent.trim();
      const scaledVal = row.querySelector('.scaled-value-badge').textContent.trim();
      const unit = row.querySelector('.scaled-unit-text').textContent.trim();
      text += `• ${name}: ${scaledVal} ${unit} (Original: ${orig})\n`;
    });

    text += `\nFormulated with CulinaryScale Pro\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Scaled recipe copied to clipboard!'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Scaled recipe copied to clipboard!');
    } catch {
      showToast('Please copy recipe manually.');
    }
    document.body.removeChild(textarea);
  }

  /**
   * Toast Notification Controller
   */
  let toastTimer = null;
  function showToast(message) {
    if (!toastNotice || !toastMessage) return;
    toastMessage.textContent = message;
    toastNotice.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2800);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 3D Perspective Card Tilt Interaction
   */
  function setup3DCardTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const cards = document.querySelectorAll('.card-3d');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left;
        const cardY = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((cardY - centerY) / centerY) * -5; // max 5 deg tilt
        const rotateY = ((cardX - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      });
    });
  }

  /**
   * Bind Event Listeners
   */
  function initEvents() {
    // Scalable Recipe Button
    scaleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculateRecipe();
    });

    // Reset Button
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetForm();
    });

    // Export & Print Buttons
    if (exportBtn) {
      exportBtn.addEventListener('click', copyRecipeToClipboard);
    }
    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    // Live ratio and autosave on typing
    const allInputs = [
      dishNameInput,
      originalServingsInput,
      wantedServingsInput,
      ...ingredients.map((i) => i.name),
      ...ingredients.map((i) => i.qty),
      ...ingredients.map((i) => i.unit),
    ];

    allInputs.forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        updateLiveRatio();
        // Autosave input drafts
        saveToLocalStorage();
      });
      input.addEventListener('change', () => {
        updateLiveRatio();
        saveToLocalStorage();
      });
    });

    // Preset Buttons
    const presetButtons = document.querySelectorAll('[data-preset]');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-preset');
        loadPreset(key);
      });
    });

    // Quick Scaler Buttons
    const quickScaleBtns = document.querySelectorAll('[data-scale-action]');
    quickScaleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-scale-action');
        applyQuickScale(action);
      });
    });

    // Keyboard support: Enter key in form submits calculation
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        calculateRecipe();
      }
    });
  }

  /**
   * Initial Setup
   */
  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    setup3DCardTilt();
    restoreFromLocalStorage();
    updateLiveRatio();
  });
})();
