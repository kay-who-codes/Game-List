// DOM elements
const gamesContainer = document.getElementById('games-container');
const filtersContainer = document.getElementById('filters-container');
const rulesModal = document.getElementById('rules-modal');
const modalTitle = document.getElementById('modal-title');
const modalRules = document.getElementById('modal-rules');
const modalClose = document.getElementById('modal-close');
const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.id = 'search-input';
searchInput.placeholder = 'Search games...';

// Global games array and filter options
let games = [];
const filterOptions = {
    'Game-Type': { label: 'Type', values: new Set() },
    'Player-Count': { label: 'Players', values: new Set() },
    'Maturity': { label: 'Maturity', values: new Set() },
    'Brainload': { label: 'Complexity', values: new Set() }
};

// Fetch games from JSON file
async function fetchGames() {
    try {
        const response = await fetch('Games.json');
        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }
        const data = await response.json();
        processGameData(data['Game List']);
    } catch (error) {
        console.error('Error loading games:', error);
        gamesContainer.innerHTML = '<div class="no-games">Failed to load games. Please check your Games.json file.</div>';
    }
}

// Process game data and extract filter options
function processGameData(gameList) {
    games = gameList.map((game, index) => ({
        id: index + 1,
        title: game.Name,
        description: game.Description,
        rules: game.Rules,
        type: game['Game-Type'],
        playerCount: game['Player-Count'],
        time: game['Game-Time'],
        maturity: game.Maturity,
        brainload: game.Brainload,
        link: game.Link,
        image: game.Image || 'var(--bg-darker)'
    }));

    // Collect all unique filter values
    games.forEach(game => {
        filterOptions['Game-Type'].values.add(game.type);
        filterOptions['Player-Count'].values.add(game.playerCount);
        filterOptions['Maturity'].values.add(game.maturity);
        filterOptions['Brainload'].values.add(game.brainload);
    });

    // Create filter controls
    createFilterControls();
    filterAndSortGames();
}

// Create filter controls dynamically
function createFilterControls() {
    // Add search input
    const searchGroup = document.createElement('div');
    searchGroup.className = 'filter-group';
    searchGroup.innerHTML = '<span>Search:</span>';
    searchGroup.appendChild(searchInput);
    filtersContainer.appendChild(searchGroup);

    // Add filter dropdowns
    for (const [key, option] of Object.entries(filterOptions)) {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';
        
        const label = document.createElement('span');
        label.textContent = option.label + ':';
        filterGroup.appendChild(label);
        
        const select = document.createElement('select');
        select.id = `${key.toLowerCase()}-filter`;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = 'all';
        defaultOption.textContent = `All ${option.label}s`;
        select.appendChild(defaultOption);
        
        // Add sorted options
        const sortedValues = Array.from(option.values).sort();
        sortedValues.forEach(value => {
            const optionElement = document.createElement('option');
            optionElement.value = value;
            optionElement.textContent = value;
            select.appendChild(optionElement);
        });
        
        filterGroup.appendChild(select);
        filtersContainer.appendChild(filterGroup);
        
        // Add event listener
        select.addEventListener('change', filterAndSortGames);
    }

    // Add sort dropdown
    const sortGroup = document.createElement('div');
    sortGroup.className = 'filter-group';
    sortGroup.innerHTML = '<span>Sort by:</span>';
    
    const sortSelect = document.createElement('select');
    sortSelect.id = 'sort-by';
    
    const sortOptions = [
        { value: 'name-asc', text: 'Name (A-Z)' },
        { value: 'name-desc', text: 'Name (Z-A)' },
        { value: 'players-asc', text: 'Players (Fewest)' },
        { value: 'players-desc', text: 'Players (Most)' }
    ];
    
    sortOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        sortSelect.appendChild(optionElement);
    });
    
    sortGroup.appendChild(sortSelect);
    filtersContainer.appendChild(sortGroup);
    sortSelect.addEventListener('change', filterAndSortGames);
    
    // Add event listener for search
    searchInput.addEventListener('input', filterAndSortGames);
}

