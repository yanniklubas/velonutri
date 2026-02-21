const STORAGE_KEY = "velonutri-settings";

const MIN_HOURS = 1;
const MAX_HOURS = 48;

const DEFAULT_SETTINGS = {
  easyCarbs: 65,
  hardCarbs: 100,
  shouldAddFructose: false,
  maltodextrinRatio: 50,
  gelConcentration: 70,
};
const DEFAULT_APP_STATE = {
  hours: 2,
  intensity: null,
  carbsPerHour: 0,
};

let settings = { ...DEFAULT_SETTINGS };
let appState = {
  ...DEFAULT_APP_STATE,
};

function loadSettings() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      settings = { ...DEFAULT_SETTINGS };
    }
  }
  updateSettingsUI();
  updateIntensityLabels();
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  updateSettingsUI();
  updateIntensityLabels();
}

function updateSettingsUI() {
  document.getElementById(SETTINGS_EASY_RIDE_CARBS_ID).value =
    settings.easyCarbs;
  document.getElementById(SETTINGS_HARD_RIDE_CARBS_ID).value =
    settings.hardCarbs;
  document.getElementById(SETTINGS_CONCENTRATION_SLIDER_ID).value =
    settings.gelConcentration;
  document.getElementById(SETTINGS_SUGAR_CONCENTRATION_VALUE_ID).textContent =
    `${settings.gelConcentration}%`;
  document.getElementById(SETTINGS_WATER_CONCENTRATION_VALUE_ID).textContent =
    `${100 - settings.gelConcentration}%`;

  document.getElementById(SETTINGS_FRUCTOSE_TOGGLE_ID).checked =
    settings.shouldAddFructose;
  document.getElementById(SETTINGS_MALTO_FRUCTOSE_RATIO_SLIDER_ID).value =
    settings.maltodextrinRatio;
  document.getElementById(SETTINGS_MALTO_RATIO_ID).textContent =
    `${settings.maltodextrinRatio}%`;
  document.getElementById(SETTINGS_FRUCTOSE_RATIO_ID).textContent =
    `${100 - settings.maltodextrinRatio}%`;
  document.getElementById(
    SETTINGS_MALTO_FRUCTOSE_RATIO_SECTION_ID,
  ).style.display = settings.shouldAddFructose ? "block" : "none";
}

function updateIntensityLabels() {
  document.getElementById(UI_EASY_RIDE_CARBS_LABEL_ID).textContent =
    `${settings.easyCarbs}g carbs/hour`;
  document.getElementById(UI_HARD_RIDE_CARBS_LABEL_ID).textContent =
    `${settings.hardCarbs}g carbs/hour`;
}

function showStep(newStepNum, currentStepNum) {
  // document
  //   .querySelectorAll(".step")
  //   .forEach((step) => step.classList.remove("active"));
  if (currentStepNum)
    document
      .getElementById(`step-${currentStepNum}`)
      .classList.remove("active");
  document.getElementById(`step-${newStepNum}`).classList.add("active");
}

function updateHoursDisplay() {
  const display = document.getElementById(UI_RIDE_HOURS_DISPLAY_ID);
  display.textContent = appState.hours;
}

function adjustHours(amount) {
  appState.hours += amount;
  if (appState.hours < MIN_HOURS) appState.hours = MIN_HOURS;
  if (appState.hours > MAX_HOURS) appState.hours = MAX_HOURS;
  updateHoursDisplay();
}

function goToStep2() {
  showStep(2, 1);
}

function selectIntensity(type) {
  appState.intensity = type != "custom" ? type : null;

  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  document
    .querySelector(`[data-intensity="${type}"]`)
    .classList.add("selected");
  const customInput = document.getElementById(UI_CUSTOM_CARB_RATE_ID);
  const customInputField = document.getElementById(
    UI_CUSTOM_CARB_RATE_INPUT_ID,
  );

  customInput.style.display = type != "custom" ? "none" : "block";
  customInputField.value = "";

  if (type === "easy") {
    appState.carbsPerHour = settings.easyCarbs;
  } else if (type === "hard") {
    appState.carbsPerHour = settings.hardCarbs;
  } else {
    appState.carbsPerHour = 0;
    customInputField.focus();
  }

  updateNextButton();
}

