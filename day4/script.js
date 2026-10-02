// ==========================================================================
// 1. DOM Element Cache Declarations
// ==========================================================================
const noteTextarea = document.getElementById('note-text');
const charCounter = document.getElementById('char-count');
const wordCounter = document.getElementById('word-count');
const clearButton = document.getElementById('clear-btn');
const themeToggleButton = document.getElementById('theme-toggle');

// ==========================================================================
// 2. Metrics Counter & Validation Processing Core
// ==========================================================================
function updateCounts() {
  const currentText = noteTextarea.value;
  const totalCharacters = currentText.length;

  // Render character validation strings metrics
  charCounter.textContent = `${totalCharacters} / 200 characters`;

  // Dynamically configure conditional contextual styling warnings status limits
  charCounter.classList.remove('warning', 'over');
  if (totalCharacters > 200) {
    charCounter.classList.add('over');
  } else if (totalCharacters > 180) {
    charCounter.classList.add('warning');
  }

  // Calculate distinct words parsing spaces correctly
  const scrubbedText = currentText.trim();
  const totalWords = scrubbedText === "" ? 0 : scrubbedText.split(/\s+/).length;
  
  wordCounter.textContent = `${totalWords} ${totalWords === 1 ? 'word' : 'words'}`;
}

// ==========================================================================
// 3. Storage Persistence Access Modifiers
// ==========================================================================
function saveDraftToStorage() {
  localStorage.setItem('quicknotes_draft', noteTextarea.value);
}

function clearWorkspace() {
  noteTextarea.value = '';
  localStorage.removeItem('quicknotes_draft');
  updateCounts();
}

// ==========================================================================
// 4. Interface Theme Toggle Orchestrator
// ==========================================================================
function toggleInterfaceTheme() {
  const isDarkModeActive = document.body.classList.toggle('dark');
  
  // Set labels and write configuration metrics to localStorage state
  if (isDarkModeActive) {
    themeToggleButton.textContent = 'Light mode';
    localStorage.setItem('quicknotes_theme', 'dark');
  } else {
    themeToggleButton.textContent = 'Dark mode';
    localStorage.setItem('quicknotes_theme', 'light');
  }
}

// ==========================================================================
// 5. Event Listeners & Hardware Hooks Registers
// ==========================================================================

// Handle keyboard text entry pipelines
noteTextarea.addEventListener('input', () => {
  updateCounts();
  saveDraftToStorage();
});

// Clear button pipeline hook
clearButton.addEventListener('click', clearWorkspace);

// Escape key intercept validation within structural text areas
noteTextarea.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearWorkspace();
  }
});

// Theme button handler
themeToggleButton.addEventListener('click', toggleInterfaceTheme);

// ==========================================================================
// 6. Application Initializer Run Sequence
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // 1. Recover saved text state entries safely
  const savedDraft = localStorage.getItem('quicknotes_draft');
  if (savedDraft !== null) {
    noteTextarea.value = savedDraft;
  }

  // 2. Recover user theme choices metrics configuration variables maps
  const savedTheme = localStorage.getItem('quicknotes_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggleButton.textContent = 'Light mode';
  } else {
    document.body.classList.remove('dark');
    themeToggleButton.textContent = 'Dark mode';
  }

  // 3. Run validation counters pass immediately on interface setup complete
  updateCounts();
});
