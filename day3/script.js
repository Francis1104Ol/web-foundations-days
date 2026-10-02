// ==========================================================================
// 1. Starting Assignment Data
// ==========================================================================
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// Valid category configuration array
const VALID_CATEGORIES = ["personal", "work", "study"];

// ==========================================================================
// 2. Functional Toolkit Implementations
// ==========================================================================

/**
 * 1. searchNotes(word)
 * Returns notes containing the targeted word, case-insensitive.
 */
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(lowerWord));
}

/**
 * 2. longestNote()
 * Returns the note object with the highest character length string, or null.
 */
function longestNote() {
  if (notes.length === 0) return null;
  
  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

/**
 * 3. countByCategory()
 * Returns a frequency map object tallying notes within active categories.
 */
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    const cat = note.category;
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

/**
 * 4. getSummary()
 * Generates an analytical text summary string, accounting for pluralization rules.
 */
function getSummary() {
  const total = notes.length;
  if (total === 0) return "0 notes.";
  
  const label = total === 1 ? "note" : "notes";
  const counts = countByCategory();
  
  // Format categorical chunks dynamically based on keys found
  const parts = [];
  for (const key in counts) {
    parts.push(`${counts[key]} ${key}`);
  }
  
  return `${total} ${label}: ${parts.join(", ")}.`;
}

/**
 * 5. isDuplicate(text)
 * Evaluates text equality matching by purging white space configurations.
 */
function isDuplicate(text) {
  const cleanInput = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanInput);
}

/**
 * 6. addNote(text, category)
 * Validates text properties, bounds, uniqueness, and adds items.
 */
function addNote(text, category) {
  // Check baseline input structural presence
  if (!text || typeof text !== "string") {
    console.warn("Addition Denied: Provided note body is invalid or empty.");
    return false;
  }

  // Length constraints validation
  const cleanText = text.trim();
  if (cleanText.length < 1 || cleanText.length > 200) {
    console.warn(`Addition Denied: Length bounds violated (${cleanText.length} chars). Must be 1-200.`);
    return false;
  }

  // Duplicate checks verification
  if (isDuplicate(cleanText)) {
    console.warn(`Addition Denied: Duplicate text context found for "${cleanText}".`);
    return false;
  }

  // Structural category membership confirmation
  if (!VALID_CATEGORIES.includes(category)) {
    console.warn(`Addition Denied: "${category}" is not a recognized workflow classification.`);
    return false;
  }

  // Append new item safely to array state
  const nextId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  notes.push({ id: nextId, text: cleanText, category: category });
  return true;
}

// ==========================================================================
// 3. Execution & Testing Assertions
// ==========================================================================

console.log("--- TESTING: searchNotes ---");
console.log(searchNotes("javascript")); 
// Expected: [ { id: 4, text: 'Revise JavaScript arrays', category: 'study' } ]
console.log(searchNotes("quantum")); 
// Expected: [] (Edge case: match absence yields clean empty tracking array)

console.log("\n--- TESTING: longestNote ---");
console.log(longestNote()); 
// Expected: { id: 3, text: 'Email the project report to Grace', category: 'work' }
// Edge case handling check:
let backupNotes = notes;
notes = [];
console.log(longestNote()); // Expected: null (Successfully returns null against empty structures)
notes = backupNotes; // Restore data index pointer state

console.log("\n--- TESTING: countByCategory ---");
console.log(countByCategory()); 
// Expected: { personal: 2, study: 2, work: 1 }
// Edge case: Empty checking state returns blank target map
notes = [];
console.log(countByCategory()); // Expected: {}
notes = backupNotes;

console.log("\n--- TESTING: getSummary ---");
console.log(getSummary()); 
// Expected: "5 notes: 2 personal, 2 study, 1 work."
notes = [{ id: 1, text: "Solo", category: "work" }];
console.log(getSummary()); 
// Expected: "1 note: 1 work." (Edge case: Correct singular pluralization tracking applied)
notes = backupNotes;

console.log("\n--- TESTING: isDuplicate ---");
console.log(isDuplicate("  buy milk and BREAD   ")); 
// Expected: true (Successfully normalizes spatial pads and registers case matches)
console.log(isDuplicate("Pick up structural parts")); 
// Expected: false

console.log("\n--- TESTING: addNote ---");
console.log(addNote("Learn CSS grid properties properly", "study")); 
// Expected: true (Appends valid structural nodes accurately)
console.log(notes.length); // Expected: 6 (Collection count properly increments)

// Edge cases checks logging out clear rejection reasons:
console.log(addNote("Buy milk and bread", "personal")); 
// Expected: false (Logging: "Addition Denied: Duplicate text context found...")
console.log(addNote("Quick reminder", "entertainment")); 
// Expected: false (Logging: "Addition Denied: "entertainment" is not a recognized workflow...")
console.log(addNote("", "work")); 
// Expected: false (Logging: "Addition Denied: Length bounds violated...")