function updateCustomRate() {
  const customInput = document.getElementById(UI_CUSTOM_CARB_RATE_INPUT_ID);
  try {
    const value = parseInt(customInput.value);
    if (value > 0) {
      appState.carbsPerHour = value;
    }
  } catch (e) {}
  if (customInput.value === "") appState.carbsPerHour = 0;
  updateNextButton();
}

function updateNextButton() {
  const nextBtn = document.querySelector("#step-2 .btn-primary");
  nextBtn.disabled = !canCalculateResults();
}

function canCalculateResults() {
  return appState.intensity != null || appState.carbsPerHour > 0;
}

function goToStep3() {
  if (!canCalculateResults()) return;
  calculateResults();
  showStep(3, 2);
}

function calculateResults() {
  const totalCarbs = Math.round(appState.hours * appState.carbsPerHour);
  const waterPercent = 100 - settings.gelConcentration;
  const waterAmount = Math.round(
    totalCarbs * (waterPercent / settings.gelConcentration),
  );
  const coldWaterAmount = waterAmount * 2;

  document.getElementById("total-carbs").textContent = totalCarbs;
  document.getElementById("hours-ride").textContent = appState.hours;
  document.getElementById("carbs-per-hour").textContent = appState.carbsPerHour;

  const maltodextrinRatio = settings.shouldAddFructose
    ? settings.maltodextrinRatio
    : 100;
  const fructoseRatio = settings.shouldAddFructose
    ? 100 - settings.maltodextrinRatio
    : 0;

  const maltodextrinGrams = Math.round(totalCarbs * (maltodextrinRatio / 100));
  const fructoseGrams = Math.round(totalCarbs * (fructoseRatio / 100));

  const ingredientsEl = document.getElementById("recipe-ingredients");
  ingredientsEl.innerHTML = `
    <div class="ingredient">
      <span class="ingredient-name">Carbohydrates</span>
      <span class="ingredient-amount">${totalCarbs}g</span>
    </div>
    <div class="ingredient">
      <span class="ingredient-name">Water</span>
      <span class="ingredient-amount">${waterAmount}ml</span>
    </div>
  `;

  const stepsEl = document.getElementById("recipe-steps");
  if (settings.shouldAddFructose) {
    stepsEl.innerHTML = `
      <div class="recipe-step">
        <span class="recipe-step-num">1</span>
        <span class="step-text">Weigh out <strong>${maltodextrinGrams}g maltodextrin</strong> and <strong>${fructoseGrams}g fructose</strong></span>
      </div>
      <div class="recipe-step">
        <span class="recipe-step-num">2</span>
        <span class="step-text">Mix with <strong>${waterAmount}ml of water</strong></span>
      </div>
      <div class="recipe-step">
        <span class="recipe-step-num">3</span>
        <span class="step-text">Shake well until dissolved</span>
      </div>
    `;
  } else {
    stepsEl.innerHTML = `
      <div class="recipe-step">
        <span class="recipe-step-num">1</span>
        <span class="step-text">Weigh out <strong>${maltodextrinGrams}g maltodextrin</strong></span>
      </div>
      <div class="recipe-step">
        <span class="recipe-step-num">2</span>
        <span class="step-text">Mix with <strong>${waterAmount}ml of water</strong></span>
      </div>
      <div class="recipe-step">
        <span class="recipe-step-num">3</span>
        <span class="step-text">Shake well until dissolved</span>
      </div>
    `;
  }

  const noteEl = document.getElementById("recipe-note");
  noteEl.innerHTML = `<strong>Cold weather:</strong> For better viscosity in cold conditions, consider doubling the water amount to <strong>${coldWaterAmount}ml</strong>.`;
}

