document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Create background elements
    createBackground();
    
    // Game state
    let currentGame = null;
    let selectedCharacter = 'hamster';
    let gameRunning = false;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    
    // Initialize purchased characters from localStorage
    let purchasedCharacters = JSON.parse(localStorage.getItem('purchasedCharacters')) || ['hamster'];
    localStorage.setItem('purchasedCharacters', JSON.stringify(purchasedCharacters));
    
    // Audio state
    window.audioState = {
        musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
        sfxEnabled: localStorage.getItem('sfxEnabled') !== 'false'
    };
    
    // Initialize gameState if not already initialized
    if (!window.gameState) {
        window.gameState = new GameState();
    }
    
    // Update balance display
    function updateBalanceDisplay() {
        const balanceElement = document.getElementById('main-balance');
        if (balanceElement) {
            const balance = window.gameState.getBalance();
            balanceElement.textContent = `Balance: ${balance} $Grind`;
        }
    }
    
    // Update shop balance display
    function updateShopBalance() {
        const shopBalanceElement = document.querySelector('.shop-modal .balance');
        if (shopBalanceElement) {
            const balance = window.gameState.getBalance();
            shopBalanceElement.textContent = `${balance} $GRIND`;
        }
    }
    
    // Update mini inventory display
    function updateMiniInventory() {
        const miniInventoryItems = document.querySelector('.mini-inventory-items');
        if (!miniInventoryItems) return;
        
        miniInventoryItems.innerHTML = '';
        
        // Get all powerup items
        const powerupItems = [
            { name: 'Speed Boost', image: 'assets/images/speed-boost.png' },
            { name: 'Extra Life', image: 'assets/images/extra-life.png' }
        ];
        
        powerupItems.forEach(item => {
            const quantity = window.gameState.getItemQuantity(item.name);
            if (quantity > 0) {
                const itemElement = document.createElement('div');
                itemElement.className = 'mini-inventory-item';
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <span class="quantity">${quantity}</span>
                    <button class="use-button">+</button>
                `;
                
                const useButton = itemElement.querySelector('.use-button');
                useButton.addEventListener('click', () => {
                    if (quantity > 0) {
                        window.gameState.decrementItem(item.name);
                        window.gameState.setItemActive(item.name, true);
                        updateMiniInventory();
                    }
                });
                
                miniInventoryItems.appendChild(itemElement);
            }
        });
    }
    
    // Subscribe to gameState changes
    window.gameState.subscribe(() => {
        updateBalanceDisplay();
        updateShopBalance();
        updateMiniInventory();
    });
    
    // Initial updates
    updateBalanceDisplay();
    updateMiniInventory();
    
    // Get all modal elements
    const howToPlayModal = document.getElementById('howToPlayModal');
    const settingsModal = document.getElementById('settingsModal');
    const storeModal = document.querySelector('.store-modal');
    const inventoryModal = document.querySelector('.inventory-modal');
    
    // Get all button elements
    const startButton = document.querySelector('.start-button');
    const walletButton = document.querySelector('.wallet-button');
    const howToPlayBtn = document.querySelector('.how-to-play-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const storeButton = document.querySelector('.shop-button');
    const inventoryButton = document.querySelector('.inventory-button');
    const closeButtons = document.querySelectorAll('.close-btn, .close-button');
    const leaderboardButton = document.querySelector('.leaderboard-button');
    
    // Create pause overlay
    const pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'pause-overlay';
    pauseOverlay.innerHTML = `
        <div class="pause-content">
            <h2>Game Paused</h2>
            <div class="pause-buttons">
                <button class="resume-btn">Resume</button>
                <button class="restart-btn">Restart</button>
                <button class="main-menu-btn">Return to Home Page</button>
                <button class="pause-settings-btn">Settings</button>
                <div class="pause-settings-panel">
                    <div class="settings-option" style="--index: 0">
                        <label for="pause-music-toggle">Music</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-music-toggle" checked>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="settings-option" style="--index: 1">
                        <label for="pause-sound-toggle">Sound Effects</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-sound-toggle" checked>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="settings-option" style="--index: 2">
                        <label for="pause-theme-toggle">Night Mode</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-theme-toggle" ${document.documentElement.getAttribute('data-theme') === 'night' ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
                <button class="pause-shop-btn">Shop</button>
                <button class="pause-how-to-play-btn">How to Play</button>
                <button class="pause-leaderboard-btn">Leaderboard</button>
                <button class="pause-wallet-btn">Connect Wallet</button>
            </div>
        </div>
    `;
    document.body.appendChild(pauseOverlay);
    
    // Add click event listener to close pause overlay when clicking outside
    pauseOverlay.addEventListener('click', (e) => {
        const pauseContent = pauseOverlay.querySelector('.pause-content');
        if (!pauseContent.contains(e.target)) {
            if (currentGame) {
                currentGame.resume();
            }
        }
    });
    
    // Create pause button
    const pauseButton = document.createElement('button');
    pauseButton.className = 'pause-btn';
    pauseButton.innerHTML = 'PAUSE';
    document.body.appendChild(pauseButton);
    
    // Pause button event listener
    pauseButton.addEventListener('click', () => {
        if (currentGame && gameRunning) {
            currentGame.togglePause();
        }
    });
    
    // Pause overlay button event listeners
    const resumeBtn = pauseOverlay.querySelector('.resume-btn');
    const restartBtn = pauseOverlay.querySelector('.restart-btn');
    const mainMenuBtn = pauseOverlay.querySelector('.main-menu-btn');
    const pauseSettingsBtn = pauseOverlay.querySelector('.pause-settings-btn');
    const pauseShopBtn = pauseOverlay.querySelector('.pause-shop-btn');
    const pauseHowToPlayBtn = pauseOverlay.querySelector('.pause-how-to-play-btn');
    const pauseLeaderboardBtn = pauseOverlay.querySelector('.pause-leaderboard-btn');
    const pauseWalletBtn = pauseOverlay.querySelector('.pause-wallet-btn');
    const pauseMusicToggle = pauseOverlay.querySelector('#pause-music-toggle');
    const pauseSfxToggle = pauseOverlay.querySelector('#pause-sound-toggle');
    const pauseThemeToggle = pauseOverlay.querySelector('#pause-theme-toggle');
    
    resumeBtn.addEventListener('click', () => {
        if (currentGame) {
            currentGame.resume();
        }
    });
    
    restartBtn.addEventListener('click', () => {
        if (currentGame) {
            // Hide pause overlay
            document.querySelector('.pause-overlay').classList.remove('active');
            
            // Make sure item timers are completely reset
            if (currentGame.itemTimers) {
                currentGame.itemTimers = {
                    magnet: { active: false, endTime: 0, duration: 20000 },
                    coffee: { active: false, endTime: 0, duration: 20000 }
                };
            }
            
            // Reset the game
            currentGame.resetGame();
            // Ensure game is not paused and resume
            currentGame.isPaused = false;
            if (window.audioState.musicEnabled) {
                currentGame.backgroundMusic.currentTime = 0;
                currentGame.backgroundMusic.play();
            }
            // Restart obstacle spawning
            currentGame.spawnObstacles();
        }
    });
    
    mainMenuBtn.addEventListener('click', () => {
        if (currentGame) {
            currentGame.destroy();
            currentGame = null;
            gameRunning = false;
            document.querySelector('.start-screen').style.display = 'flex';
            document.querySelector('.settings-container').style.display = 'flex';
            pauseButton.style.display = 'none';
        }
    });
    
    pauseSettingsBtn.addEventListener('click', () => {
        const settingsPanel = pauseOverlay.querySelector('.pause-settings-panel');
        settingsPanel.classList.toggle('active');
    });
    
    pauseMusicToggle.addEventListener('change', () => {
        window.audioState.musicEnabled = pauseMusicToggle.checked;
        localStorage.setItem('musicEnabled', pauseMusicToggle.checked);
        
        if (currentGame) {
            if (pauseMusicToggle.checked) {
                currentGame.backgroundMusic.play();
            } else {
                currentGame.backgroundMusic.pause();
            }
        }
    });
    
    pauseSfxToggle.addEventListener('change', () => {
        window.audioState.sfxEnabled = pauseSfxToggle.checked;
        localStorage.setItem('sfxEnabled', pauseSfxToggle.checked);
    });

    pauseThemeToggle.addEventListener('change', () => {
        const newTheme = pauseThemeToggle.checked ? 'night' : 'day';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update the main theme toggle emoji
        const themeEmoji = document.querySelector('.theme-emoji');
        if (themeEmoji) {
            themeEmoji.textContent = newTheme === 'night' ? '🌙' : '☀️';
        }
        
        // Update the main theme toggle checkbox
        const mainThemeToggle = document.getElementById('theme-toggle');
        if (mainThemeToggle) {
            mainThemeToggle.checked = newTheme === 'night';
        }
    });

    // Add event listener for main theme toggle to sync with pause theme toggle
    const mainThemeToggle = document.getElementById('theme-toggle');
    if (mainThemeToggle) {
        mainThemeToggle.addEventListener('change', () => {
            const newTheme = mainThemeToggle.checked ? 'night' : 'day';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update the theme emoji
            const themeEmoji = document.querySelector('.theme-emoji');
            if (themeEmoji) {
                themeEmoji.textContent = newTheme === 'night' ? '🌙' : '☀️';
            }
            
            // Update the pause theme toggle
            if (pauseThemeToggle) {
                pauseThemeToggle.checked = newTheme === 'night';
            }
        });
    }

    // Modal event listeners
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID ${modalId} not found`);
            return;
        }
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal with ID ${modalId} not found`);
            return;
        }
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Button click handlers
    howToPlayBtn.addEventListener('click', () => {
        console.log('How to Play button clicked');
        showModal('howToPlayModal');
    });

    settingsBtn.addEventListener('click', () => {
        console.log('Settings button clicked');
        showModal('settingsModal');
    });

    storeButton.addEventListener('click', (e) => {
        console.log('Store button clicked');
        e.stopPropagation();
        showModal('shop-modal');
    });

    inventoryButton.addEventListener('click', (e) => {
        console.log('Inventory button clicked');
        e.stopPropagation();
        if (inventory) {
            inventory.openInventory();
        } else {
            console.error('Inventory instance not found');
        }
    });

    // Add event listeners for wallet and leaderboard buttons
    walletButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showMessage('Wallet connection feature coming soon!', 'info');
    });

    leaderboardButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showMessage('Leaderboard feature coming soon!', 'info');
    });

    // Close button handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = button.closest('.modal, .shop-modal, .inventory-modal');
            hideModal(modal.id);
            
            // If the game is paused, show the pause overlay again
            if (currentGame && currentGame.isPaused) {
                document.querySelector('.pause-overlay').classList.add('active');
            }
        });
    });

    // Click outside modal to close
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal') || 
            event.target.classList.contains('shop-modal') || 
            event.target.classList.contains('inventory-modal')) {
            hideModal(event.target.id);
            
            // If the game is paused, show the pause overlay again
            if (currentGame && currentGame.isPaused) {
                document.querySelector('.pause-overlay').classList.add('active');
            }
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active, .shop-modal.active, .inventory-modal.active').forEach(modal => {
                hideModal(modal.id);
            });
            
            // If the game is paused, show the pause overlay again
            if (currentGame && currentGame.isPaused) {
                document.querySelector('.pause-overlay').classList.add('active');
            }
        }
    });

    // Settings toggles
    const musicToggle = document.getElementById('music-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicLabel = document.querySelector('label[for="music-toggle"]');
    const sfxLabel = document.querySelector('label[for="sfx-toggle"]');

    // Load saved settings
    const savedMusic = localStorage.getItem('musicEnabled');
    const savedSfx = localStorage.getItem('sfxEnabled');
    
    if (savedMusic !== null) {
        musicToggle.checked = savedMusic === 'true';
        window.audioState.musicEnabled = savedMusic === 'true';
    }
    if (savedSfx !== null) {
        sfxToggle.checked = savedSfx === 'true';
        window.audioState.sfxEnabled = savedSfx === 'true';
    }

    // Function to toggle music
    function toggleMusic() {
        musicToggle.checked = !musicToggle.checked;
        window.audioState.musicEnabled = musicToggle.checked;
        localStorage.setItem('musicEnabled', musicToggle.checked);
        if (currentGame) {
            if (musicToggle.checked) {
                currentGame.backgroundMusic.play();
            } else {
                currentGame.backgroundMusic.pause();
            }
        }
    }

    // Function to toggle sound effects
    function toggleSFX() {
        sfxToggle.checked = !sfxToggle.checked;
        window.audioState.sfxEnabled = sfxToggle.checked;
        localStorage.setItem('sfxEnabled', sfxToggle.checked);
    }

    // Add event listeners for both toggle switches and labels
    musicToggle.addEventListener('change', toggleMusic);
    musicLabel.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMusic();
    });

    sfxToggle.addEventListener('change', toggleSFX);
    sfxLabel.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSFX();
    });

    // Character Selection
    const characters = ['hamster', 'bear', 'frog'];
    const characterContainers = document.querySelectorAll('.character-container');

    // Add click event listeners to character containers
    characterContainers.forEach(container => {
        container.addEventListener('click', () => {
            const character = container.dataset.character;
            if (!container.classList.contains('locked')) {
                selectCharacter(character);
            }
        });
    });

    function selectCharacter(character) {
        const container = document.querySelector(`[data-character="${character}"]`);
        if (!container || container.classList.contains('locked')) {
            return;
        }

        // Remove selected class from all characters
        document.querySelectorAll('.character-container').forEach(container => {
            container.classList.remove('selected');
        });
        
        // Add selected class to clicked character
        container.classList.add('selected');
            
        // Update selected character
        selectedCharacter = character;
        localStorage.setItem('selectedCharacter', character);
            
        // Update mascot display
        document.querySelectorAll('.mascot-container img').forEach(mascot => {
            mascot.classList.remove('active');
            if (mascot.dataset.character === character) {
                mascot.classList.add('active');
            }
        });

        if (currentGame) {
            currentGame.updateCharacter(character);
        }
    }

    function updateCharacterSelectionUI() {
        characterContainers.forEach(container => {
            const character = container.dataset.character;
            const isPurchased = purchasedCharacters.includes(character);
            if (!isPurchased) {
                container.classList.add('locked');
                container.classList.remove('unlocked');
            } else {
                container.classList.remove('locked');
                container.classList.add('unlocked');
            }
        });
    }

    function updateGameCharacter() {
        const gameCharacter = document.querySelector('.game-character');
        if (gameCharacter) {
            gameCharacter.src = `assets/images/${selectedCharacter}.png`;
            gameCharacter.alt = selectedCharacter;
        }
    }

    function handleKeyboardNavigation(e) {
        if (!gameRunning) {
            const containers = Array.from(document.querySelectorAll('.character-container'));
            const unlockedContainers = containers.filter(container => !container.classList.contains('locked'));
            const currentUnlockedIndex = unlockedContainers.findIndex(container => 
                container.dataset.character === selectedCharacter
            );
            
            if (e.key === 'ArrowLeft') {
                const newUnlockedIndex = (currentUnlockedIndex - 1 + unlockedContainers.length) % unlockedContainers.length;
                selectCharacter(unlockedContainers[newUnlockedIndex].dataset.character);
            } else if (e.key === 'ArrowRight') {
                const newUnlockedIndex = (currentUnlockedIndex + 1) % unlockedContainers.length;
                selectCharacter(unlockedContainers[newUnlockedIndex].dataset.character);
            }
        }
    }

    function handleMouseDown(e) {
        if (!gameRunning) {
            isDragging = true;
            startX = e.clientX;
            currentX = startX;
        }
    }

    function handleMouseMove(e) {
        if (isDragging && !gameRunning) {
            currentX = e.clientX;
            const diff = currentX - startX;
            
            if (Math.abs(diff) > 50) {
                const containers = Array.from(document.querySelectorAll('.character-container'));
                const unlockedContainers = containers.filter(container => !container.classList.contains('locked'));
                const currentUnlockedIndex = unlockedContainers.findIndex(container => 
                    container.dataset.character === selectedCharacter
                );
                
                const newUnlockedIndex = diff > 0 
                    ? (currentUnlockedIndex + 1) % unlockedContainers.length 
                    : (currentUnlockedIndex - 1 + unlockedContainers.length) % unlockedContainers.length;
                
                selectCharacter(unlockedContainers[newUnlockedIndex].dataset.character);
                startX = currentX;
            }
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Add drag handlers
    const selector = document.querySelector('.character-selector');
    if (selector) {
        selector.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    // Token class for collectible items
    class Token {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.collected = false;
            this.frameIndex = 0;
            this.frameCount = 8; // Assuming 8 frames in the animation
            this.frameDelay = 5; // Update every 5 game frames
            this.frameCounter = 0;
            this.visible = true;
            this.animationSpeed = 0.4;
        }

        update() {
            // Move token from right to left with game speed
            this.x -= this.game.gameSpeed;
            
            // Update animation frame
            this.frameCounter++;
            if (this.frameCounter >= this.frameDelay) {
                this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                this.frameCounter = 0;
            }
            
            // Check if token is off-screen
            if (this.x + this.width < 0) {
                this.collected = true;
            }
        }

        draw(ctx) {
            if (!this.visible) return;
            
            if (this.game.tokenImage.complete) {
                // Calculate source rectangle for the current frame
                const frameWidth = this.game.tokenImage.width / this.frameCount;
                const frameHeight = this.game.tokenImage.height;
                
                ctx.drawImage(
                    this.game.tokenImage,
                    this.frameIndex * frameWidth, 0, frameWidth, frameHeight,
                    this.x, this.y, this.width, this.height
                );
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(
                    this.x + this.width/2,
                    this.y + this.height/2,
                    this.width/2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    // Collection effect class for token collection animations
    class CollectionEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.alpha = 1;
            this.scale = 1;
            this.lifetime = 60; // Increased from 30 to 60 frames for longer duration
            this.initialY = y; // Store initial Y position
        }

        update() {
            this.y -= 1; // Reduced upward movement speed from 2 to 1
            this.alpha = Math.max(0, this.alpha - 0.02); // Slower fade rate (from 1/30 to 0.02)
            this.scale += 0.02; // Slower scale increase
            this.lifetime--;
            return this.lifetime > 0;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            
            // Add glow effect
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw text with outline for better visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.font = `bold ${24 * this.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeText('+1', this.x, this.y);
            
            // Draw the main text
            ctx.fillStyle = '#FFD700';
            ctx.fillText('+1', this.x, this.y);
            
            ctx.restore();
        }
    }

    // Add ExplosionEffect class
    class ExplosionEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.particles = [];
            this.lifetime = 30; // frames
            this.initialized = false;
        }

        init() {
            // Create explosion particles
            const numParticles = 20;
            for (let i = 0; i < numParticles; i++) {
                const angle = (i / numParticles) * Math.PI * 2;
                const speed = Math.random() * 5 + 3;
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 4 + 2,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 1
                });
            }
            this.initialized = true;
        }

        update() {
            if (!this.initialized) {
                this.init();
            }

            // Update particles
            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= 0.03;
                particle.size *= 0.95;
            });

            // Remove dead particles
            this.particles = this.particles.filter(particle => particle.life > 0);
            
            this.lifetime--;
            return this.lifetime > 0;
        }

        draw(ctx) {
            this.particles.forEach(particle => {
                ctx.save();
                ctx.globalAlpha = particle.life;
                
                // Add glow effect
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                
                // Draw particle
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            });
        }
    }

    // Game Class
    class Game {
        constructor() {
            // Create canvas and get context
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Set initial canvas size
            this.resizeCanvas();
            
            // Load assets
            this.loadAssets();
            
            // Game state
            this.gameSpeed = 5;
            this.maxSpeed = 15; // Maximum speed limit
            this.speedIncreaseInterval = 10000; // Increase speed every 10 seconds
            this.speedIncreaseAmount = 0.5; // How much to increase speed by
            this.lastSpeedIncrease = Date.now(); // Track last speed increase
            this.score = 0;
            this.distance = 0; // Track total distance traveled
            this.scoreMultiplier = 1; // Score multiplier based on speed
            this.isGameOver = false;
            this.combo = 0;
            this.lastTokenCollectTime = 0;
            this.comboTimeout = 2000; // 2 seconds to maintain combo
            this.collectionEffects = [];
            
            // Ground properties
            this.groundHeight = 100;
            this.groundY = this.canvas.height - this.groundHeight;
            
            // Player properties
            this.updatePlayerDimensions();
            
            // Game objects
            this.obstacles = [];
            this.tokens = [];
            this.items = []; // Add items array
            this.explosionEffects = []; // Add explosion effects array
            
            // Store items state
            this.activeItems = {};
            
            // Add item timer tracking
            this.itemTimers = {
                magnet: { active: false, endTime: 0, duration: 20000 }, // 20 seconds
                coffee: { active: false, endTime: 0, duration: 20000 }  // 20 seconds
            };
            
            // Physics
            this.gravity = 0.6;
            this.jumpForce = -15;
            
            // Load sound effects
            this.tokenSound = new Audio('assets/sound/coin.wav');
            this.tokenSound.volume = 0.3;
            
            this.jumpSound = new Audio('assets/sound/jump.wav');
            this.jumpSound.volume = 0.3;
            
            this.gameOverSound = new Audio('assets/sound/game-over.wav');
            this.gameOverSound.volume = 0.3;
            
            this.hitSound = new Audio('assets/sound/hit.wav');
            this.hitSound.volume = 0.3;
            
            // Load item sounds
            this.itemSounds = {
                magnet: new Audio('assets/sound/magnet.mp3'),
                coffee: new Audio('assets/sound/coffee.mp3')
            };
            
            // Set volume for item sounds
            this.itemSounds.magnet.volume = 0.3;
            this.itemSounds.coffee.volume = 0.3;
            
            // Load and setup background music
            this.backgroundMusic = new Audio('assets/music.wav');
            this.backgroundMusic.volume = 0.2;
            this.backgroundMusic.loop = true;
            
            // Initialize audio based on saved settings
            if (!window.audioState.musicEnabled) {
                this.backgroundMusic.pause();
            }
            
            // Bind resize event
            window.addEventListener('resize', () => this.resizeCanvas());
            
            // Bind events
            this.bindEvents();
            
            // Initialize game
            this.init();
            
            // Token properties
            this.tokensCollected = 0;
            this.tokenSpawnInterval = 2000; // Spawn a token every 2 seconds
            this.lastTokenSpawn = 0;
            this.tokenImage = new Image();
            this.tokenImage.src = 'assets/images/GrindCoin.gif';
            
            // Item properties
            this.lastItemSpawn = 0;
            this.itemSpawnInterval = 3000 + Math.random() * 4000; // 3-7 seconds instead of 5-10
            
            // Add theme change observer
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'data-theme') {
                        // Force redraw when theme changes
                        this.draw();
                    }
                });
            });
            
            this.observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
            
            // Add shield duration tracking
            this.shieldStartTime = null;
            this.shieldDuration = 20000; // 20 seconds
            
            // Subscribe to gameState changes
            window.gameState.subscribe((state) => {
                // Update power-up states
                this.updatePowerUpStates(state);
            });
        }

        updatePowerUpStates(state) {
            // Update star power-up state
            if (state.items.Star.active && !this.starActive) {
                this.activateStarEffect();
            } else if (!state.items.Star.active && this.starActive) {
                this.deactivateStarEffect();
            }
        }

        activatePowerUp(type, duration) {
            switch(type) {
                case 'star':
                    window.gameState.setItemActive('Star', true);
                    this.starActive = true;
                    this.starEndTime = Date.now() + (duration * 1000);
                    break;
            }
        }

        deactivatePowerUp(type) {
            switch(type) {
                case 'star':
                    window.gameState.setItemActive('Star', false);
                    this.activeItems.star = false;
                    this.scoreMultiplier = this.originalScoreMultiplier;
                    this.starTrail = [];
                    this.starPowerStartTime = null;
                    this.starPowerDuration = 0;
                    if (this.starPowerTimeout) {
                        clearTimeout(this.starPowerTimeout);
                        this.starPowerTimeout = null;
                    }
                    break;
            }
        }

        loadAssets() {
            // Load character image
            this.characterImage = new Image();
            const selectedCharacter = localStorage.getItem('selectedCharacter') || 'hamster';
            this.characterImage.src = `assets/images/${selectedCharacter}.png`;
            
            // Load token image
            this.tokenImage = new Image();
            this.tokenImage.src = 'assets/images/GrindCoin.gif';
            
            // Load obstacle images
            this.obstacleImages = {
                barrel: new Image(),
                rocks: new Image(),
                spikes: new Image(),
                spikesLarge: new Image(),
                crow: new Image()
            };
            
            // Load store item images
            this.itemImages = {
                magnet: new Image(),
                star: new Image(),
                coffee: new Image()
            };
            
            // Set up error handling for images
            const handleImageError = (imageName) => {
                console.error(`Failed to load ${imageName} image`);
                // Create a colored rectangle as fallback
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 40;
                canvas.height = 40;
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(0, 0, 40, 40);
                this.obstacleImages[imageName].src = canvas.toDataURL();
            };
            
            // Load each obstacle image with error handling
            this.obstacleImages.barrel.onerror = () => handleImageError('barrel');
            this.obstacleImages.rocks.onerror = () => handleImageError('rocks');
            this.obstacleImages.spikes.onerror = () => handleImageError('spikes');
            this.obstacleImages.spikesLarge.onerror = () => handleImageError('spikesLarge');
            this.obstacleImages.crow.onerror = () => handleImageError('crow');
            
            // Load each store item image with error handling
            this.itemImages.magnet.onerror = () => handleImageError('magnet');
            this.itemImages.star.onerror = () => handleImageError('star');
            this.itemImages.coffee.onerror = () => handleImageError('coffee');
            
            // Set image sources
            this.obstacleImages.barrel.src = 'assets/images/barrel.png';
            this.obstacleImages.rocks.src = 'assets/images/rocks.png';
            this.obstacleImages.spikes.src = 'assets/images/trap-spikes.png';
            this.obstacleImages.spikesLarge.src = 'assets/images/trap-spikes-large.png';
            this.obstacleImages.crow.src = 'assets/images/flying_crow.png';
            
            // Set store item image sources
            this.itemImages.magnet.src = 'assets/images/magnet.png';
            this.itemImages.star.src = 'assets/images/star.png';
            this.itemImages.coffee.src = 'assets/images/coffee.png';
            
            // Load sound effects
            this.tokenSound = new Audio('assets/sound/coin.wav');
            this.tokenSound.volume = 0.3;
            
            this.jumpSound = new Audio('assets/sound/jump.wav');
            this.jumpSound.volume = 0.3;
            
            this.gameOverSound = new Audio('assets/sound/game-over.wav');
            this.gameOverSound.volume = 0.3;
            
            this.hitSound = new Audio('assets/sound/hit.wav');
            this.hitSound.volume = 0.3;
            
            // Load item sounds
            this.itemSounds = {
                magnet: new Audio('assets/sound/magnet.mp3'),
                coffee: new Audio('assets/sound/coffee.mp3')
            };
            
            // Set volume for item sounds
            this.itemSounds.magnet.volume = 0.3;
            this.itemSounds.coffee.volume = 0.3;
            
            // Load and setup background music
            this.backgroundMusic = new Audio('assets/music.wav');
            this.backgroundMusic.volume = 0.2; // Set music volume lower than sound effects
            this.backgroundMusic.loop = true; // Make the music loop continuously
        }
        
        resizeCanvas() {
            // Set canvas size to match window size
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            
            // Update ground position
            this.groundHeight = Math.max(100, this.canvas.height * 0.15); // 15% of canvas height
            this.groundY = this.canvas.height - this.groundHeight;
            
            // Update player dimensions after resize
            this.updatePlayerDimensions();
        }
        
        updatePlayerDimensions() {
            const baseWidth = 60;
            const baseHeight = 60;
            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            
            
            // Get selected character for specific adjustments
            const selectedCharacter = localStorage.getItem('selectedCharacter') || 'hamster';
            
            // Character-specific height adjustments
            let heightAdjustment = 0;
            switch(selectedCharacter) {
                case 'bear':
                    heightAdjustment = 15; // Increased adjustment to position Bear exactly on ground
                    break;
                case 'frog':
                    heightAdjustment = -5; // Frog is shorter, can be positioned higher
                    break;
                default: // hamster
                    heightAdjustment = 0;
            }
            
            this.player = {
                x: this.canvas.width * 0.1, // 10% from left
                y: this.groundY - (baseHeight * scale) - (20 * scale) + heightAdjustment, // Adjust Y position based on character
                width: baseWidth * scale,
                height: baseHeight * scale,
                jumping: false,
                velocityY: 0,
                character: selectedCharacter // Store the character type for reference
            };
        }

        init() {
            // Remove any existing canvas
            const existingCanvas = document.querySelector('canvas');
            if (existingCanvas) {
                existingCanvas.remove();
            }
            
            // Reset item timers on initialization
            if (this.itemTimers) {
                this.itemTimers = {
                    magnet: { active: false, endTime: 0, duration: 20000 },
                    coffee: { active: false, endTime: 0, duration: 20000 }
                };
            }
            
            // Add canvas to game container
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.appendChild(this.canvas);
                
                // Start game loops
                this.gameLoop();
                this.spawnObstacles();
                this.spawnTokens();
                this.spawnItems(); // Start item spawning
                
                // Start background music
                if (window.audioState.musicEnabled) {
                    this.backgroundMusic.play();
                }
                
                // Add game-running class to show mini-inventory
                document.body.classList.add('game-running');
                
                // Log initialization
                console.log('Game initialized with canvas size:', this.canvas.width, this.canvas.height);
                console.log('Player position:', this.player);
            } else {
                console.error('Game container not found');
            }
        }
        
        bindEvents() {
            this.keydownHandler = (e) => {
                if (e.code === 'Escape' && !this.isGameOver) {
                    this.togglePause();
                    return;
                }
                
                // Check if game over modal is active
                const gameOverModal = document.querySelector('.game-over-modal');
                if (gameOverModal && gameOverModal.classList.contains('active')) {
                    // Allow restarting the game with space or arrow up when the game over modal is shown
                    if (e.code === 'Space' || e.code === 'ArrowUp') {
                        // Hide game over modal first
                        gameOverModal.classList.remove('active');
                        
                        // Make sure item timers are completely reset
                        if (this.itemTimers) {
                            this.itemTimers = {
                                magnet: { active: false, endTime: 0, duration: 20000 },
                                coffee: { active: false, endTime: 0, duration: 20000 }
                            };
                        }
                        
                        // Reset the game
                        this.resetGame();
                    }
                    return;
                }
                
                if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.player.jumping && !this.isGameOver && !this.isPaused) {
                    this.player.jumping = true;
                    this.player.velocityY = this.jumpForce;
                    // Play jump sound if enabled
                    if (window.audioState.sfxEnabled) {
                        this.jumpSound.currentTime = 0;
                        this.jumpSound.play();
                    }
                }
            };
            
            document.addEventListener('keydown', this.keydownHandler);
        }
        
        update() {
            if (this.isGameOver) return;

            // Update player
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;
            
            // Ground collision - ensure player sits exactly on ground plus the lift
            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            if (this.player.y + this.player.height > this.groundY - (20 * scale)) {
                this.player.y = this.groundY - this.player.height - (20 * scale);
                this.player.jumping = false;
                this.player.velocityY = 0;
            }
            
            // Update obstacles
            this.obstacles.forEach((obstacle, index) => {
                obstacle.x -= this.gameSpeed;
                if (obstacle.x + obstacle.width < 0) {
                    this.obstacles.splice(index, 1);
                }
            });
            
            // Update items
            this.items.forEach((item, index) => {
                item.x -= this.gameSpeed;
                if (item.x + item.width < 0) {
                    this.items.splice(index, 1);
                }
            });
            
            // Update tokens
            this.updateTokens();
            this.checkTokenCollisions();
            
            // Check collisions
            this.checkCollisions();
            this.checkItemCollisions();
            
            // Update distance and score
            this.distance += this.gameSpeed;
            this.scoreMultiplier = 1 + (this.gameSpeed - 5) / 10; // Increases with speed
            this.score = Math.floor(this.distance * this.scoreMultiplier);
            
            // Gradually increase game speed
            const currentTime = Date.now();
            if (currentTime - this.lastSpeedIncrease > this.speedIncreaseInterval) {
                if (this.gameSpeed < this.maxSpeed) {
                    this.gameSpeed += this.speedIncreaseAmount;
                    this.lastSpeedIncrease = currentTime;
                }
            }
            
            this.updateCollectionEffects();
            
            // Check shield expiration
            if (this.activeItems.shield && this.shieldStartTime) {
                const elapsedTime = Date.now() - this.shieldStartTime;
                if (elapsedTime >= this.shieldDuration) {
                    this.shieldEffect.hide();
                    this.activeItems.shield = false;
                    this.shieldStartTime = null;
                }
            }

            // Check power-up timers
            if (this.activeItems.star && Date.now() > this.starEndTime) {
                this.deactivatePowerUp('star');
            }
            
            // Check item timers
            const now = Date.now();
            for (const [type, timer] of Object.entries(this.itemTimers)) {
                if (timer.active && now > timer.endTime) {
                    timer.active = false;
                    console.log(`${type} effect expired`);
                }
            }
        }
        
        checkCollisions() {
            // If coffee item is active, player is invincible
            const isInvincible = this.itemTimers.coffee.active;

            // Check obstacle collisions
            for (let i = this.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.obstacles[i];
                if (this.isColliding(this.player, obstacle)) {
                    if (isInvincible) {
                        // If coffee is active, destroy the obstacle
                        if (window.audioState.sfxEnabled) {
                            this.hitSound.currentTime = 0;
                            this.hitSound.play();
                        }
                        
                        // Create explosion effect at obstacle position
                        const explosionEffect = new ExplosionEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                        this.explosionEffects.push(explosionEffect);
                        
                        // Remove the obstacle
                        this.obstacles.splice(i, 1);
                    } else {
                        // Normal collision - game over
                        if (window.audioState.sfxEnabled) {
                            this.hitSound.currentTime = 0;
                            this.hitSound.play();
                            
                            this.gameOverSound.currentTime = 0;
                            this.gameOverSound.play();
                        }
                        
                        // Stop background music
                        this.backgroundMusic.pause();
                        
                        // Create explosion effect at player position
                        const explosionEffect = new ExplosionEffect(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
                        this.explosionEffects.push(explosionEffect);
                        
                        this.gameOver();
                        return;
                    }
                }
            }

            // Check token collisions
            for (let i = this.tokens.length - 1; i >= 0; i--) {
                const token = this.tokens[i];
                if (this.isColliding(this.player, token)) {
                    // Play sound if enabled
                    if (window.audioState.sfxEnabled) {
                        this.tokenSound.currentTime = 0;
                        this.tokenSound.play();
                    }
                    
                    // Create collection effect
                    this.createCollectionEffect(token.x, token.y);
                    
                    // Update combo
                    const now = Date.now();
                    if (now - this.lastTokenCollectTime < this.comboTimeout) {
                        this.combo++;
                    } else {
                        this.combo = 1;
                    }
                    this.lastTokenCollectTime = now;
                    
                    // Add score with combo multiplier
                    this.score += 50 * this.combo;
                    
                    // Remove collected token
                    this.tokens.splice(i, 1);
                }
            }
        }
        
        isColliding(rect1, rect2) {
            // Add a visual buffer (hitbox reduction) to make collision detection more forgiving
            const bufferX1 = rect1.width * 0.3; // 30% buffer on player width
            const bufferY1 = rect1.height * 0.2; // 20% buffer on player height
            const bufferX2 = rect2.width * 0.2; // 20% buffer on obstacle width
            const bufferY2 = rect2.height * 0.2; // 20% buffer on obstacle height
            
            // Calculate collision boundaries with buffer
            const left1 = rect1.x + bufferX1;
            const right1 = rect1.x + rect1.width - bufferX1;
            const top1 = rect1.y + bufferY1;
            const bottom1 = rect1.y + rect1.height - bufferY1;
            
            const left2 = rect2.x + bufferX2;
            const right2 = rect2.x + rect2.width - bufferX2;
            const top2 = rect2.y + bufferY2;
            const bottom2 = rect2.y + rect2.height - bufferY2;
            
            // Debug collision visualization if needed
            // console.log(`Player: ${left1},${top1} - ${right1},${bottom1}`);
            // console.log(`Obstacle: ${left2},${top2} - ${right2},${bottom2}`);
            
            // Check for collision with buffer zones
            return !(right1 < left2 || 
                     left1 > right2 || 
                     bottom1 < top2 || 
                     top1 > bottom2);
        }
        
        spawnObstacles() {
            if (this.isGameOver) return;

            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            
            // Randomly select an obstacle type
            const obstacleTypes = ['barrel', 'rocks', 'spikes', 'spikesLarge', 'crow'];
            const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            
            // Set dimensions based on obstacle type
            let width, height;
            switch(selectedType) {
                case 'barrel':
                    width = 50 * scale;
                    height = 60 * scale;
                    break;
                case 'rocks':
                    width = 70 * scale;
                    height = 40 * scale;
                    break;
                case 'spikes':
                    width = 50 * scale;
                    height = 30 * scale;
                    break;
                case 'spikesLarge':
                    width = 70 * scale;
                    height = 40 * scale;
                    break;
                case 'crow':
                    width = 45 * scale;
                    height = 30 * scale;
                    break;
                default:
                    width = 50 * scale;
                    height = 50 * scale;
            }
            
            // Position obstacle based on type
            let y;
            if (selectedType === 'crow') {
                y = this.groundY - height - (100 * scale);
            } else {
                y = this.groundY - height - (13 * scale);
            }
            
            const obstacle = {
                x: this.canvas.width,
                y: y,
                width: width,
                height: height,
                type: selectedType
            };
            
            // Check spacing from other obstacles and tokens
            const minSpacing = 400 * scale;
            const bufferZone = 200 * scale; // Buffer zone where tokens won't spawn
            
            // Check if there's enough space from other obstacles
            const tooCloseToObstacle = this.obstacles.some(existingObstacle => 
                obstacle.x - (existingObstacle.x + existingObstacle.width) < minSpacing
            );
            
            // Check if there's enough space from tokens
            const tooCloseToToken = this.tokens.some(token => 
                Math.abs(obstacle.x - token.x) < bufferZone
            );
            
            if (!tooCloseToObstacle && !tooCloseToToken) {
                this.obstacles.push(obstacle);
                
                // Random interval between 2 and 4 seconds
                const interval = 2000 + Math.random() * 2000;
                setTimeout(() => this.spawnObstacles(), interval);
            } else {
                // Try again after a short delay if spacing is insufficient
                setTimeout(() => this.spawnObstacles(), 500);
            }
        }
        
        spawnItems() {
            if (this.isGameOver) return;
            
            // Check if it's time to spawn an item
            const currentTime = Date.now();
            if (currentTime - this.lastItemSpawn > this.itemSpawnInterval) {
                this.spawnItem();
                this.lastItemSpawn = currentTime;
                // Set a new random interval for next item spawn (3-7 seconds)
                this.itemSpawnInterval = 3000 + Math.random() * 4000;
            }
            
            // Schedule the next item spawn check (every half second)
            setTimeout(() => this.spawnItems(), 500);
        }
        
        spawnItem() {
            if (this.isGameOver) return;

            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            const itemTypes = ['magnet', 'coffee']; // Only magnet and coffee items
            const selectedType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            
            // Use the exact same positioning logic as in spawnToken()
            // Calculate spawn position with proper min/max heights
            const minHeight = this.groundY - this.player.height - 100; // Minimum height (ground level)
            const maxHeight = this.groundY - this.player.height - 200; // Maximum height (jumpable)
            const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
            
            const item = {
                x: this.canvas.width,
                y: randomHeight,
                width: 30 * scale,
                height: 30 * scale,
                type: selectedType
            };
            
            // Check spacing from other items - reduced spacing requirement to allow more items
            const tooCloseToItem = this.items.some(existingItem => 
                Math.abs(item.x - existingItem.x) < 150 * scale
            );
            
            if (tooCloseToItem) {
                console.log("Item spawn failed: too close to other item");
                return;
            }
            
            // Stricter check for token spacing - check ALL tokens to prevent any overlap
            const tooCloseToToken = this.tokens.some(token => {
                // Rectangle collision detection to ensure complete separation
                const tokenRight = token.x + token.width;
                const tokenBottom = token.y + token.height;
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                
                // Add extra safety margin around tokens (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles overlap with margin
                return !(
                    itemRight + margin < token.x || 
                    item.x > tokenRight + margin || 
                    itemBottom + margin < token.y || 
                    item.y > tokenBottom + margin
                );
            });
            
            if (tooCloseToToken) {
                console.log("Item spawn failed: would overlap with token");
                return;
            }
            
            // Check if item is too close to any obstacle
            const tooCloseToObstacle = this.obstacles.some(obstacle => 
                Math.abs(item.x - obstacle.x) < 150 * scale
            );
            
            if (tooCloseToObstacle) {
                console.log("Item spawn failed: too close to obstacle");
                return;
            }
            
            this.items.push(item);
            console.log(`Successfully spawned ${selectedType} item at position ${item.x}, ${item.y}`);
        }
        
        checkItemCollisions() {
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                if (this.isColliding(this.player, item)) {
                    // Apply item effect
                    this.applyItemEffect(item.type);
                    
                    // Create collection effect
                    this.createCollectionEffect(item.x, item.y);
                    
                    // Play specific item sound if enabled
                    if (window.audioState.sfxEnabled) {
                        if (this.itemSounds && this.itemSounds[item.type]) {
                            this.itemSounds[item.type].currentTime = 0;
                            this.itemSounds[item.type].play();
                        } else {
                            // Fallback to token sound if item sound not available
                            this.tokenSound.currentTime = 0;
                            this.tokenSound.play();
                        }
                    }
                    
                    // Remove collected item
                    this.items.splice(i, 1);
                }
            }
        }
        
        applyItemEffect(type) {
            const now = Date.now();
            
            // Update item timer
            if (this.itemTimers[type]) {
                if (this.itemTimers[type].active) {
                    // Add time to existing timer (20 seconds)
                    this.itemTimers[type].endTime = this.itemTimers[type].endTime + this.itemTimers[type].duration;
                } else {
                    // Start new timer
                    this.itemTimers[type].active = true;
                    this.itemTimers[type].endTime = now + this.itemTimers[type].duration;
                }
                
                console.log(`${type} effect activated until ${new Date(this.itemTimers[type].endTime).toISOString()}`);
                
                // Play sound effect if enabled
                if (window.audioState.sfxEnabled && this.itemSounds[type]) {
                    this.itemSounds[type].currentTime = 0;
                    this.itemSounds[type].play();
                }
                
                // Apply visual effects based on item type
                if (type === 'magnet') {
                    // Create magnet activation visual effect
                    for (let i = 0; i < 10; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 50 + Math.random() * 50;
                        const x = this.player.x + this.player.width/2 + Math.cos(angle) * distance;
                        const y = this.player.y + this.player.height/2 + Math.sin(angle) * distance;
                        
                        const effect = new CollectionEffect(x, y);
                        effect.color = '#1E90FF'; // Blue color for magnet effect
                        this.collectionEffects.push(effect);
                    }
                } else if (type === 'coffee') {
                    // Create coffee activation visual effect
                    for (let i = 0; i < 15; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = 40 + Math.random() * 40;
                        const x = this.player.x + this.player.width/2 + Math.cos(angle) * distance;
                        const y = this.player.y + this.player.height/2 + Math.sin(angle) * distance;
                        
                        const effect = new CollectionEffect(x, y);
                        effect.color = '#FF8C00'; // Orange color for coffee effect
                        this.collectionEffects.push(effect);
                    }
                }
            }
        }
        
        spawnTokens() {
            if (this.isGameOver) return;

            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            const token = {
                x: this.canvas.width,
                y: this.groundY - (30 * scale) - Math.random() * 100, // Random height above ground
                width: 30 * scale,
                height: 30 * scale
            };
            
            // Check if there's enough space between tokens
            const lastToken = this.tokens[this.tokens.length - 1];
            if (lastToken && token.x - (lastToken.x + lastToken.width) < 200 * scale) {
                // Not enough space, don't spawn this token
                return;
            }
            
            // Check if token is too close to any obstacle
            const tooCloseToObstacle = this.obstacles.some(obstacle => 
                Math.abs(token.x - obstacle.x) < 150 * scale
            );
            
            if (tooCloseToObstacle) {
                // Too close to an obstacle, don't spawn this token
                return;
            }
            
            this.tokens.push(token);
            
            // Random interval between 1 and 2 seconds
            const interval = 1000 + Math.random() * 1000;
            setTimeout(() => this.spawnTokens(), interval);
        }
        
        draw() {
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw background
            this.drawBackground();
            
            // Draw ground
            this.drawGround();
            
            // Draw obstacles
            this.drawObstacles();
            
            // Draw items
            this.drawItems();
            
            // Draw tokens
            this.drawTokens();
            
            // Draw explosion effects
            if (this.explosionEffects) {
                for (let i = this.explosionEffects.length - 1; i >= 0; i--) {
                    const effect = this.explosionEffects[i];
                    const isAlive = effect.update();
                    effect.draw(this.ctx);
                    
                    if (!isAlive) {
                        this.explosionEffects.splice(i, 1);
                    }
                }
            }
            
            // Draw player (after obstacles and tokens to ensure it's on top)
            this.drawPlayer();
            
            // Draw score and speed
            this.drawHUD();
            
            // Draw active items
            this.drawActiveItems();
            
            this.drawCollectionEffects();
            this.drawCombo();
        }
        
        drawBackground() {
            // Sky gradient based on theme
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.groundY);
            if (document.documentElement.getAttribute('data-theme') === 'night') {
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(1, '#16213e');
            } else {
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(1, '#E0F6FF');
            }
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.groundY);

            // Draw stars in night mode
            if (document.documentElement.getAttribute('data-theme') === 'night') {
                this.ctx.save();
                
                // Create star positions only once and store them
                if (!this.starPositions) {
                    this.starPositions = [];
                    for (let i = 0; i < 150; i++) {
                        this.starPositions.push({
                            x: Math.random() * this.canvas.width,
                            y: Math.random() * (this.groundY * 0.8),
                            size: Math.random() * 1.5 + 0.5,
                            opacity: Math.random() * 0.5 + 0.5,
                            twinkleSpeed: Math.random() * 0.02 + 0.01,
                            twinkleOffset: Math.random() * Math.PI * 2
                        });
                    }
                }

                // Draw stars with subtle twinkling effect
                const time = Date.now() * 0.001; // Convert to seconds
                this.starPositions.forEach(star => {
                    // Calculate twinkling effect
                    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.2 + 0.8;
                    const opacity = star.opacity * twinkle;

                    // Draw star with glow effect
                    this.ctx.beginPath();
                    this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    
                    // Add glow effect
                    const gradient = this.ctx.createRadialGradient(
                        star.x, star.y, 0,
                        star.x, star.y, star.size * 2
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.fill();
                });
                
                this.ctx.restore();
            }

            // Draw clouds in day mode
            if (document.documentElement.getAttribute('data-theme') !== 'night') {
                this.ctx.save();
                const cloudPositions = [
                    { x: this.canvas.width * 0.2, y: this.groundY * 0.2, scale: 0.7 },
                    { x: this.canvas.width * 0.4, y: this.groundY * 0.3, scale: 0.8 },
                    { x: this.canvas.width * 0.6, y: this.groundY * 0.15, scale: 0.9 },
                    { x: this.canvas.width * 0.8, y: this.groundY * 0.25, scale: 0.7 }
                ];

                cloudPositions.forEach(cloud => {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    
                    // Draw cloud parts
                    this.ctx.beginPath();
                    this.ctx.arc(cloud.x, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
                    this.ctx.arc(cloud.x + 20 * cloud.scale, cloud.y - 10 * cloud.scale, 25 * cloud.scale, 0, Math.PI * 2);
                    this.ctx.arc(cloud.x + 40 * cloud.scale, cloud.y, 30 * cloud.scale, 0, Math.PI * 2);
                    this.ctx.arc(cloud.x + 20 * cloud.scale, cloud.y + 10 * cloud.scale, 25 * cloud.scale, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                this.ctx.restore();
            }
        }
        
        drawGround() {
            // Ground color based on theme
            if (document.documentElement.getAttribute('data-theme') === 'night') {
                this.ctx.fillStyle = '#2a2a3a';
                this.ctx.fillRect(0, this.groundY, this.canvas.width, this.groundHeight);
                
                // Grass
                this.ctx.fillStyle = '#1a4d1a';
                this.ctx.fillRect(0, this.groundY, this.canvas.width, 5);
            } else {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(0, this.groundY, this.canvas.width, this.groundHeight);
                
                // Grass
                this.ctx.fillStyle = '#4CAF50';
                this.ctx.fillRect(0, this.groundY, this.canvas.width, 5);
            }
        }
        
        drawPlayer() {
            const ctx = this.ctx;
            
            // Draw character shadow
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.ellipse(
                this.player.x + this.player.width/2,
                this.groundY - 5,
                this.player.width * 0.4,
                10,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
            
            ctx.save();
            
            // Apply coffee invincibility effect (yellow/orange glow)
            if (this.itemTimers.coffee.active) {
                ctx.shadowColor = '#FFA500';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Pulsating effect
                const pulseIntensity = Math.sin(Date.now() / 100) * 0.2 + 0.8;
                ctx.globalAlpha = pulseIntensity;
            }
            
            // Check if image is loaded
            if (this.characterImage && this.characterImage.complete) {
                // Draw the character without animation frames (single image)
                ctx.drawImage(
                    this.characterImage,
                    0, 0,                                      // Source position
                    this.characterImage.width, this.characterImage.height, // Source dimensions
                    this.player.x, this.player.y,              // Destination position
                    this.player.width, this.player.height      // Destination dimensions
                );
            } else {
                // Fallback if image not loaded
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(
                    this.player.x,
                    this.player.y,
                    this.player.width,
                    this.player.height
                );
            }
            
            ctx.restore();
            
            // Jumping effect
            if (this.player.jumping) {
                // Draw dust particles when jumping
                this.drawJumpDust();
            }
        }
        
        drawObstacles() {
            this.obstacles.forEach(obstacle => {
                const image = this.obstacleImages[obstacle.type];
                
                if (image && image.complete) {
                    this.ctx.drawImage(
                        image,
                        obstacle.x,
                        obstacle.y,
                        obstacle.width,
                        obstacle.height
                    );
                } else {
                    // Fallback if image not loaded
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(
                        obstacle.x,
                        obstacle.y,
                        obstacle.width,
                        obstacle.height
                    );
                }
            });
        }
        
        drawItems() {
            this.items.forEach(item => {
                const image = this.itemImages[item.type];
                
                if (image && image.complete) {
                    this.ctx.drawImage(
                        image,
                        item.x,
                        item.y,
                        item.width,
                        item.height
                    );
                } else {
                    // Fallback if image not loaded
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(
                        item.x,
                        item.y,
                        item.width,
                        item.height
                    );
                }
            });
        }
        
        drawTokens() {
            // Draw tokens
            this.tokens.forEach(token => token.draw(this.ctx));
            
            // Draw collection effects
            this.collectionEffects.forEach(effect => effect.draw(this.ctx));
        }
        
        drawHUD() {
            const fontSize = Math.min(this.canvas.width / 40, this.canvas.height / 20);
            const spacing = fontSize + 15; // Increased spacing between elements
            this.ctx.save();
            this.ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Draw balance in top left corner
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`$GRIND:${window.gameState.getBalance()}`, 20, 20);
            
            // Reset text alignment for other elements
            this.ctx.textAlign = 'right';
            
            // Draw score with gold color
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - 20, 20);
            
            // Draw speed with cyan color
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillText(`SPEED: ${this.gameSpeed.toFixed(1)}`, this.canvas.width - 20, 20 + spacing);
            
            // Draw active item timers
            let timerOffset = 0;
            const now = Date.now();
            
            // Draw magnet timer if active
            if (this.itemTimers.magnet.active) {
                const remainingTime = Math.max(0, Math.ceil((this.itemTimers.magnet.endTime - now) / 1000));
                const progress = Math.max(0, (this.itemTimers.magnet.endTime - now)) / this.itemTimers.magnet.duration;
                
                // Draw magnet timer with blue color
                this.ctx.fillStyle = '#1E90FF'; // Dodger blue
                this.ctx.fillText(`MAGNET: ${remainingTime}s`, this.canvas.width - 20, 20 + spacing * (2 + timerOffset));
                
                // Draw progress bar
                const barWidth = 100;
                const barHeight = 10;
                const barX = this.canvas.width - barWidth - 20;
                const barY = 20 + spacing * (2 + timerOffset) + fontSize;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress
                this.ctx.fillStyle = '#1E90FF';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                
                timerOffset++;
            }
            
            // Draw coffee timer if active
            if (this.itemTimers.coffee.active) {
                const remainingTime = Math.max(0, Math.ceil((this.itemTimers.coffee.endTime - now) / 1000));
                const progress = Math.max(0, (this.itemTimers.coffee.endTime - now)) / this.itemTimers.coffee.duration;
                
                // Draw coffee timer with orange color
                this.ctx.fillStyle = '#FF8C00'; // Dark orange
                this.ctx.fillText(`INVINCIBLE: ${remainingTime}s`, this.canvas.width - 20, 20 + spacing * (2 + timerOffset));
                
                // Draw progress bar
                const barWidth = 100;
                const barHeight = 10;
                const barX = this.canvas.width - barWidth - 20;
                const barY = 20 + spacing * (2 + timerOffset) + fontSize;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress
                this.ctx.fillStyle = '#FF8C00';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                
                timerOffset++;
            }
            
            // Draw star power duration if active
            if (this.activeItems.star) {
                const remainingTime = Math.ceil((this.starPowerDuration - (Date.now() - this.starPowerStartTime)) / 1000);
                const progress = (this.starPowerDuration - (Date.now() - this.starPowerStartTime)) / this.starPowerDuration;
                
                // Draw star power timer with purple color
                this.ctx.fillStyle = '#FF00FF';
                this.ctx.fillText(`STAR: ${remainingTime}s`, this.canvas.width - 20, 20 + spacing * (2 + timerOffset));
                
                // Draw progress bar
                const barWidth = 100;
                const barHeight = 10;
                const barX = this.canvas.width - barWidth - 20;
                const barY = 20 + spacing * (2 + timerOffset) + fontSize;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress
                this.ctx.fillStyle = '#FF00FF';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                
                timerOffset++;
            }
            
            this.ctx.restore();
        }
        
        gameOver() {
            this.isGameOver = true;
            
            // Reset all active timers
            if (this.itemTimers) {
                Object.values(this.itemTimers).forEach(timer => {
                    timer.active = false;
                    timer.endTime = 0;
                });
            }
            
            // Play game over sound if enabled
            if (window.audioState.sfxEnabled) {
                this.gameOverSound.currentTime = 0;
                this.gameOverSound.play();
            }
            
            // Stop background music
            this.backgroundMusic.pause();
            
            // Hide pause button
            document.querySelector('.pause-btn').style.display = 'none';
            
            // Update high score if needed
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore);
            }
            
            // Show game over modal
            const gameOverModal = document.querySelector('.game-over-modal');
            const scoreElement = gameOverModal.querySelector('#game-over-score');
            const tokensElement = gameOverModal.querySelector('#game-over-tokens');
            
            scoreElement.textContent = this.score;
            tokensElement.textContent = this.tokensCollected;
            
            gameOverModal.classList.add('active');
            
            // Remove game-running class
            document.body.classList.remove('game-running');
        }

        resetGame() {
            // Reset game state
            this.isGameOver = false;
            this.isPaused = false;
            this.score = 0;
            this.gameSpeed = 5;
            this.obstacles = [];
            this.tokens = [];
            this.items = [];
            this.collectionEffects = [];
            this.distance = 0;
            this.scoreMultiplier = 1;
            this.lastSpeedIncrease = Date.now();
            this.lastObstacleSpawn = Date.now();
            this.lastTokenSpawn = Date.now();
            this.combo = 0;
            this.lastTokenCollectTime = 0;
            
            // Reset active items
            this.activeItems = {};
            
            // Reset item timers - ensure they're completely cleared
            this.itemTimers = {
                magnet: { active: false, endTime: 0, duration: 20000 },
                coffee: { active: false, endTime: 0, duration: 20000 }
            };
            
            // Reset player
            this.player.y = this.groundY - this.player.height - (20 * Math.min(this.canvas.width / 800, this.canvas.height / 400));
            this.player.velocityY = 0;
            this.player.jumping = false;
            
            // Show pause button
            document.querySelector('.pause-btn').style.display = 'block';
            
            // Hide balance display
            document.querySelector('.balance-display').style.display = 'none';
            
            // Restart background music if enabled
            if (window.audioState.musicEnabled) {
                this.backgroundMusic.currentTime = 0;
                this.backgroundMusic.play();
            }

            // Restart spawning systems
            this.spawnObstacles();
            this.spawnTokens();
            this.spawnItems();
            
            // Add game-running class
            this.gameContainer.classList.add('game-running');
            
            // Force a game loop update
            this.update();
            this.draw();
            
            // Clear shield timeout
            if (this.shieldTimeout) {
                clearTimeout(this.shieldTimeout);
                this.shieldTimeout = null;
            }
            
            // Reset item spawn timer
            this.lastItemSpawn = Date.now();
            this.itemSpawnInterval = 3000 + Math.random() * 4000; // 3-7 seconds
            
            // Reset item timers
            for (const timer of Object.values(this.itemTimers)) {
                timer.active = false;
                timer.endTime = 0;
            }
        }
        
        gameLoop() {
            if (!this.isPaused) {
                this.update();
                this.draw();
            }
            requestAnimationFrame(() => this.gameLoop());
        }

        createCollectionEffect(x, y) {
            this.collectionEffects.push(new CollectionEffect(x, y));
        }
        
        updateCollectionEffects() {
            for (let i = this.collectionEffects.length - 1; i >= 0; i--) {
                const effect = this.collectionEffects[i];
                effect.update();
                
                if (!effect.update()) {
                    this.collectionEffects.splice(i, 1);
                }
            }
        }
        
        drawCollectionEffects() {
            this.ctx.save();
            this.ctx.textAlign = 'center';
            this.ctx.font = `${20 * this.collectionEffects[0]?.scale || 1}px Arial`;
            
            for (const effect of this.collectionEffects) {
                effect.draw(this.ctx);
            }
            
            this.ctx.restore();
        }
        
        drawCombo() {
            if (this.combo > 1) {
                const now = Date.now();
                if (now - this.lastTokenCollectTime < this.comboTimeout) {
                    this.ctx.save();
                    
                    // Calculate position near the player
                    const comboX = this.player.x + this.player.width / 2;
                    const comboY = this.player.y - 30; // Position above the player
                    
                    // Add glow effect
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowOffsetX = 0;
                    this.ctx.shadowOffsetY = 0;
                    
                    // Draw text with outline for better visibility
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 3;
                    this.ctx.font = 'bold 24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.strokeText(`${this.combo}x COMBO!`, comboX, comboY);
                    
                    // Draw the main text
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.fillText(`${this.combo}x COMBO!`, comboX, comboY);
                    
                    this.ctx.restore();
                } else {
                    this.combo = 0;
                }
            }
        }

        updateTokens() {
            // Spawn new tokens at intervals
            const currentTime = Date.now();
            if (currentTime - this.lastTokenSpawn > this.tokenSpawnInterval) {
                this.spawnToken();
                this.lastTokenSpawn = currentTime;
            }
            
            // Update existing tokens
            for (let i = this.tokens.length - 1; i >= 0; i--) {
                // Apply magnet effect if active
                if (this.itemTimers.magnet.active) {
                    const token = this.tokens[i];
                    // Calculate distance between token and player
                    const dx = (this.player.x + this.player.width/2) - (token.x + token.width/2);
                    const dy = (this.player.y + this.player.height/2) - (token.y + token.height/2);
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    
                    // If token is within magnet range, move it toward player
                    const magnetRange = 200; // Pixels
                    if (distance < magnetRange) {
                        // Calculate movement speed based on distance (faster when closer)
                        const speed = Math.max(this.gameSpeed, 15 - (distance / 20));
                        // Move token toward player
                        token.x += (dx / distance) * speed;
                        token.y += (dy / distance) * speed;
                    } else {
                        // Regular update if not in magnet range
                        token.update();
                    }
                } else {
                    // Regular update if magnet not active
                    this.tokens[i].update();
                }
                
                // Remove tokens that are off-screen or collected
                if (this.tokens[i].collected) {
                    this.tokens.splice(i, 1);
                }
            }
            
            // Update collection effects
            this.collectionEffects = this.collectionEffects.filter(effect => effect.update());
        }
        
        spawnToken() {
            // Calculate spawn position
            const minHeight = this.groundY - this.player.height - 100; // Minimum height (ground level)
            const maxHeight = this.groundY - this.player.height - 200; // Maximum height (jumpable)
            const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
            
            // Check spacing from other tokens and obstacles
            const minSpacing = 200; // Minimum pixels between tokens
            const tooCloseToToken = this.tokens.some(token => 
                Math.abs(this.canvas.width - token.x) < minSpacing
            );
            
            const tooCloseToObstacle = this.obstacles.some(obstacle => 
                Math.abs(this.canvas.width - obstacle.x) < minSpacing
            );
            
            // Check spacing from items - added to prevent token-item overlap
            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            const tooCloseToItem = this.items.some(item => {
                // Rectangle collision detection with safety margin
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                const tokenX = this.canvas.width;
                const tokenY = randomHeight;
                const tokenRight = tokenX + (30 * scale);
                const tokenBottom = tokenY + (30 * scale);
                
                // Add extra safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    tokenRight + margin < item.x || 
                    tokenX > itemRight + margin || 
                    tokenBottom + margin < item.y || 
                    tokenY > itemBottom + margin
                );
            });
            
            if (!tooCloseToToken && !tooCloseToObstacle && !tooCloseToItem) {
                const token = new Token(this, this.canvas.width, randomHeight);
                this.tokens.push(token);
            }
        }
        
        checkTokenCollisions() {
            for (let i = this.tokens.length - 1; i >= 0; i--) {
                const token = this.tokens[i];
                if (this.isColliding(this.player, token)) {
                    // Play token collection sound if enabled
                    if (window.audioState.sfxEnabled) {
                        this.tokenSound.currentTime = 0;
                        this.tokenSound.play();
                    }
                    
                    // Create collection effect
                    this.createCollectionEffect(token.x, token.y);
                    
                    // Update combo
                    const now = Date.now();
                    if (now - this.lastTokenCollectTime < this.comboTimeout) {
                        this.combo++;
                    } else {
                        this.combo = 1;
                    }
                    this.lastTokenCollectTime = now;
                    
                    // Add score with combo multiplier
                    this.score += 50 * this.combo;
                    
                    // Increment tokens collected counter and update global balance
                    this.tokensCollected++;
                    window.gameState.addBalance(1);
                    
                    // Remove collected token
                    this.tokens.splice(i, 1);
                }
            }
        }

        togglePause() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                // Pause the game
                if (window.audioState.musicEnabled) {
                    this.backgroundMusic.pause();
                }
                
                // Show pause overlay and hide pause button
                document.querySelector('.pause-overlay').classList.add('active');
                document.querySelector('.pause-btn').style.display = 'none';
                
                // Update settings toggles
                document.querySelector('#pause-music-toggle').checked = window.audioState.musicEnabled;
                document.querySelector('#pause-sound-toggle').checked = window.audioState.sfxEnabled;
            } else {
                // Resume the game
                if (window.audioState.musicEnabled) {
                    this.backgroundMusic.play();
                }
                
                // Hide pause overlay and show pause button
                document.querySelector('.pause-overlay').classList.remove('active');
                document.querySelector('.pause-btn').style.display = 'block';
                
                // Restart obstacle spawning
                this.spawnObstacles();
            }
        }
        
        resume() {
            if (this.isPaused) {
                this.togglePause();
                // Restart obstacle spawning
                this.spawnObstacles();
            }
        }

        destroy() {
            // Remove event listeners
            document.removeEventListener('keydown', this.keydownHandler);
            
            // Stop audio
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            
            // Clear canvas
            if (this.ctx) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            
            // Remove canvas
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            
            // Hide pause button
            document.querySelector('.pause-btn').style.display = 'none';
            
            // Hide pause overlay
            document.querySelector('.pause-overlay').classList.remove('active');
            
            // Remove game-running class to hide mini-inventory
            document.body.classList.remove('game-running');
            
            // Show start screen and balance display
            document.querySelector('.start-screen').style.display = 'flex';
            document.querySelector('.balance-display').style.display = 'block';
        }

        drawActiveItems() {
            // No active items to draw
        }

        drawJumpDust() {
            const ctx = this.ctx;
            
            // Create dust particle positions at the player's feet
            const dustX = this.player.x + this.player.width / 2;
            const dustY = this.player.y + this.player.height;
            
            // Draw dust particles
            ctx.save();
            ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
            
            // Draw 5 dust particles
            for (let i = 0; i < 5; i++) {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = Math.random() * 10;
                const size = Math.random() * 5 + 2;
                
                ctx.beginPath();
                ctx.arc(
                    dustX + offsetX,
                    dustY - offsetY,
                    size,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            ctx.restore();
        }
    }

    // Start button click handler
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        document.querySelector('.start-screen').style.display = 'none';
        document.querySelector('.settings-container').style.display = 'none';
        document.querySelector('.balance-display').style.display = 'none';
        pauseButton.style.display = 'block';
        gameRunning = true;
        currentGame = new Game();
        currentGame.init();
    });

    // Initialize with default character
    const savedCharacter = localStorage.getItem('selectedCharacter') || 'hamster';
    selectCharacter(savedCharacter);
    updateCharacterSelectionUI();

    // Store functionality
    const storeItems = [
        {
            id: 'bear',
            name: '🐻 Bear',
            price: 500,
            image: 'assets/images/bear.png',
            description: 'A strong and sturdy character'
        },
        {
            id: 'frog',
            name: '🐸 Frog',
            price: 300,
            image: 'assets/images/frog.png',
            description: 'A quick and agile character'
        },
        {
            id: 'speedBoost',
            name: '⚡ Speed Boost',
            price: 200,
            image: 'assets/images/speed-boost.png',
            description: 'Temporarily increases your speed'
        },
        {
            id: 'magnet',
            name: '🧲 Magnet',
            price: 400,
            image: 'assets/images/magnet.png',
            description: 'Attracts nearby coins'
        },
        {
            id: 'extraLife',
            name: '❤️ Extra Life',
            price: 1000,
            image: 'assets/images/extra-life.png',
            description: 'Gives you one extra life'
        }
    ];

    // Initialize store
    function initStore() {
        const storeItemsContainer = document.querySelector('.store-items');
        
        // Clear existing items
        storeItemsContainer.innerHTML = '';
        
        // Add store items
        storeItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'store-item';
            itemElement.dataset.item = item.id;
            
            const isOwned = isItemOwned(item.id);
            
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">${item.price}</p>
                ${isOwned ? '<span class="owned-label">Owned</span>' : 
                           `<button class="buy-button" ${balance < item.price ? 'disabled' : ''}>
                                Buy
                            </button>`}
            `;
            
            if (!isOwned) {
                const buyButton = itemElement.querySelector('.buy-button');
                buyButton.addEventListener('click', () => purchaseItem(item));
            }
            
            storeItemsContainer.appendChild(itemElement);
        });
    }

    // Check if an item is owned
    function isItemOwned(itemId) {
        // In a real implementation, this would check against a database or local storage
        const ownedItems = JSON.parse(localStorage.getItem('ownedItems') || '[]');
        return ownedItems.includes(itemId);
    }

    // Purchase an item
    function purchaseItem(item) {
        const currentBalance = window.gameState.getBalance();
        if (currentBalance >= item.price) {
            window.gameState.updateBalance(currentBalance - item.price);
            
            // Save the purchased item
            const ownedItems = JSON.parse(localStorage.getItem('ownedItems') || '[]');
            ownedItems.push(item.id);
            localStorage.setItem('ownedItems', JSON.stringify(ownedItems));
            
            // Update displays
            updateBalanceDisplay();
            initStore();
            
            // Show success message
            showMessage(`Successfully purchased ${item.name}!`, 'success');
        } else {
            showMessage('Not enough $GRIND!', 'error');
        }
    }

    // Show message
    function showMessage(text, type = 'success') {
        // Remove any existing message first
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Initialize store when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        initStore();
    });

    // Initialize character selection
    function initCharacterSelection() {
        const characters = ['hamster', 'bear', 'frog'];
        const characterSelector = document.querySelector('.character-selector');
        
        characters.forEach(character => {
            const container = document.createElement('div');
            container.className = 'character-container';
            container.dataset.character = character;
            
            // Check if character is owned in store
            const isOwned = window.store && window.store.items.find(item => 
                item.type === 'character' && 
                item.characterId === character && 
                item.owned
            );
            
            if (!isOwned && character !== 'hamster') {
                container.classList.add('locked');
            }
            
            const logo = document.createElement('img');
            logo.src = `assets/images/${character}.png`;
            logo.alt = character;
            logo.className = 'character-logo';
            
            const name = document.createElement('div');
            name.className = 'character-name';
            name.textContent = character.charAt(0).toUpperCase() + character.slice(1);
            
            container.appendChild(logo);
            container.appendChild(name);
            characterSelector.appendChild(container);
            
            container.addEventListener('click', () => {
                if (!container.classList.contains('locked')) {
                    selectCharacter(character);
                }
            });
        });
    }

    pauseShopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Hide pause overlay first
        document.querySelector('.pause-overlay').classList.remove('active');
        // Then show shop modal
        showModal('shop-modal');
    });

    pauseHowToPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Hide pause overlay first
        document.querySelector('.pause-overlay').classList.remove('active');
        // Then show how to play modal
        showModal('howToPlayModal');
    });

    pauseLeaderboardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Show coming soon message
        showMessage('Leaderboard feature coming soon!', 'info');
    });

    pauseWalletBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Show coming soon message
        showMessage('Wallet connection feature coming soon!', 'info');
    });

    // Create game over modal
    const gameOverModal = document.createElement('div');
    gameOverModal.className = 'game-over-modal';
    gameOverModal.innerHTML = `
        <div class="game-over-content">
            <h2>Game Over</h2>
            <div class="game-over-stats">
                <p class="final-score">Score: <span id="game-over-score">0</span></p>
                <p class="tokens-collected">Tokens: <span id="game-over-tokens">0</span></p>
            </div>
            <div class="game-over-buttons">
                <button class="game-over-restart-btn">Restart</button>
                <button class="game-over-home-btn">Home Page</button>
            </div>
            <p class="restart-hint">Press <span class="key">SPACE</span> or <span class="key">↑</span> to restart</p>
        </div>
    `;
    document.body.appendChild(gameOverModal);

    // Add event listeners for game over buttons
    const gameOverRestartBtn = gameOverModal.querySelector('.game-over-restart-btn');
    const gameOverHomeBtn = gameOverModal.querySelector('.game-over-home-btn');

    gameOverRestartBtn.addEventListener('click', () => {
        if (currentGame) {
            // Hide game over modal first
            gameOverModal.classList.remove('active');
            
            // Make sure item timers are completely reset
            if (currentGame.itemTimers) {
                currentGame.itemTimers = {
                    magnet: { active: false, endTime: 0, duration: 20000 },
                    coffee: { active: false, endTime: 0, duration: 20000 }
                };
            }
            
            // Reset the game
            currentGame.resetGame();
        }
    });

    gameOverHomeBtn.addEventListener('click', () => {
        if (currentGame) {
            currentGame.destroy();
            currentGame = null;
            gameRunning = false;
            gameOverModal.classList.remove('active');
            document.querySelector('.start-screen').style.display = 'flex';
            document.querySelector('.settings-container').style.display = 'flex';
        }
    });
});

function createBackground() {
    const gameContainer = document.querySelector('.game-container');
    
    // Add grass
    const grass = document.createElement('div');
    grass.className = 'grass';
    gameContainer.appendChild(grass);
    
    // Add sun
    const sun = document.createElement('div');
    sun.className = 'sun';
    gameContainer.appendChild(sun);
    
    // Create pine trees
    const numTrees = 4;
    const treePositions = [
        { left: 10, scale: 0.7 },
        { left: 30, scale: 0.8 },
        { left: 70, scale: 0.9 },
        { left: 90, scale: 0.7 }
    ];
    
    for (let i = 0; i < numTrees; i++) {
        const tree = document.createElement('div');
        tree.className = 'tree';
        tree.style.left = `${treePositions[i].left}%`;
        tree.style.transform = `scale(${treePositions[i].scale})`;
        gameContainer.appendChild(tree);
    }
    
    createClouds();
}

function createClouds() {
    const gameContainer = document.querySelector('.game-container');
    const numClouds = 7;
    
    const safeZones = [
        { left: 5, right: 15, top: 0, bottom: 40 },
        { left: 25, right: 35, top: 0, bottom: 40 },
        { left: 65, right: 75, top: 0, bottom: 40 },
        { left: 85, right: 95, top: 0, bottom: 40 },
        { left: 30, right: 70, top: 0, bottom: 60 }
    ];
    
    const cloudZones = [
        { left: 0, right: 20, top: 5, bottom: 15 },
        { left: 20, right: 30, top: 8, bottom: 18 },
        { left: 70, right: 80, top: 8, bottom: 18 },
        { left: 80, right: 100, top: 5, bottom: 15 },
        { left: 0, right: 25, top: 15, bottom: 25 },
        { left: 75, right: 100, top: 15, bottom: 25 },
        { left: 0, right: 100, top: 0, bottom: 5 }
    ];
    
    for (let i = 0; i < numClouds; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        const zone = cloudZones[i % cloudZones.length];
        let left = Math.random() * (zone.right - zone.left) + zone.left;
        let top = Math.random() * (zone.bottom - zone.top) + zone.top;
        
        const overlaps = safeZones.some(zone => 
            left >= zone.left && left <= zone.right && 
            top >= zone.top && top <= zone.bottom
        );
        
        if (overlaps) {
            top = Math.min(zone.top, 5);
            left = left < 50 ? Math.max(zone.left, 0) : Math.min(zone.right, 100);
        }
        
        const size = Math.random() * 40 + 30;
        const speed = Math.random() * 2 + 1;
        const scale = Math.random() * 0.2 + 0.3;
        
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size * 0.6}px`;
        cloud.style.left = `${left}%`;
        cloud.style.top = `${top}%`;
        cloud.style.transform = `scale(${scale})`;
        
        const parts = [
            { className: 'cloud-part-1', size: 1.0 },
            { className: 'cloud-part-2', size: 0.7 },
            { className: 'cloud-part-3', size: 0.6 },
            { className: 'cloud-part-4', size: 0.5 },
            { className: 'cloud-part-5', size: 0.4 }
        ];
        
        parts.forEach(part => {
            const cloudPart = document.createElement('div');
            cloudPart.className = `cloud-part ${part.className}`;
            cloud.appendChild(cloudPart);
        });
        
        const shadow = document.createElement('div');
        shadow.className = 'cloud-shadow';
        cloud.appendChild(shadow);
        
        cloud.style.animation = `float ${speed}s ease-in-out infinite`;
        
        gameContainer.appendChild(cloud);
    }
}

// Theme switching functionality
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeEmoji = document.querySelector('.theme-emoji');
    const savedTheme = localStorage.getItem('theme') || 'day';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'night';
    themeEmoji.textContent = savedTheme === 'night' ? '🌙' : '☀️';
    
    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'night' : 'day';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeEmoji.textContent = newTheme === 'night' ? '🌙' : '☀️';
    });
}

// Create stars for night mode
function createStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars';
    document.querySelector('.game-container').appendChild(starsContainer);
    
    // Create 100 stars
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3;
        
        // Random animation delay
        const delay = Math.random() * 2;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Theme switching functionality
initTheme();

// Initialize game when window loads
window.addEventListener('load', () => {
    // Create game instance
    const game = new Game();
    
    // Log initialization
    console.log('Game instance created');
}); 



