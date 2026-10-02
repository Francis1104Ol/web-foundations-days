// ==========================================================================
// 1. Core DOM Element Cache Declarations
// ==========================================================================
const loadUsersButton = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusParagraph = document.getElementById('status');
const usersList = document.getElementById('users-list');

// ==========================================================================
// 2. Local State Management Index
// ==========================================================================
let usersDataset = [];

// ==========================================================================
// 3. Template Generation & Dynamic Component Rendering Engine
// ==========================================================================
function renderUsers(targetList) {
  // Purge standard DOM components inside list area before injection passes
  usersList.innerHTML = '';

  // Handle zero-match filtering states safely
  if (targetList.length === 0) {
    const feedbackItem = document.createElement('li');
    feedbackItem.textContent = usersDataset.length === 0 
      ? 'No active user models cached in system.' 
      : 'No users match your filter.';
    feedbackItem.style.fontStyle = 'italic';
    feedbackItem.style.textAlign = 'center';
    usersList.appendChild(feedbackItem);
    return;
  }

  // Iterate over matching profiles building secure DOM parameters
  targetList.forEach(user => {
    const li = document.createElement('li');
    
    const pName = document.createElement('p');
    pName.className = 'user-name';
    pName.textContent = user.name;
    
    const pDetails = document.createElement('p');
    pDetails.className = 'user-details';
    
    // Fallback verification checks for nested data architecture pipelines
    const userCity = user.address?.city || 'Unknown City';
    const companyName = user.company?.name || 'Unknown Corporate Group';
    
    pDetails.textContent = `✉️ Email: ${user.email} | 📍 City: ${userCity} | 🏢 Org: ${companyName}`;
    
    li.appendChild(pName);
    li.appendChild(pDetails);
    usersList.appendChild(li);
  });
}

// ==========================================================================
// 4. Asynchronous Pipeline Integration (Data Fetching Operations)
// ==========================================================================
async function loadUsers() {
  // Setup baseline structural loading visual parameters
  statusParagraph.textContent = '🔄 Initializing data pipeline connection... Loading users...';
  statusParagraph.style.color = '#2563eb';
  loadUsersButton.disabled = true;
  usersList.innerHTML = '';
  filterInput.value = '';

  try {
    const response = await fetch('https://typicode.com');
    
    // Explicit network confirmation channel evaluation
    if (!response.ok) {
      throw new Error(`Server responded with fatal HTTP state status code: ${response.status}`);
    }

    // Capture and populate memory arrays tracking responses
    usersDataset = await response.json();
    
    statusParagraph.textContent = `✅ Success: Successfully compiled ${usersDataset.length} user directory profiles.`;
    statusParagraph.style.color = '#16a34a';
    
    renderUsers(usersDataset);

  } catch (error) {
    console.error("Data ingestion pipeline failed: ", error);
    statusParagraph.textContent = `❌ Error fetching data: ${error.message}. Please try again later.`;
    statusParagraph.style.color = '#dc2626';
    usersDataset = [];
    renderUsers([]);
  } finally {
    // Return button triggers back to active status mapping profiles
    loadUsersButton.disabled = false;
  }
}

// ==========================================================================
// 5. In-Memory Filter Event Hooks Processing Core
// ==========================================================================
filterInput.addEventListener('input', (event) => {
  const normalQuery = event.target.value.toLowerCase().trim();
  
  // Filter memory reference arrays directly without emitting secondary requests
  const filteredUsers = usersDataset.filter(user => 
    user.name.toLowerCase().includes(normalQuery)
  );
  
  renderUsers(filteredUsers);
});

// Register button execution handler actions
loadUsersButton.addEventListener('click', loadUsers);