// Extract minimum players from player count string
function getMinPlayers(playerCount) {
    const match = playerCount.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
}

// Display games
function displayGames(gamesToDisplay) {
    gamesContainer.innerHTML = '';

    if (gamesToDisplay.length === 0) {
        gamesContainer.innerHTML = '<div class="no-games">No games match your filters.</div>';
        return;
    }

    gamesToDisplay.forEach(game => {
        const gameCard = document.createElement('div');
        gameCard.className = 'game-card';
        gameCard.innerHTML = `
            <div class="game-image" style="background-image: url('${game.image}')">
            </div>
            <div class="game-details">
                <div class="game-meta">
                    <a href="${game.link}" class="game-title">${game.title}</a>
                    <span class="type">${game.type}</span>
                    <span class="players">${game.playerCount}</span>
                    <span class="time">${game.time}</span>
                    <span class="maturity">${game.maturity}</span>
                    <span class="brainload">${game.brainload}</span>
                </div>
                <p class="game-description">${game.description}</p>
                <div class="game-actions">
                    <button class="rules-btn" data-id="${game.id}">View Rules</button>
                </div>
            </div>
        `;
        gamesContainer.appendChild(gameCard);
    });

    // Add event listeners to rules buttons
    document.querySelectorAll('.rules-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const gameId = parseInt(btn.getAttribute('data-id'));
            const game = games.find(g => g.id === gameId);
            if (game) {
                modalTitle.textContent = `${game.title} Rules`;
                modalRules.textContent = game.rules;
                rulesModal.classList.add('active');
            }
        });
    });
}

// Filter and sort games
function filterAndSortGames() {
    const typeFilter = document.getElementById('game-type-filter');
    const playersFilter = document.getElementById('player-count-filter');
    const maturityFilter = document.getElementById('maturity-filter');
    const brainloadFilter = document.getElementById('brainload-filter');
    const sortBy = document.getElementById('sort-by');
    const searchTerm = searchInput.value.toLowerCase();

    let filteredGames = [...games];

    // Apply filters
    if (typeFilter && typeFilter.value !== 'all') {
        filteredGames = filteredGames.filter(game => game.type === typeFilter.value);
    }

    if (playersFilter && playersFilter.value !== 'all') {
        filteredGames = filteredGames.filter(game => game.playerCount === playersFilter.value);
    }

    if (maturityFilter && maturityFilter.value !== 'all') {
        filteredGames = filteredGames.filter(game => game.maturity === maturityFilter.value);
    }

    if (brainloadFilter && brainloadFilter.value !== 'all') {
        filteredGames = filteredGames.filter(game => game.brainload === brainloadFilter.value);
    }

    // Apply search
    if (searchTerm) {
        filteredGames = filteredGames.filter(game => 
            game.title.toLowerCase().includes(searchTerm) || 
            game.description.toLowerCase().includes(searchTerm) ||
            game.type.toLowerCase().includes(searchTerm));
    }

    // Sort games
    filteredGames.sort((a, b) => {
        const aPlayers = getMinPlayers(a.playerCount);
        const bPlayers = getMinPlayers(b.playerCount);
        
        switch (sortBy.value) {
            case 'name-asc':
                return a.title.localeCompare(b.title);
            case 'name-desc':
                return b.title.localeCompare(a.title);
            case 'players-asc':
                return aPlayers - bPlayers;
            case 'players-desc':
                return bPlayers - aPlayers;
            default:
                return 0;
        }
    });

    displayGames(filteredGames);
}

// Modal event listeners
modalClose.addEventListener('click', () => rulesModal.classList.remove('active'));
rulesModal.addEventListener('click', (e) => {
    if (e.target === rulesModal) {
        rulesModal.classList.remove('active');
    }
});

// Initialize the app
fetchGames();