function resetApp() {
  appState = {
    ...DEFAULT_APP_STATE,
  };

  updateHoursDisplay();
  document
    .querySelectorAll(".option-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  document.getElementById(UI_CUSTOM_CARB_RATE_ID).style.display = "none";
  document.getElementById(UI_CUSTOM_CARB_RATE_INPUT_ID).value = "";

  showStep(1, 3);
}

function openSettings() {
  document.getElementById("settings-overlay").classList.add("active");
}

function closeSettings() {
  document.getElementById("settings-overlay").classList.remove("active");
}

function setupHourButtons() {
  document.querySelectorAll(".hour-btn.minus").forEach((btn) => {
    btn.addEventListener("click", () =>
      adjustHours(-parseFloat(btn.dataset.amount)),
    );
  });

  document.querySelectorAll(".hour-btn.plus").forEach((btn) => {
    btn.addEventListener("click", () =>
      adjustHours(parseFloat(btn.dataset.amount)),
    );
  });
}

function setupStep2() {
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectIntensity(btn.dataset.intensity);
    });
    btn.classList.remove("selected");
  });

  document
    .getElementById(UI_CUSTOM_CARB_RATE_INPUT_ID)
    .addEventListener("input", updateCustomRate);

  document.getElementById("step-2").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToStep3();
    }
  });
}

function setupAppButtons() {
  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const step = btn.closest(".step");
      if (step.id === "step-2") showStep(1, 2);
      else if (step.id === "step-3") showStep(2, 3);
    });
  });
  document.getElementById("start-over").addEventListener("click", resetApp);
}

function setupSettings() {
  document
    .getElementById("settings-btn")
    .addEventListener("click", openSettings);
  document
    .getElementById("settings-close")
    .addEventListener("click", closeSettings);
  document.getElementById("settings-overlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeSettings();
  });
  document
    .getElementById(SETTINGS_EASY_RIDE_CARBS_ID)
    .addEventListener("change", (e) => {
      settings.easyCarbs =
        parseInt(e.target.value) || DEFAULT_SETTINGS.easyCarbs;
      saveSettings();
    });

  document
    .getElementById(SETTINGS_HARD_RIDE_CARBS_ID)
    .addEventListener("change", (e) => {
      settings.hardCarbs =
        parseInt(e.target.value) || DEFAULT_SETTINGS.hardCarbs;
      saveSettings();
    });

  document
    .getElementById(SETTINGS_FRUCTOSE_TOGGLE_ID)
    .addEventListener("change", (e) => {
      settings.shouldAddFructose = e.target.checked;
      saveSettings();
    });

  document
    .getElementById(SETTINGS_MALTO_FRUCTOSE_RATIO_SLIDER_ID)
    .addEventListener("input", (e) => {
      settings.maltodextrinRatio = parseInt(e.target.value);
      saveSettings();
    });

  document
    .getElementById(SETTINGS_CONCENTRATION_SLIDER_ID)
    .addEventListener("input", (e) => {
      settings.gelConcentration = parseInt(e.target.value);
      saveSettings();
    });
}

function init() {
  loadSettings();
  setupHourButtons();
  setupStep2();
  setupAppButtons();
  setupSettings();
  resetApp();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

// HTML IDs
const UI_RIDE_HOURS_DISPLAY_ID = "ride-hours-display";
const UI_EASY_RIDE_CARBS_LABEL_ID = "easy-carbs-label";
const UI_HARD_RIDE_CARBS_LABEL_ID = "hard-carbs-label";
const UI_CUSTOM_CARB_RATE_ID = "custom-carb-rate";
const UI_CUSTOM_CARB_RATE_INPUT_ID = "custom-carb-rate-input";

const SETTINGS_EASY_RIDE_CARBS_ID = "easy-carbs";
const SETTINGS_HARD_RIDE_CARBS_ID = "hard-carbs";
const SETTINGS_CONCENTRATION_SLIDER_ID = "concentration-slider";
const SETTINGS_SUGAR_CONCENTRATION_VALUE_ID = "sugar-concentration-value";
const SETTINGS_WATER_CONCENTRATION_VALUE_ID = "water-concentration-value";
const SETTINGS_FRUCTOSE_TOGGLE_ID = "fructose-toggle";
const SETTINGS_MALTO_FRUCTOSE_RATIO_SLIDER_ID = "malto-fructose-ratio-slider";
const SETTINGS_MALTO_RATIO_ID = "malto-ratio";
const SETTINGS_FRUCTOSE_RATIO_ID = "fructose-ratio";
const SETTINGS_MALTO_FRUCTOSE_RATIO_SECTION_ID = "malto-fructose-ratio-section";

document.addEventListener("DOMContentLoaded", init);
