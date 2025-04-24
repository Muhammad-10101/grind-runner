document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Create background elements
    createBackground();
    
    // Game state
    window.currentGame = null; // Make currentGame globally accessible
    let selectedCharacter = 'hamster';
    let gameRunning = false;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;
    
    // Initialize purchased characters from localStorage
    let purchasedCharacters = JSON.parse(localStorage.getItem('purchasedCharacters')) || ['hamster'];
    localStorage.setItem('purchasedCharacters', JSON.stringify(purchasedCharacters));
    
    // Initialize profile data if not present
    initializeProfileData();
    
    // Audio state
    window.audioState = {
        musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
        sfxEnabled: localStorage.getItem('sfxEnabled') !== 'false'
    };
    
    // Get all modal elements
    const howToPlayModal = document.getElementById('howToPlayModal');
    const settingsModal = document.getElementById('settingsModal');
    const storeModal = document.querySelector('.store-modal');
    const inventoryModal = document.querySelector('.inventory-modal');
    const profileModal = document.getElementById('profileModal');
    
    // Get all button elements
    const startButton = document.querySelector('.start-button');
    const walletButton = document.querySelector('.wallet-button');
    const howToPlayBtn = document.querySelector('.how-to-play-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const profileBtn = document.querySelector('.profile-btn');
    const storeButton = document.querySelector('.shop-button');
    const inventoryButton = document.querySelector('.inventory-button');
    
    // Make sure we get all close buttons, including our new edit username modal's close button
    const closeButtons = document.querySelectorAll('.close-btn, .close-button');
    
    // Create pause overlay
    const pauseOverlay = document.createElement('div');
    pauseOverlay.className = 'pause-overlay';
    pauseOverlay.innerHTML = `
        <div class="pause-content">
            <h2>Game Paused</h2>
            <div class="pause-buttons">
                <button class="resume-btn">Resume</button>
                <button class="restart-btn">Restart</button>
                <button class="pause-settings-btn">Settings</button>
                <div class="pause-settings-panel">
                    <div class="settings-option">
                        <label for="pause-music-toggle">Music</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-music-toggle" ${window.audioState.musicEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="settings-option">
                        <label for="pause-sfx-toggle">Sound Effects</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-sfx-toggle" ${window.audioState.sfxEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                    <div class="settings-option">
                        <label for="pause-theme-toggle">Day/Night Mode</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="pause-theme-toggle" ${localStorage.getItem('theme') === 'night' ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>
                </div>
                <button class="shop-btn">Shop</button>
                <button class="howtoplay-btn">How to Play</button>
                <button class="leaderboard-btn">Leaderboard</button>
                <button class="main-menu-btn">Return to Home Page</button>
            </div>
        </div>
    `;
    document.body.appendChild(pauseOverlay);
    
    // Add click event listener to close pause overlay when clicking outside the content
    pauseOverlay.addEventListener('click', (e) => {
        const pauseContent = pauseOverlay.querySelector('.pause-content');
        // Only close if clicking directly on the overlay background (not its contents)
        if (e.target === pauseOverlay) {
            console.log('Clicked outside pause content, resuming game');
            // Resume the game if it exists and is paused
            if (window.currentGame && window.currentGame.isPaused) {
                window.currentGame.resume();
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
        if (window.currentGame && gameRunning) {
            window.currentGame.togglePause();
        }
    });
    
    // Pause overlay button event listeners
    const resumeBtn = pauseOverlay.querySelector('.resume-btn');
    const restartBtn = pauseOverlay.querySelector('.restart-btn');
    const mainMenuBtn = pauseOverlay.querySelector('.main-menu-btn');
    const leaderboardBtn = pauseOverlay.querySelector('.leaderboard-btn');
    const shopBtn = pauseOverlay.querySelector('.shop-btn');
    const pauseHowToPlayBtn = pauseOverlay.querySelector('.howtoplay-btn');
    const pauseSettingsBtn = pauseOverlay.querySelector('.pause-settings-btn');
    const pauseMusicToggle = pauseOverlay.querySelector('#pause-music-toggle');
    const pauseSfxToggle = pauseOverlay.querySelector('#pause-sfx-toggle');
    const pauseThemeToggle = pauseOverlay.querySelector('#pause-theme-toggle');
    
    // Get parent elements for better click handling
    const musicSettingOption = pauseOverlay.querySelector('.settings-option:nth-child(1)');
    const sfxSettingOption = pauseOverlay.querySelector('.settings-option:nth-child(2)');
    const themeSettingOption = pauseOverlay.querySelector('.settings-option:nth-child(3)');
    
    resumeBtn.addEventListener('click', () => {
        if (window.currentGame) {
            window.currentGame.resume();
        }
    });
    
    restartBtn.addEventListener('click', () => {
        if (window.currentGame) {
            // Hide pause overlay
            document.querySelector('.pause-overlay').classList.remove('active');
            // Reset the game
            window.currentGame.resetGame();
            // Ensure game is not paused and resume
            window.currentGame.isPaused = false;
            if (window.audioState.musicEnabled) {
                window.currentGame.backgroundMusic.currentTime = 0;
                window.currentGame.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
            }
            // Restart obstacle spawning
            window.currentGame.spawnObstacles();
        }
    });
    
    mainMenuBtn.addEventListener('click', () => {
        if (window.currentGame) {
            window.currentGame.destroy();
            window.currentGame = null;
            gameRunning = false;
            document.body.classList.remove('game-running');
            document.querySelector('.start-screen').style.display = 'flex';
            document.querySelector('.settings-container').style.display = 'flex';
            pauseButton.style.display = 'none';
        }
    });
    
    // Add event listeners for new pause buttons
    leaderboardBtn.addEventListener('click', () => {
        console.log('Leaderboard button clicked');
        // Show coming soon message
        showMessage('Leaderboard feature coming soon!', 'info');
    });
    
    shopBtn.addEventListener('click', () => {
        console.log('Shop button clicked');
        // Hide pause overlay before showing the shop modal
        document.querySelector('.pause-overlay').classList.remove('active');
        // Open shop modal
        showModal('shop-modal');
        
        // Mark the modal as coming from the pause screen
        const shopModal = document.querySelector('.shop-modal');
        if (shopModal) {
            shopModal.classList.add('from-paused-game');
        }
    });
    
    pauseHowToPlayBtn.addEventListener('click', () => {
        console.log('How to Play button clicked');
        // Hide pause overlay before showing the how to play modal
        document.querySelector('.pause-overlay').classList.remove('active');
        // Open how to play modal
        showModal('howToPlayModal');
        
        // Mark the modal as coming from the pause screen
        const howToPlayModal = document.getElementById('howToPlayModal');
        if (howToPlayModal) {
            howToPlayModal.classList.add('from-paused-game');
        }
    });
    
    pauseSettingsBtn.addEventListener('click', () => {
        const settingsPanel = pauseOverlay.querySelector('.pause-settings-panel');
        settingsPanel.classList.toggle('active');
    });
    
    // NEW APPROACH: Add click handlers to the entire setting option sections
    // Music setting click handler
    musicSettingOption.addEventListener('click', function(e) {
        console.log('Music setting clicked');
        // Toggle the checkbox
        pauseMusicToggle.checked = !pauseMusicToggle.checked;
        // Update the state
        window.audioState.musicEnabled = pauseMusicToggle.checked;
        localStorage.setItem('musicEnabled', pauseMusicToggle.checked);
        
        // Only play/pause music if we're in the game
        if (window.currentGame && gameRunning) {
            if (pauseMusicToggle.checked) {
                window.currentGame.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
            } else {
                window.currentGame.backgroundMusic.pause();
            }
        }
        
        // Update main menu music toggle
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.checked = pauseMusicToggle.checked;
        }
    });
    
    // Sound effects setting click handler
    sfxSettingOption.addEventListener('click', function(e) {
        console.log('SFX setting clicked');
        // Toggle the checkbox
        pauseSfxToggle.checked = !pauseSfxToggle.checked;
        // Update the state
        window.audioState.sfxEnabled = pauseSfxToggle.checked;
        localStorage.setItem('sfxEnabled', pauseSfxToggle.checked);
        
        // The actual playing of sounds is handled during game events
        if (window.currentGame && gameRunning) {
            // If sfx are disabled, pause all currently playing sounds
            if (!pauseSfxToggle.checked) {
                window.currentGame.tokenSound.pause();
                window.currentGame.jumpSound.pause();
                window.currentGame.hitSound.pause();
            }
        }
        
        // Update main menu sound toggle
        const sfxToggle = document.getElementById('sfx-toggle');
        if (sfxToggle) {
            sfxToggle.checked = pauseSfxToggle.checked;
        }
    });
    
    // Theme setting click handler
    themeSettingOption.addEventListener('click', function(e) {
        console.log('Theme setting clicked');
        // Toggle the checkbox
        pauseThemeToggle.checked = !pauseThemeToggle.checked;
        // Apply the theme change
        const newTheme = pauseThemeToggle.checked ? 'night' : 'day';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme emoji if exists
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
    
    // Prevent input click events from bubbling to the parent
    pauseMusicToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Update audio state based on checkbox state
        window.audioState.musicEnabled = pauseMusicToggle.checked;
        localStorage.setItem('musicEnabled', pauseMusicToggle.checked);
        
        // Only play/pause music if we're in the game
        if (currentGame && gameRunning) {
            if (pauseMusicToggle.checked) {
                currentGame.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
            } else {
                currentGame.backgroundMusic.pause();
            }
        }
        
        // Update main menu music toggle
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.checked = pauseMusicToggle.checked;
        }
    });
    
    pauseSfxToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Update audio state based on checkbox state
        window.audioState.sfxEnabled = pauseSfxToggle.checked;
        localStorage.setItem('sfxEnabled', pauseSfxToggle.checked);
        
        // Update main menu sound toggle
        const sfxToggle = document.getElementById('sfx-toggle');
        if (sfxToggle) {
            sfxToggle.checked = pauseSfxToggle.checked;
        }
    });
    
    pauseThemeToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Update theme based on checkbox state
        const newTheme = pauseThemeToggle.checked ? 'night' : 'day';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme emoji if exists
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

    // Modal event listeners
    function showModal(modalId) {
        console.log(`Showing modal: ${modalId}`);
        const modal = document.getElementById(modalId) || document.querySelector(`.${modalId}`);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    }

    function hideModal(modalId) {
        console.log(`Hiding modal: ${modalId}`);
        const modal = document.getElementById(modalId) || document.querySelector(`.${modalId}`);
        if (modal) {
            modal.classList.remove('active');
            
            // If this modal was opened from a paused game, show the pause overlay IMMEDIATELY
            // instead of waiting for the animation to complete
            if (modal.classList.contains('from-paused-game')) {
                modal.classList.remove('from-paused-game');
                // Show pause overlay immediately without delay
                const pauseOverlay = document.querySelector('.pause-overlay');
                if (pauseOverlay) {
                    pauseOverlay.classList.add('active');
                }
            }
            setTimeout(() => {
                modal.style.display = 'none';
                // If this modal was opened from a paused game, show the pause overlay again
                if (modal.classList.contains('from-paused-game')) {
                    modal.classList.remove('from-paused-game');
                    // Show pause overlay instead of resuming the game
                    const pauseOverlay = document.querySelector('.pause-overlay');
                    if (pauseOverlay) {
                        pauseOverlay.classList.add('active');
                    }
                }
            }, 300);
        }
    }

    // Button click handlers
    howToPlayBtn.addEventListener('click', () => {
        console.log('How to Play button clicked');
        showModal('howToPlayModal');
    });

    settingsBtn.addEventListener('click', () => {
        showModal('settingsModal');
    });
    
    profileBtn.addEventListener('click', () => {
        // Load the latest profile data
        loadProfileData();
        // Show the profile modal
        showModal('profileModal');
    });

    storeButton.addEventListener('click', () => {
        console.log('Store button clicked');
        showModal('shop-modal');
    });

    inventoryButton.addEventListener('click', () => {
        console.log('Inventory button clicked');
        const inventoryModal = document.querySelector('.inventory-modal');
        inventoryModal.style.display = 'flex';
        setTimeout(() => {
            inventoryModal.classList.add('active');
        }, 10);
    });

    // Close button handlers
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = button.closest('.modal, .shop-modal, .inventory-modal');
            if (modal) {
                hideModal(modal.id || modal.classList[0]);
            }
        });
    });

    // Add specific handler for profile close button
    const profileCloseBtn = document.getElementById('profile-close-btn');
    if (profileCloseBtn) {
        profileCloseBtn.addEventListener('click', () => {
            hideModal('profileModal');
        });
    }

    // Click outside modal to close
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal') || 
            event.target.classList.contains('shop-modal') || 
            event.target.classList.contains('inventory-modal')) {
            hideModal(event.target.id);
        }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active, .shop-modal.active, .inventory-modal.active').forEach(modal => {
                hideModal(modal.id);
            });
        }
    });

    // Settings toggles
    const musicToggle = document.getElementById('music-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');
    const musicOption = document.getElementById('music-option');
    const sfxOption = document.getElementById('sfx-option');

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

    // Add direct handlers for the whole option rows
    if (musicOption) {
        musicOption.onclick = function() {
            console.log("Music option clicked");
            musicToggle.checked = !musicToggle.checked;
            window.audioState.musicEnabled = musicToggle.checked;
            localStorage.setItem('musicEnabled', musicToggle.checked);
            
            // Only play/pause music if we're in the game
            if (currentGame && gameRunning) {
                if (musicToggle.checked) {
                    currentGame.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
                } else {
                    currentGame.backgroundMusic.pause();
                }
            }
            
            // Update pause menu music toggle
            const pauseMusicToggle = document.querySelector('#pause-music-toggle');
            if (pauseMusicToggle) {
                pauseMusicToggle.checked = musicToggle.checked;
            }
        };
    }
    
    if (sfxOption) {
        sfxOption.onclick = function() {
            console.log("SFX option clicked");
            sfxToggle.checked = !sfxToggle.checked;
            window.audioState.sfxEnabled = sfxToggle.checked;
            localStorage.setItem('sfxEnabled', sfxToggle.checked);
            
            // Update pause menu sound toggle
            const pauseSfxToggle = document.querySelector('#pause-sfx-toggle');
            if (pauseSfxToggle) {
                pauseSfxToggle.checked = sfxToggle.checked;
            }
        };
    }
    
    // Stop propagation on the toggles themselves to prevent double-toggling
    if (musicToggle) {
        musicToggle.onclick = function(e) {
            e.stopPropagation();
            console.log("Direct music toggle clicked");
            window.audioState.musicEnabled = musicToggle.checked;
            localStorage.setItem('musicEnabled', musicToggle.checked);
            
            // Only play/pause music if we're in the game
            if (currentGame && gameRunning) {
                if (musicToggle.checked) {
                    currentGame.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
                } else {
                    currentGame.backgroundMusic.pause();
                }
            }
            
            // Update pause menu music toggle
            const pauseMusicToggle = document.querySelector('#pause-music-toggle');
            if (pauseMusicToggle) {
                pauseMusicToggle.checked = musicToggle.checked;
            }
        };
    }
    
    if (sfxToggle) {
        sfxToggle.onclick = function(e) {
            e.stopPropagation();
            console.log("Direct SFX toggle clicked");
            window.audioState.sfxEnabled = sfxToggle.checked;
            localStorage.setItem('sfxEnabled', sfxToggle.checked);
            
            // Update pause menu sound toggle
            const pauseSfxToggle = document.querySelector('#pause-sfx-toggle');
            if (pauseSfxToggle) {
                pauseSfxToggle.checked = sfxToggle.checked;
            }
        };
    }

    // Character Selection
    const characters = ['hamster', 'bear', 'frog'];
    const characterContainers = document.querySelectorAll('.character-container');

    // Add click event listeners to character containers
    characterContainers.forEach(container => {
        // Add pointer cursor style to all character containers, especially locked ones
        container.style.cursor = 'pointer';
        
        container.addEventListener('click', () => {
            const character = container.dataset.character;
            if (container.classList.contains('locked')) {
                showMessage('This character is locked!', 'warning');
            } else {
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
        
        // Update gameState if available
        if (window.gameState) {
            window.gameState.state.selectedCharacter = character;
            window.gameState.saveState();
        }
            
        // Update mascot display
        document.querySelectorAll('.mascot-container img').forEach(mascot => {
            mascot.classList.remove('active');
            if (mascot.dataset.character === character) {
                mascot.classList.add('active');
            }
        });

        // Update the character display text if it exists
        const characterDisplay = document.querySelector('.selected-character-display');
        if (characterDisplay) {
            characterDisplay.textContent = `Playing as: ${character.charAt(0).toUpperCase() + character.slice(1)}`;
        }

        if (currentGame) {
            currentGame.updateCharacter(character);
        }
    }

    function updateCharacterSelectionUI() {
        characterContainers.forEach(container => {
            const character = container.dataset.character;
            const isUnlocked = window.gameState && 
                               window.gameState.getCharacters().includes(character);
            
            if (!isUnlocked) {
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
            this.attracted = false; // For magnet effect
        }

        update() {
            // Move token from right to left
            this.x -= this.game.gameSpeed;
            
            // If magnet is active, move toward player
            if (this.game.activeItems.magnet && !this.attracted) {
                const playerCenterX = this.game.player.x + this.game.player.width / 2;
                const playerCenterY = this.game.player.y + this.game.player.height / 2;
                const tokenCenterX = this.x + this.width / 2;
                const tokenCenterY = this.y + this.height / 2;
                
                // Calculate direction to player
                const dx = playerCenterX - tokenCenterX;
                const dy = playerCenterY - tokenCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only attract if within magnet range (300 pixels)
                if (distance < 300) {
                    this.attracted = true;
                }
            }
            
            // If attracted, move toward player
            if (this.attracted) {
                const playerCenterX = this.game.player.x + this.game.player.width / 2;
                const playerCenterY = this.game.player.y + this.game.player.height / 2;
                const tokenCenterX = this.x + this.width / 2;
                const tokenCenterY = this.y + this.height / 2;
                
                // Calculate direction to player
                const dx = playerCenterX - tokenCenterX;
                const dy = playerCenterY - tokenCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize direction
                const vx = dx / distance;
                const vy = dy / distance;
                
                // Move toward player with magnet speed (faster than game speed)
                this.x += vx * (this.game.gameSpeed * 2);
                this.y += vy * (this.game.gameSpeed * 2);
            }
            
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
                
                // Add glow effect when attracted
                if (this.attracted) {
                    ctx.save();
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                }
                
                ctx.drawImage(
                    this.game.tokenImage,
                    this.frameIndex * frameWidth, 0, frameWidth, frameHeight,
                    this.x, this.y, this.width, this.height
                );
                
                if (this.attracted) {
                    ctx.restore();
                }
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

    // Coffee collection effect with brewing flames and steam particles
    class CoffeeCollectionEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.lifetime = 80; // Longer lifetime for more visible effect
            this.particles = [];
            this.flames = [];
            this.steamParticles = [];
            this.text = "COFFEE!";
            this.textAlpha = 1;
            this.textScale = 1;
            
            // Initialize particles
            this.initParticles();
        }
        
        initParticles() {
            // Create coffee brewing flame particles
            for (let i = 0; i < 15; i++) {
                const flameSize = 3 + Math.random() * 7;
                this.flames.push({
                    x: this.x + (-20 + Math.random() * 40),
                    y: this.y + 10,
                    vx: -0.5 + Math.random() * 1,
                    vy: -2 - Math.random() * 3,
                    size: flameSize,
                    alpha: 0.7 + Math.random() * 0.3,
                    color: Math.random() > 0.6 ? 
                        'rgba(255, 140, 0, 0.8)' : // Orange
                        (Math.random() > 0.5 ? 'rgba(255, 69, 0, 0.8)' : 'rgba(255, 215, 0, 0.8)') // Red-orange or Gold
                });
            }
            
            // Create steam particles
            for (let i = 0; i < 10; i++) {
                const steamSize = 2 + Math.random() * 5;
                this.steamParticles.push({
                    x: this.x + (-10 + Math.random() * 20),
                    y: this.y - 10 - Math.random() * 10,
                    vx: -0.3 + Math.random() * 0.6,
                    vy: -1 - Math.random() * 1.5,
                    size: steamSize,
                    alpha: 0.5 + Math.random() * 0.3,
                    growRate: 0.05 + Math.random() * 0.05
                });
            }
            
            // Create coffee splash particles
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                const size = 1 + Math.random() * 3;
                
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2, // Add some upward velocity
                    size: size,
                    alpha: 0.7 + Math.random() * 0.3,
                    color: Math.random() > 0.3 ? 
                        'rgba(101, 67, 33, 0.8)' : // Dark brown
                        (Math.random() > 0.5 ? 'rgba(139, 69, 19, 0.8)' : 'rgba(160, 82, 45, 0.8)') // Brown variants
                });
            }
        }
        
        update() {
            // Update text
            this.textAlpha = Math.max(0, this.textAlpha - 0.015);
            this.textScale += 0.03;
            
            // Update flame particles
            for (let i = this.flames.length - 1; i >= 0; i--) {
                const flame = this.flames[i];
                
                flame.x += flame.vx;
                flame.y += flame.vy;
                flame.vy -= 0.05; // Accelerate upward
                flame.alpha -= 0.015;
                flame.size -= 0.1;
                
                if (flame.alpha <= 0 || flame.size <= 0) {
                    this.flames.splice(i, 1);
                }
            }
            
            // Update steam particles
            for (let i = this.steamParticles.length - 1; i >= 0; i--) {
                const steam = this.steamParticles[i];
                
                steam.x += steam.vx;
                steam.y += steam.vy;
                steam.alpha -= 0.01;
                steam.size += steam.growRate; // Steam expands as it rises
                
                if (steam.alpha <= 0) {
                    this.steamParticles.splice(i, 1);
                }
            }
            
            // Update splash particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.1; // Gravity
                particle.alpha -= 0.02;
                
                if (particle.alpha <= 0) {
                    this.particles.splice(i, 1);
                }
            }
            
            // Spawn new particles occasionally
            if (this.lifetime > 40 && Math.random() > 0.7) {
                if (this.flames.length < 20) {
                    const flameSize = 3 + Math.random() * 5;
                    this.flames.push({
                        x: this.x + (-15 + Math.random() * 30),
                        y: this.y + 5,
                        vx: -0.3 + Math.random() * 0.6,
                        vy: -1 - Math.random() * 2,
                        size: flameSize,
                        alpha: 0.6 + Math.random() * 0.4,
                        color: Math.random() > 0.6 ? 
                            'rgba(255, 140, 0, 0.8)' : // Orange
                            (Math.random() > 0.5 ? 'rgba(255, 69, 0, 0.8)' : 'rgba(255, 215, 0, 0.8)') // Red-orange or Gold
                    });
                }
                
                if (this.steamParticles.length < 15 && Math.random() > 0.5) {
                    const steamSize = 2 + Math.random() * 4;
                    this.steamParticles.push({
                        x: this.x + (-10 + Math.random() * 20),
                        y: this.y - 5,
                        vx: -0.2 + Math.random() * 0.4,
                        vy: -0.8 - Math.random() * 1.2,
                        size: steamSize,
                        alpha: 0.4 + Math.random() * 0.3,
                        growRate: 0.04 + Math.random() * 0.04
                    });
                }
            }
            
            this.lifetime--;
            return this.lifetime > 0;
        }
        
        draw(ctx) {
            // Draw all particles
            
            // Draw splash particles
            for (const particle of this.particles) {
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw flame particles with glow
            for (const flame of this.flames) {
                ctx.save();
                ctx.globalAlpha = flame.alpha;
                
                // Add glow
                ctx.shadowColor = flame.color;
                ctx.shadowBlur = 10;
                
                // Draw flame
                ctx.fillStyle = flame.color;
                ctx.beginPath();
                // Draw flame shape (tear drop)
                ctx.arc(flame.x, flame.y, flame.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw steam particles
            for (const steam of this.steamParticles) {
                ctx.save();
                ctx.globalAlpha = steam.alpha;
                
                // Create gradient for steam
                const gradient = ctx.createRadialGradient(
                    steam.x, steam.y, 0,
                    steam.x, steam.y, steam.size
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(steam.x, steam.y, steam.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw text
            if (this.textAlpha > 0) {
                ctx.save();
                ctx.globalAlpha = this.textAlpha;
                
                // Add glow
                ctx.shadowColor = '#FF8C00';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Draw text
                ctx.font = `bold ${20 * this.textScale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FF6347';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                
                ctx.strokeText(this.text, this.x, this.y - 20);
                ctx.fillText(this.text, this.x, this.y - 20);
                
                ctx.restore();
            }
        }
    }
    
    // Magnet collection effect with magnetic particles and electric arcs
    class MagnetCollectionEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.lifetime = 80;
            this.particles = [];
            this.rings = [];
            this.arcs = [];
            this.text = "MAGNET!";
            this.textAlpha = 1;
            this.textScale = 1;
            
            // Initialize particles
            this.initParticles();
        }
        
        initParticles() {
            // Create magnetic rings
            for (let i = 0; i < 3; i++) {
                this.rings.push({
                    radius: 5 + i * 10,
                    alpha: 0.8,
                    expandRate: 1.5 + Math.random(),
                    lineWidth: 2
                });
            }
            
            // Create magnetic particles
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 15 + Math.random() * 30;
                
                this.particles.push({
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    angle: angle,
                    distance: distance,
                    orbitSpeed: 0.05 + Math.random() * 0.1,
                    size: 1 + Math.random() * 3,
                    alpha: 0.7 + Math.random() * 0.3,
                    orbitDirection: Math.random() > 0.5 ? 1 : -1
                });
            }
            
            // Create electric arcs
            for (let i = 0; i < 6; i++) {
                const startAngle = Math.random() * Math.PI * 2;
                const endAngle = startAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2 + Math.random() * Math.PI / 2);
                
                this.arcs.push({
                    startAngle: startAngle,
                    endAngle: endAngle,
                    radius: 20 + Math.random() * 15,
                    alpha: 0.7 + Math.random() * 0.3,
                    segments: 4 + Math.floor(Math.random() * 3), // Number of line segments for the arc
                    variation: 5 + Math.random() * 5, // How much the arc can zigzag
                    lifetime: 20 + Math.floor(Math.random() * 20),
                    currentLife: 0
                });
            }
        }
        
        update() {
            // Update text
            this.textAlpha = Math.max(0, this.textAlpha - 0.015);
            this.textScale += 0.03;
            
            // Update rings
            for (let i = this.rings.length - 1; i >= 0; i--) {
                const ring = this.rings[i];
                
                ring.radius += ring.expandRate;
                ring.alpha -= 0.015;
                
                if (ring.alpha <= 0) {
                    this.rings.splice(i, 1);
                }
            }
            
            // Occasionally add new rings
            if (this.lifetime > 40 && this.rings.length < 5 && Math.random() > 0.9) {
                this.rings.push({
                    radius: 5,
                    alpha: 0.8,
                    expandRate: 1 + Math.random() * 2,
                    lineWidth: 1 + Math.floor(Math.random() * 2)
                });
            }
            
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const particle = this.particles[i];
                
                // Orbit around center
                particle.angle += particle.orbitSpeed * particle.orbitDirection;
                
                // Gradually move out from center
                particle.distance += 0.2;
                
                // Update position
                particle.x = this.x + Math.cos(particle.angle) * particle.distance;
                particle.y = this.y + Math.sin(particle.angle) * particle.distance;
                
                // Fade out
                particle.alpha -= 0.01;
                
                if (particle.alpha <= 0 || particle.distance > 60) {
                    this.particles.splice(i, 1);
                }
            }
            
            // Add new particles
            if (this.lifetime > 30 && this.particles.length < 30 && Math.random() > 0.7) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 10 + Math.random() * 15;
                
                this.particles.push({
                    x: this.x + Math.cos(angle) * distance,
                    y: this.y + Math.sin(angle) * distance,
                    angle: angle,
                    distance: distance,
                    orbitSpeed: 0.05 + Math.random() * 0.1,
                    size: 1 + Math.random() * 3,
                    alpha: 0.7 + Math.random() * 0.3,
                    orbitDirection: Math.random() > 0.5 ? 1 : -1
                });
            }
            
            // Update arcs
            for (let i = this.arcs.length - 1; i >= 0; i--) {
                const arc = this.arcs[i];
                
                arc.currentLife++;
                if (arc.currentLife >= arc.lifetime) {
                    this.arcs.splice(i, 1);
                }
            }
            
            // Add new arcs
            if (this.lifetime > 20 && this.arcs.length < 8 && Math.random() > 0.8) {
                const startAngle = Math.random() * Math.PI * 2;
                const endAngle = startAngle + (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2 + Math.random() * Math.PI / 2);
                
                this.arcs.push({
                    startAngle: startAngle,
                    endAngle: endAngle,
                    radius: 15 + Math.random() * 20,
                    alpha: 0.7 + Math.random() * 0.3,
                    segments: 3 + Math.floor(Math.random() * 4),
                    variation: 3 + Math.random() * 7,
                    lifetime: 15 + Math.floor(Math.random() * 15),
                    currentLife: 0
                });
            }
            
            this.lifetime--;
            return this.lifetime > 0;
        }
        
        draw(ctx) {
            // Draw rings
            for (const ring of this.rings) {
                ctx.save();
                ctx.globalAlpha = ring.alpha;
                ctx.strokeStyle = '#1E90FF'; // Blue
                ctx.lineWidth = ring.lineWidth;
                
                // Add glow
                ctx.shadowColor = '#00BFFF';
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, ring.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            
            // Draw particles
            for (const particle of this.particles) {
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                
                // Create gradient for particles
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size * 2
                );
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.4, '#87CEFA'); // Light sky blue
                gradient.addColorStop(1, 'rgba(135, 206, 250, 0)');
                
                ctx.fillStyle = gradient;
                
                // Add glow
                ctx.shadowColor = '#87CEFA';
                ctx.shadowBlur = 5;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            
            // Draw electric arcs
            for (const arc of this.arcs) {
                ctx.save();
                ctx.globalAlpha = arc.alpha * (1 - arc.currentLife / arc.lifetime);
                ctx.strokeStyle = '#00FFFF'; // Cyan
                ctx.lineWidth = 2;
                
                // Add glow
                ctx.shadowColor = '#00FFFF';
                ctx.shadowBlur = 10;
                
                // Calculate points along the arc
                const startX = this.x + Math.cos(arc.startAngle) * arc.radius;
                const startY = this.y + Math.sin(arc.startAngle) * arc.radius;
                const endX = this.x + Math.cos(arc.endAngle) * arc.radius;
                const endY = this.y + Math.sin(arc.endAngle) * arc.radius;
                
                // Create zigzag lightning effect
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                // Calculate intermediate points with random variation
                for (let i = 1; i < arc.segments; i++) {
                    const ratio = i / arc.segments;
                    
                    // Interpolated position between start and end
                    const interpX = startX + (endX - startX) * ratio;
                    const interpY = startY + (endY - startY) * ratio;
                    
                    // Add random variation to create zigzag
                    const perpX = -(endY - startY) / arc.segments;
                    const perpY = (endX - startX) / arc.segments;
                    const randomOffset = (Math.random() - 0.5) * arc.variation;
                    
                    const pointX = interpX + perpX * randomOffset;
                    const pointY = interpY + perpY * randomOffset;
                    
                    ctx.lineTo(pointX, pointY);
                }
                
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            }
            
            // Draw text
            if (this.textAlpha > 0) {
                ctx.save();
                ctx.globalAlpha = this.textAlpha;
                
                // Add glow
                ctx.shadowColor = '#00BFFF';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Draw text
                ctx.font = `bold ${20 * this.textScale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#1E90FF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                
                ctx.strokeText(this.text, this.x, this.y - 20);
                ctx.fillText(this.text, this.x, this.y - 20);
                
                ctx.restore();
            }
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
            this.highScore = parseInt(localStorage.getItem('highScore') || '0'); // Initialize high score from localStorage
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
            this.collectionEffects = []; // Add collection effects array
            
            // Store items state
            this.activeItems = {
                magnet: false,
                coffee: false
            };
            
            // Initialize item timers and effects tracking
            this.coffeeTrailLength = 20; // Initialize this even if we're not using visual effects
            this.coffeeTrail = [];
            this.coffeePowerStartTime = null;
            this.coffeePowerDuration = 0;
            this.coffeePowerTimeout = null;
            this.magnetStartTime = null;
            this.magnetDuration = 0;
            this.magnetTimeout = null;
            this.originalScoreMultiplier = 1;
            
            // Coffee visual effects
            this.coffeeTrailOpacity = 0.4;
            this.coffeeParticles = [];
            this.coffeeParticleTime = 0;
            this.coffeeTint = {
                active: false,
                color: 'rgba(255, 215, 0, 0.3)' // Gold tint
            };
            
            // Magnet visual effects
            this.magnetRingRadius = 40;
            this.magnetRingRotation = 0;
            this.magnetRingAlpha = 0.7;
            this.magnetGlowSize = 0;
            this.magnetGlowDirection = 1;
            this.magnetSparkTime = 0;
            this.magnetSparks = [];
            
            // Physics
            this.gravity = 0.6;
            this.jumpForce = -15;
            
            // Load sound effects
            this.tokenSound = new Audio(getAssetPath('assets/sound/coin.wav'));
            this.tokenSound.volume = 0.3;
            this.tokenSound.onerror = () => console.error('Failed to load coin sound');
            
            this.jumpSound = new Audio(getAssetPath('assets/sound/jump.wav'));
            this.jumpSound.volume = 0.3;
            this.jumpSound.onerror = () => console.error('Failed to load jump sound');
            
            this.gameOverSound = new Audio(getAssetPath('assets/sound/game-over.wav'));
            this.gameOverSound.volume = 0.3;
            this.gameOverSound.onerror = () => console.error('Failed to load game over sound');
            
            this.hitSound = new Audio(getAssetPath('assets/sound/hit.wav'));
            this.hitSound.volume = 0.3;
            this.hitSound.onerror = () => console.error('Failed to load hit sound');
            
            // Load and setup background music
            this.backgroundMusic = new Audio(getAssetPath('assets/music/music.wav'));
            this.backgroundMusic.volume = 0.2; // Set music volume lower than sound effects
            this.backgroundMusic.loop = true; // Make the music loop continuously
            
            // Add error handling for background music
            this.backgroundMusic.onerror = () => {
                console.error('Failed to load background music');
            };
            
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
            this.tokensCollected = 0; // Initialize to 0 for current game session only
            this.tokenSpawnInterval = 2000; // Spawn a token every 2 seconds
            this.lastTokenSpawn = 0;
            this.tokenImage = new Image();
            this.tokenImage.src = getAssetPath('assets/images/grindcoin.gif');
            
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
            
            // Add this to the constructor
            // Create game over modal
            this.createGameOverModal();
            
            // Simplify fade-out animation
            this.warningThreshold = 5000; // 5 seconds before effect ends
            this.blinkValue = 0; // For blink animation
            this.blinkSpeed = 0.05; // Speed of blink
        }

        loadAssets() {
            // Load character image
            this.characterImage = new Image();
            const selectedCharacter = localStorage.getItem('selectedCharacter') || 'hamster';
            this.characterImage.src = getAssetPath(`assets/images/${selectedCharacter}.png`);
            
            // Load token image
            this.tokenImage = new Image();
            this.tokenImage.src = getAssetPath('assets/images/grindcoin.gif');
            
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
                ctx.fillStyle = imageName === 'coffee' ? '#8B4513' : '#FF0000'; // Brown color for coffee
                ctx.fillRect(0, 0, 40, 40);
                
                // If it's a coffee, draw a coffee shape
                if (imageName === 'coffee') {
                    ctx.fillStyle = '#603813';
                    ctx.beginPath();
                    // Draw coffee cup
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    
                    // Cup body
                    ctx.fillRect(centerX - 10, centerY - 5, 20, 15);
                    
                    // Cup handle
                    ctx.beginPath();
                    ctx.arc(centerX + 10, centerY, 5, -Math.PI/2, Math.PI/2, false);
                    ctx.fill();
                    
                    // Steam
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX - 5, centerY - 10);
                    ctx.quadraticCurveTo(centerX - 10, centerY - 15, centerX - 5, centerY - 20);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(centerX + 5, centerY - 10);
                    ctx.quadraticCurveTo(centerX + 10, centerY - 15, centerX + 5, centerY - 20);
                    ctx.stroke();
                }
                
                // Use the fallback image
                if (this.itemImages[imageName]) {
                    this.itemImages[imageName].src = canvas.toDataURL();
                } else if (this.obstacleImages[imageName]) {
                    this.obstacleImages[imageName].src = canvas.toDataURL();
                }
            };
            
            // Load each obstacle image with error handling
            this.obstacleImages.barrel.onerror = () => handleImageError('barrel');
            this.obstacleImages.rocks.onerror = () => handleImageError('rocks');
            this.obstacleImages.spikes.onerror = () => handleImageError('spikes');
            this.obstacleImages.spikesLarge.onerror = () => handleImageError('spikesLarge');
            this.obstacleImages.crow.onerror = () => handleImageError('crow');
            
            // Load each store item image with error handling
            this.itemImages.magnet.onerror = () => handleImageError('magnet');
            this.itemImages.coffee.onerror = () => handleImageError('coffee');
            
            // Set image sources
            this.obstacleImages.barrel.src = getAssetPath('assets/images/barrel.png');
            this.obstacleImages.rocks.src = getAssetPath('assets/images/rocks.png');
            this.obstacleImages.spikes.src = getAssetPath('assets/images/trap-spikes.png');
            this.obstacleImages.spikesLarge.src = getAssetPath('assets/images/trap-spikes-large.png');
            this.obstacleImages.crow.src = getAssetPath('assets/images/flying_crow.png');
            
            // Set store item image sources
            this.itemImages.magnet.src = getAssetPath('assets/images/magnet.png');
            this.itemImages.coffee.src = getAssetPath('assets/images/coffee.png');
            
            // Load sound effects
            this.tokenSound = new Audio(getAssetPath('assets/sound/coin.wav'));
            this.tokenSound.volume = 0.3;
            this.tokenSound.onerror = () => console.error('Failed to load coin sound');
            
            this.jumpSound = new Audio(getAssetPath('assets/sound/jump.wav'));
            this.jumpSound.volume = 0.3;
            this.jumpSound.onerror = () => console.error('Failed to load jump sound');
            
            this.gameOverSound = new Audio(getAssetPath('assets/sound/game-over.wav'));
            this.gameOverSound.volume = 0.3;
            this.gameOverSound.onerror = () => console.error('Failed to load game over sound');
            
            this.hitSound = new Audio(getAssetPath('assets/sound/hit.wav'));
            this.hitSound.volume = 0.3;
            this.hitSound.onerror = () => console.error('Failed to load hit sound');
            
            // Load and setup background music
            this.backgroundMusic = new Audio(getAssetPath('assets/music/music.wav'));
            this.backgroundMusic.volume = 0.2; // Set music volume lower than sound effects
            this.backgroundMusic.loop = true; // Make the music loop continuously
            
            // Initialize audio based on saved settings
            if (!window.audioState.musicEnabled) {
                this.backgroundMusic.pause();
            }
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
            
            // Add canvas to game container
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                // Store reference to the game container
                this.gameContainer = gameContainer;
                
                gameContainer.appendChild(this.canvas);
                
                // Start game loops
                this.gameLoop();
                this.spawnObstacles();
                this.spawnTokens();
                this.spawnItems(); // Start item spawning
                
                // Restart background music if enabled
                if (window.audioState.musicEnabled) {
                    this.backgroundMusic.currentTime = 0;
                    this.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
                }
                
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
                
                if ((e.code === 'Space' || e.code === 'ArrowUp') && !this.player.jumping && !this.isGameOver && !this.isPaused) {
                    this.player.jumping = true;
                    this.player.velocityY = this.jumpForce;
                    // Play jump sound if enabled
                    if (window.audioState.sfxEnabled) {
                        this.jumpSound.currentTime = 0;
                        this.jumpSound.play();
                    }
                }
                
                // Add keyboard shortcuts for inventory items
                if (!this.isGameOver && !this.isPaused) {
                    // Coffee shortcut with Ctrl key
                    if (e.key === 'Control') {
                        this.activateInventoryItem('coffee');
                    }
                    
                    // Magnet shortcut with Shift key
                    if (e.key === 'Shift') {
                        this.activateInventoryItem('magnet');
                    }
                }
                
                // Add restart functionality for game over screen
                if ((e.code === 'Space' || e.code === 'ArrowUp') && this.isGameOver) {
                    // Stop game over sound immediately
                    this.gameOverSound.pause();
                    this.gameOverSound.currentTime = 0;
                    
                    // Hide game over modal
                    const gameOverModal = document.querySelector('.game-over-modal');
                    gameOverModal.classList.remove('active');
                    
                    // Reset the game
                    this.resetGame();
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
            
            // Update coffee visual effects
            if (this.activeItems.coffee) {
                // Add to coffee trail
                this.coffeeTrail.unshift({
                    x: this.player.x,
                    y: this.player.y,
                    width: this.player.width,
                    height: this.player.height
                });
                
                // Limit trail length
                if (this.coffeeTrail.length > this.coffeeTrailLength) {
                    this.coffeeTrail.pop();
                }
                
                // Update coffee particles
                const now = Date.now();
                if (now - this.coffeeParticleTime > 100) { // Generate particles every 100ms
                    this.coffeeParticleTime = now;
                    
                    // Add new particles in various positions
                    if (this.coffeeParticles.length < 35) { // Increased max particles
                        // Particles behind the player
                        const offsetX = -5 - Math.random() * 10; // Behind player
                        const offsetY = Math.random() * this.player.height;
                        
                        // Create more varied particles with assigned types
                        const particleType = Math.floor(Math.random() * 3);
                        const colors = [
                            '#FFD700', // Gold
                            '#FF6347', // Tomato red
                            '#FF8C00', // Dark orange
                            '#FFA500'  // Orange
                        ];
                        
                        this.coffeeParticles.push({
                            x: this.player.x + offsetX,
                            y: this.player.y + offsetY,
                            size: 1 + Math.random() * 3,
                            speedX: -1 - Math.random() * 2.5, // Slightly faster
                            speedY: -0.5 + Math.random() * 1,
                            opacity: 0.7 + Math.random() * 0.3,
                            color: colors[Math.floor(Math.random() * colors.length)],
                            type: particleType
                        });
                        
                        // Occasionally add particles at other positions to create more dynamic effect
                        if (Math.random() > 0.7) {
                            // Particles at character edges or above/below
                            const edgeX = this.player.x + (Math.random() > 0.5 ? this.player.width : 0);
                            const edgeY = this.player.y + (Math.random() * this.player.height);
                            
                            this.coffeeParticles.push({
                                x: edgeX,
                                y: edgeY,
                                size: 1 + Math.random() * 2.5,
                                speedX: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()),
                                speedY: -0.5 + Math.random(),
                                opacity: 0.7 + Math.random() * 0.3,
                                color: colors[Math.floor(Math.random() * colors.length)],
                                type: particleType
                            });
                        }
                    }
                }
                
                // Update existing particles with more dynamic movement
                for (let i = this.coffeeParticles.length - 1; i >= 0; i--) {
                    const particle = this.coffeeParticles[i];
                    
                    // Add slight wobble to particle movement
                    particle.speedY += (Math.random() - 0.5) * 0.1;
                    
                    // Move particles
                    particle.x += particle.speedX;
                    particle.y += particle.speedY;
                    
                    // Fade particles
                    particle.opacity -= 0.015; // Slightly slower fade
                    
                    // Occasionally change color for sparkle effect
                    if (Math.random() > 0.95) {
                        const colors = ['#FFD700', '#FF6347', '#FF8C00', '#FFA500'];
                        particle.color = colors[Math.floor(Math.random() * colors.length)];
                    }
                    
                    // Remove faded particles
                    if (particle.opacity <= 0 || particle.x < 0 || particle.y < 0 ||
                        particle.y > this.canvas.height) {
                        this.coffeeParticles.splice(i, 1);
                    }
                }
            }
            
            // Update magnet visual effects
            if (this.activeItems.magnet) {
                // Rotate the ring
                this.magnetRingRotation += 0.03;
                if (this.magnetRingRotation > Math.PI * 2) {
                    this.magnetRingRotation = 0;
                }
                
                // Pulsate the glow
                this.magnetGlowSize += 0.3 * this.magnetGlowDirection;
                if (this.magnetGlowSize > 10) {
                    this.magnetGlowDirection = -1;
                } else if (this.magnetGlowSize < 0) {
                    this.magnetGlowDirection = 1;
                }
                
                // Update sparks
                const now = Date.now();
                if (now - this.magnetSparkTime > 300) {
                    this.magnetSparkTime = now;
                    
                    // Add a new random spark
                    if (Math.random() > 0.3 && this.magnetSparks.length < 8) {
                        this.magnetSparks.push({
                            angle: Math.random() * Math.PI * 2,
                            distance: this.magnetRingRadius + Math.random() * 20,
                            size: 2 + Math.random() * 3,
                            speed: 0.02 + Math.random() * 0.03,
                            alpha: 0.5 + Math.random() * 0.5
                        });
                    }
                }
                
                // Update existing sparks
                for (let i = this.magnetSparks.length - 1; i >= 0; i--) {
                    const spark = this.magnetSparks[i];
                    spark.angle += spark.speed;
                    spark.alpha -= 0.01;
                    
                    if (spark.alpha <= 0) {
                        this.magnetSparks.splice(i, 1);
                    }
                }
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
        }
        
        checkCollisions() {
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
            
            // Obstacle collisions
            for (let obstacle of this.obstacles) {
                if (this.isColliding(this.player, obstacle)) {
                    // Add a very short 50ms delay for smoother feel
                    setTimeout(() => {
                        if (this.isColliding(this.player, obstacle)) {
                            console.log("Collided! Coffee active?", this.activeItems.coffee);
                            
                            // 💥 PRIORITY: Coffee power makes player invincible
                            if (this.activeItems.coffee) {
                                // Create explosion effect at obstacle position
                                const explosion = new ExplosionEffect(
                                    obstacle.x + obstacle.width/2,
                                    obstacle.y + obstacle.height/2
                                );
                                this.explosionEffects = this.explosionEffects || [];
                                this.explosionEffects.push(explosion);
                                
                                // Remove the obstacle
                                const obstacleIndex = this.obstacles.indexOf(obstacle);
                                if (obstacleIndex !== -1) {
                                    this.obstacles.splice(obstacleIndex, 1);
                                }
                                
                                // Play hit sound if enabled
                                if (window.audioState.sfxEnabled) {
                                    this.hitSound.currentTime = 0;
                                    this.hitSound.play();
                                }
                                
                                // ❗ STOP — don't allow any other collision logic to run
                                return;
                            }
                            
                            // ❌ No coffee power — proceed to game over
                            this.gameOver();
                        }
                    }, 50);
                    return;
                }
            }
        }
        
        isColliding(rect1, rect2) {
            // Add a small buffer zone (10% of the smaller object's dimensions)
            const buffer = Math.min(rect1.width, rect2.width) * 0.1;
            
            // Calculate collision boundaries with buffer
            const left1 = rect1.x + buffer;
            const right1 = rect1.x + rect1.width - buffer;
            const top1 = rect1.y + buffer;
            const bottom1 = rect1.y + rect1.height - buffer;
            
            const left2 = rect2.x + buffer;
            const right2 = rect2.x + rect2.width - buffer;
            const top2 = rect2.y + buffer;
            const bottom2 = rect2.y + rect2.height - buffer;
            
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
            
            // Check if obstacle is too close to any items - using proper rectangle collision detection
            const tooCloseToItem = this.items.some(item => {
                // Rectangle collision detection with safety margin
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                const obstacleRight = obstacle.x + obstacle.width;
                const obstacleBottom = obstacle.y + obstacle.height;
                
                // Add safety margin (80 scale units) - larger margin for obstacles
                const margin = 80 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    obstacleRight + margin < item.x || 
                    obstacle.x > itemRight + margin || 
                    obstacleBottom + margin < item.y || 
                    obstacle.y > itemBottom + margin
                );
            });
            
            if (!tooCloseToObstacle && !tooCloseToToken && !tooCloseToItem) {
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
            
            // 5% chance to spawn an item (reduced from 20%)
            if (Math.random() < 0.05) {
                this.spawnItem();
            }
            
            // Use longer intervals between spawn checks (5-10 seconds instead of 1-2)
            const interval = 5000 + Math.random() * 5000;
            setTimeout(() => this.spawnItems(), interval);
        }
        
        spawnItem() {
            if (this.isGameOver) return;

            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            
            // Select item type with weighted probabilities
            // Coffee: 70%, Magnet: 30% - making magnets rarer
            const itemType = Math.random() < 0.7 ? 'coffee' : 'magnet';
            
            // Calculate spawn position exactly like tokens
            const minHeight = this.groundY - this.player.height - 100; // Minimum height (ground level)
            const maxHeight = this.groundY - this.player.height - 200; // Maximum height (jumpable)
            const randomHeight = Math.random() * (maxHeight - minHeight) + minHeight;
            
            const item = {
                x: this.canvas.width,
                y: randomHeight,
                width: 30 * scale,
                height: 30 * scale,
                type: itemType
            };
            
            // Check spacing from other items - using full collision detection
            const tooCloseToItem = this.items.some(existingItem => {
                // Rectangle collision detection with safety margin
                const existingItemRight = existingItem.x + existingItem.width;
                const existingItemBottom = existingItem.y + existingItem.height;
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    itemRight + margin < existingItem.x || 
                    item.x > existingItemRight + margin || 
                    itemBottom + margin < existingItem.y || 
                    item.y > existingItemBottom + margin
                );
            });
            
            if (tooCloseToItem) {
                // Not enough space between items
                return;
            }
            
            // Check spacing from tokens - using full collision detection with all tokens
            const tooCloseToToken = this.tokens.some(token => {
                // Rectangle collision detection with safety margin
                const tokenRight = token.x + token.width;
                const tokenBottom = token.y + token.height;
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    itemRight + margin < token.x || 
                    item.x > tokenRight + margin || 
                    itemBottom + margin < token.y || 
                    item.y > tokenBottom + margin
                );
            });
            
            if (tooCloseToToken) {
                // Too close to a token, don't spawn this item
                return;
            }
            
            // Check if item is too close to any obstacle - using rectangle collision detection
            const tooCloseToObstacle = this.obstacles.some(obstacle => {
                // Rectangle collision detection with safety margin
                const obstacleRight = obstacle.x + obstacle.width;
                const obstacleBottom = obstacle.y + obstacle.height;
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                
                // Add safety margin (80 scale units) - larger margin for obstacles
                const margin = 80 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    itemRight + margin < obstacle.x || 
                    item.x > obstacleRight + margin || 
                    itemBottom + margin < obstacle.y || 
                    item.y > obstacleBottom + margin
                );
            });
            
            if (tooCloseToObstacle) {
                // Too close to an obstacle, don't spawn this item
                return;
            }
            
            this.items.push(item);
        }
        
        checkItemCollisions() {
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                if (this.isColliding(this.player, item)) {
                    // Create item-specific collection effect
                    if (item.type === 'coffee') {
                        // Create coffee brewing effect
                        const effect = new CoffeeCollectionEffect(item.x + item.width / 2, item.y + item.height / 2);
                        this.collectionEffects.push(effect);
                    } else if (item.type === 'magnet') {
                        // Create magnetic field effect
                        const effect = new MagnetCollectionEffect(item.x + item.width / 2, item.y + item.height / 2);
                        this.collectionEffects.push(effect);
                    }
                    
                    // Apply the pickup item effect (not from inventory)
                    try {
                        if (item && item.type) {
                            this.applyPickupItemEffect(item.type);
                        }
                    } catch (error) {
                        console.error('Error applying item effect:', error);
                    }
                    
                    // Remove the collected item
                    this.items.splice(i, 1);
                }
            }
        }
        
        applyPickupItemEffect(type) {
            if (!type) {
                console.error('No item type specified for applyPickupItemEffect');
                return;
            }
            
            // Normalize the type (ensure lowercase)
            const itemType = type.toLowerCase();
            
            switch(itemType) {
                case 'magnet':
                    this.activatePickupMagnetEffect();
                    break;
                case 'coffee':
                    this.activatePickupCoffeeEffect();
                    break;
                default:
                    console.warn(`Unknown item type: ${type}`);
                    break;
            }
        }
        
        applyItemEffect(type) {
            if (!type) {
                console.error('No item type specified for applyItemEffect');
                return;
            }
            
            // Normalize the type (ensure lowercase)
            const itemType = type.toLowerCase();
            
            switch(itemType) {
                case 'magnet':
                    this.activateMagnetEffect();
                    break;
                case 'coffee':
                    this.activateCoffeeEffect();
                    break;
                default:
                    console.warn(`Unknown item type: ${type}`);
                    break;
            }
        }
        
        activateMagnetEffect() {
            this.activeItems.magnet = true;
            
            // Reset attraction state of all tokens
            this.tokens.forEach(token => {
                token.attracted = false;
            });
            
            // If magnet is already active, add 20 seconds to the duration
            if (this.magnetStartTime) {
                const elapsedTime = Date.now() - this.magnetStartTime;
                const remainingTime = this.magnetDuration - elapsedTime;
                this.magnetDuration = remainingTime + 20000; // Add 20 seconds to remaining time
                this.magnetStartTime = Date.now() - (this.magnetDuration - remainingTime - 20000); // Adjust start time
            } else {
                // Initialize magnet if not already active
                this.magnetStartTime = Date.now();
                this.magnetDuration = 20000; // 20 seconds
            }
            
            // Reset visual effects
            this.magnetRingRotation = 0;
            this.magnetGlowSize = 0;
            this.magnetGlowDirection = 1;
            
            // Initialize sparks effect
            this.magnetSparks = [];
            for (let i = 0; i < 5; i++) {
                this.magnetSparks.push({
                    angle: Math.random() * Math.PI * 2,
                    distance: this.magnetRingRadius + Math.random() * 20,
                    size: 2 + Math.random() * 3,
                    speed: 0.02 + Math.random() * 0.03,
                    alpha: 0.5 + Math.random() * 0.5
                });
            }
            
            // Play magnet sound effect if enabled
            if (window.audioState && window.audioState.sfxEnabled) {
                try {
                    const magnetSound = new Audio(getAssetPath('assets/sound/magnet.mp3'));
                    magnetSound.volume = 0.3;
                    magnetSound.play().catch(err => console.log('Magnet audio play error:', err));
                } catch (error) {
                    console.log('Magnet audio error:', error);
                }
            }
            
            // Clear any existing timeout and set a new one
            if (this.magnetTimeout) {
                clearTimeout(this.magnetTimeout);
            }
            
            // Calculate exact timeout duration
            const timeoutDuration = this.magnetDuration - (Date.now() - this.magnetStartTime);
            
            // Set the magnet as active in gameState
            window.gameState.setItemActive('Magnet', true);
            
            this.magnetTimeout = setTimeout(() => {
                this.activeItems.magnet = false;
                // Reset attraction state of all tokens
                this.tokens.forEach(token => {
                    token.attracted = false;
                });
                this.magnetStartTime = null;
                this.magnetDuration = 0;
                // Clear visual effects
                this.magnetSparks = [];
                
                // Set the magnet as inactive in gameState
                window.gameState.setItemActive('Magnet', false);
            }, timeoutDuration);
            
            // Notice: This does NOT decrement the inventory quantity
            // It's a pickup item, not an inventory item
        }
        
        activateCoffeeEffect() {
            // Activate coffee power without deactivating other items
            this.activeItems.coffee = true;
            
            // If coffee power is already active, add 20 seconds to the duration
            if (this.coffeePowerStartTime) {
                const elapsedTime = Date.now() - this.coffeePowerStartTime;
                const remainingTime = this.coffeePowerDuration - elapsedTime;
                this.coffeePowerDuration = remainingTime + 20000; // Add 20 seconds to remaining time
                this.coffeePowerStartTime = Date.now() - (this.coffeePowerDuration - remainingTime - 20000); // Adjust start time
            } else {
                // Initialize coffee power if not already active
                this.coffeePowerStartTime = Date.now();
                this.coffeePowerDuration = 20000; // 20 seconds
                this.originalScoreMultiplier = this.scoreMultiplier;
                this.scoreMultiplier *= 2; // Double the score multiplier
            }
                
            // Initialize visual effects
                this.coffeeTrail = [];
            this.coffeeParticles = [];
            this.coffeeParticleTime = Date.now();
            this.coffeeTint.active = true;
            
            // Generate initial particles
            for (let i = 0; i < 8; i++) {
                this.coffeeParticles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height / 2,
                    size: 1 + Math.random() * 3,
                    speedX: -2 - Math.random() * 3, // Move left (behind character)
                    speedY: -1 + Math.random() * 2, // Slight vertical drift
                    opacity: 0.7 + Math.random() * 0.3,
                    color: Math.random() > 0.5 ? '#FFD700' : '#FF6347' // Gold or tomato red
                });
            }
            
            // Play coffee power sound if enabled
            if (window.audioState && window.audioState.sfxEnabled) {
                try {
                    const coffeeSound = new Audio(getAssetPath('assets/sound/coffee.mp3'));
                    coffeeSound.volume = 0.3;
                    coffeeSound.play().catch(err => console.log('Audio play error:', err));
                } catch (error) {
                    console.log('Audio error:', error);
                }
            }
            
            // Clear any existing timeout and set a new one
            if (this.coffeePowerTimeout) {
                clearTimeout(this.coffeePowerTimeout);
            }
            
            // Calculate exact timeout duration
            const timeoutDuration = this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime);
            
            // Set the coffee as active in gameState
            window.gameState.setItemActive('Coffee', true);
            
            this.coffeePowerTimeout = setTimeout(() => {
                this.activeItems.coffee = false;
                if (this.originalScoreMultiplier) {
                    this.scoreMultiplier = this.originalScoreMultiplier;
                }
                // Clear visual effects
                this.coffeeTrail = [];
                this.coffeeParticles = [];
                this.coffeeTint.active = false;
                this.coffeePowerStartTime = null;
                this.coffeePowerDuration = 0;
                
                // Set the coffee as inactive in gameState
                window.gameState.setItemActive('Coffee', false);
            }, timeoutDuration);
            
            // Notice: This does NOT decrement the inventory quantity
            // It's a pickup item, not an inventory item
        }
        
        activatePickupMagnetEffect() {
            this.activeItems.magnet = true;
            
            // Reset attraction state of all tokens
            this.tokens.forEach(token => {
                token.attracted = false;
            });
            
            // If magnet is already active, add 20 seconds to the duration
            if (this.magnetStartTime) {
                const elapsedTime = Date.now() - this.magnetStartTime;
                const remainingTime = this.magnetDuration - elapsedTime;
                this.magnetDuration = remainingTime + 20000; // Add 20 seconds to remaining time
                this.magnetStartTime = Date.now() - (this.magnetDuration - remainingTime - 20000); // Adjust start time
            } else {
                // Initialize magnet if not already active
                this.magnetStartTime = Date.now();
                this.magnetDuration = 20000; // 20 seconds
            }
            
            // Reset visual effects
            this.magnetRingRotation = 0;
            this.magnetGlowSize = 0;
            this.magnetGlowDirection = 1;
            
            // Initialize sparks effect
            this.magnetSparks = [];
            for (let i = 0; i < 5; i++) {
                this.magnetSparks.push({
                    angle: Math.random() * Math.PI * 2,
                    distance: this.magnetRingRadius + Math.random() * 20,
                    size: 2 + Math.random() * 3,
                    speed: 0.02 + Math.random() * 0.03,
                    alpha: 0.5 + Math.random() * 0.5
                });
            }
            
            // Play magnet sound effect if enabled
            if (window.audioState && window.audioState.sfxEnabled) {
                try {
                    const magnetSound = new Audio(getAssetPath('assets/sound/magnet.mp3'));
                    magnetSound.volume = 0.3;
                    magnetSound.play().catch(err => console.log('Magnet audio play error:', err));
                } catch (error) {
                    console.log('Magnet audio error:', error);
                }
            }
            
            // Clear any existing timeout and set a new one
            if (this.magnetTimeout) {
                clearTimeout(this.magnetTimeout);
            }
            
            // Calculate exact timeout duration
            const timeoutDuration = this.magnetDuration - (Date.now() - this.magnetStartTime);
            
            // Set the magnet as active in gameState
            window.gameState.setItemActive('Magnet', true);
            
            this.magnetTimeout = setTimeout(() => {
                this.activeItems.magnet = false;
                // Reset attraction state of all tokens
                this.tokens.forEach(token => {
                    token.attracted = false;
                });
                this.magnetStartTime = null;
                this.magnetDuration = 0;
                // Clear visual effects
                this.magnetSparks = [];
                
                // Set the magnet as inactive in gameState
                window.gameState.setItemActive('Magnet', false);
            }, timeoutDuration);
            
            // Notice: This does NOT decrement the inventory quantity
            // It's a pickup item, not an inventory item
        }
        
        activatePickupCoffeeEffect() {
            // Activate coffee power without deactivating other items
            this.activeItems.coffee = true;
            
            // If coffee power is already active, add 20 seconds to the duration
            if (this.coffeePowerStartTime) {
                const elapsedTime = Date.now() - this.coffeePowerStartTime;
                const remainingTime = this.coffeePowerDuration - elapsedTime;
                this.coffeePowerDuration = remainingTime + 20000; // Add 20 seconds to remaining time
                this.coffeePowerStartTime = Date.now() - (this.coffeePowerDuration - remainingTime - 20000); // Adjust start time
            } else {
                // Initialize coffee power if not already active
                this.coffeePowerStartTime = Date.now();
                this.coffeePowerDuration = 20000; // 20 seconds
                this.originalScoreMultiplier = this.scoreMultiplier;
                this.scoreMultiplier *= 2; // Double the score multiplier
            }
                
            // Initialize visual effects
            this.coffeeTrail = [];
            this.coffeeParticles = [];
            this.coffeeParticleTime = Date.now();
            this.coffeeTint.active = true;
            
            // Generate initial particles
            for (let i = 0; i < 8; i++) {
                this.coffeeParticles.push({
                    x: this.player.x + this.player.width / 2,
                    y: this.player.y + this.player.height / 2,
                    size: 1 + Math.random() * 3,
                    speedX: -2 - Math.random() * 3, // Move left (behind character)
                    speedY: -1 + Math.random() * 2, // Slight vertical drift
                    opacity: 0.7 + Math.random() * 0.3,
                    color: Math.random() > 0.5 ? '#FFD700' : '#FF6347' // Gold or tomato red
                });
            }
            
            // Play coffee power sound if enabled
            if (window.audioState && window.audioState.sfxEnabled) {
                try {
                    const coffeeSound = new Audio(getAssetPath('assets/sound/coffee.mp3'));
                    coffeeSound.volume = 0.3;
                    coffeeSound.play().catch(err => console.log('Audio play error:', err));
                } catch (error) {
                    console.log('Audio error:', error);
                }
            }
            
            // Clear any existing timeout and set a new one
            if (this.coffeePowerTimeout) {
                clearTimeout(this.coffeePowerTimeout);
            }
            
            // Calculate exact timeout duration
            const timeoutDuration = this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime);
            
            // Set the coffee as active in gameState
            window.gameState.setItemActive('Coffee', true);
            
            this.coffeePowerTimeout = setTimeout(() => {
                this.activeItems.coffee = false;
                if (this.originalScoreMultiplier) {
                    this.scoreMultiplier = this.originalScoreMultiplier;
                }
                // Clear visual effects
                this.coffeeTrail = [];
                this.coffeeParticles = [];
                this.coffeeTint.active = false;
                this.coffeePowerStartTime = null;
                this.coffeePowerDuration = 0;
                
                // Set the coffee as inactive in gameState
                window.gameState.setItemActive('Coffee', false);
            }, timeoutDuration);
            
            // Notice: This does NOT decrement the inventory quantity
            // It's a pickup item, not an inventory item
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
            
            // Check if there's enough space between tokens - using proper collision detection
            const tooCloseToOtherToken = this.tokens.some(existingToken => {
                // Rectangle collision detection with safety margin
                const existingTokenRight = existingToken.x + existingToken.width;
                const existingTokenBottom = existingToken.y + existingToken.height;
                const tokenRight = token.x + token.width;
                const tokenBottom = token.y + token.height;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    tokenRight + margin < existingToken.x || 
                    token.x > existingTokenRight + margin || 
                    tokenBottom + margin < existingToken.y || 
                    token.y > existingTokenBottom + margin
                );
            });
            
            if (tooCloseToOtherToken) {
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
            
            // Check spacing from items - using full collision detection with all items
            const tooCloseToItem = this.items.some(item => {
                // Rectangle collision detection with safety margin
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                const tokenRight = token.x + token.width;
                const tokenBottom = token.y + token.height;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    tokenRight + margin < item.x || 
                    token.x > itemRight + margin || 
                    tokenBottom + margin < item.y || 
                    token.y > itemBottom + margin
                );
            });
            
            if (tooCloseToItem) {
                // Too close to an item, don't spawn this token
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
                    effect.update();
                    effect.draw(this.ctx);
                    
                    if (!effect.update()) {
                        this.explosionEffects.splice(i, 1);
                    }
                }
            }
            
            // Draw player (after obstacles and tokens to ensure it's on top)
            this.drawPlayer();
            
            // Draw score and speed
            this.drawHUD();
            
            // Draw game over screen
            if (this.isGameOver) {
                this.drawGameOver();
            }
            
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
            // Save the current context state
            this.ctx.save();
            
            // Set the global composite operation to ensure the player is drawn on top
            this.ctx.globalCompositeOperation = 'source-over';
            
            // Calculate simple blink effect
            this.blinkValue = (this.blinkValue + this.blinkSpeed) % 1;
            const isVisible = this.blinkValue < 0.5; // Simple on/off pattern
            
            // Calculate player center for effects
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            
            // Draw coffee effects if active
            if (this.activeItems.coffee) {
                // Check if effect is about to expire
                const coffeeTimeRemaining = this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime);
                const coffeeWarning = coffeeTimeRemaining <= this.warningThreshold;
                
                // Only draw effects if not blinking or visible during blink
                if (!coffeeWarning || isVisible) {
                    // Draw motion blur trail with color variation
                    for (let i = this.coffeeTrail.length - 1; i >= 0; i--) {
                        const segment = this.coffeeTrail[i];
                        const opacity = (1 - i / this.coffeeTrail.length) * this.coffeeTrailOpacity;
                        
                        // Draw character silhouette with decreasing opacity and color shift
                        if (this.characterImage && this.characterImage.complete) {
                            this.ctx.save();
                            this.ctx.globalAlpha = opacity;
                            
                            // Character-specific drawing adjustments
                            let drawY = segment.y;
                            let drawHeight = segment.height;
                            
                            switch(this.player.character) {
                                case 'bear':
                                    drawY += 8;
                                    drawHeight += 5;
                                    break;
                                case 'frog':
                                    drawY += 5;
                                    drawHeight -= 5;
                                    break;
                            }
                            
                            // Add slight hue variation to trail
                            if (i % 2 === 0) {
                                this.ctx.filter = 'hue-rotate(30deg) brightness(1.2)';
                            } else {
                                this.ctx.filter = 'hue-rotate(15deg) brightness(1.1)';
                            }
                            
                            this.ctx.drawImage(
                                this.characterImage,
                                segment.x,
                                drawY,
                                segment.width,
                                drawHeight
                            );
                            this.ctx.restore();
                        }
                    }
                    
                    // Draw particles behind player
                    this.ctx.save();
                    for (const particle of this.coffeeParticles) {
                        this.ctx.globalAlpha = particle.opacity;
                        this.ctx.fillStyle = particle.color;
                        
                        // Enhanced particle glow
                        this.ctx.shadowColor = particle.color;
                        this.ctx.shadowBlur = 8;
                        
                        const x = particle.x;
                        const y = particle.y;
                        const size = particle.size;
                        
                        // More variety in particle shapes
                        const particleType = particle.type || Math.floor(Math.random() * 3);
                        
                        if (particleType === 0) {
                            // Starburst shape
                            this.ctx.beginPath();
                            for (let i = 0; i < 8; i++) {
                                const angle = (i * Math.PI * 2 / 8) - Math.PI / 2;
                                const innerRadius = size * 0.5;
                                const outerRadius = size * 2;
                                
                                const innerX = x + Math.cos(angle) * innerRadius;
                                const innerY = y + Math.sin(angle) * innerRadius;
                                const outerX = x + Math.cos(angle) * outerRadius;
                                const outerY = y + Math.sin(angle) * outerRadius;
                                
                                if (i === 0) {
                                    this.ctx.moveTo(outerX, outerY);
                                } else {
                                    this.ctx.lineTo(innerX, innerY);
                                    this.ctx.lineTo(outerX, outerY);
                                }
                            }
                            this.ctx.closePath();
                            this.ctx.fill();
                        } else if (particleType === 1) {
                            // Simple star
                            this.ctx.beginPath();
                            for (let i = 0; i < 5; i++) {
                                const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
                                const length = i % 2 === 0 ? size * 2 : size;
                                const pointX = x + Math.cos(angle) * length;
                                const pointY = y + Math.sin(angle) * length;
                                
                                if (i === 0) {
                                    this.ctx.moveTo(pointX, pointY);
                                } else {
                                    this.ctx.lineTo(pointX, pointY);
                                }
                            }
                            this.ctx.closePath();
                            this.ctx.fill();
                        } else {
                            // Glowing circle with gradient
                            const particleGradient = this.ctx.createRadialGradient(
                                x, y, 0,
                                x, y, size * 2
                            );
                            particleGradient.addColorStop(0, '#FFFFFF');
                            particleGradient.addColorStop(0.3, particle.color);
                            particleGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
                            
                            this.ctx.fillStyle = particleGradient;
                            this.ctx.beginPath();
                            this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                    this.ctx.restore();
                }
            }
            
            // Draw magnet effects if active
            if (this.activeItems.magnet) {
                // Check if effect is about to expire
                const magnetTimeRemaining = this.magnetDuration - (Date.now() - this.magnetStartTime);
                const magnetWarning = magnetTimeRemaining <= this.warningThreshold;
                
                // Only draw effects if not blinking or visible during blink
                if (!magnetWarning || isVisible) {
                    // Draw blue glow
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.2;
                    this.ctx.shadowColor = '#88B7E0';
                    this.ctx.shadowBlur = 20 + this.magnetGlowSize;
                    this.ctx.fillStyle = '#A8D4FF';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        playerCenterX, 
                        playerCenterY, 
                        this.player.width * 0.8,
                        0, 
                        Math.PI * 2
                    );
                    this.ctx.fill();
                    this.ctx.restore();
                    
                    // Draw magnetic ring
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.5;
                    
                    // Gradient for rings to make more realistic
                    const ringGradient = this.ctx.createLinearGradient(
                        playerCenterX - this.magnetRingRadius, 
                        playerCenterY - this.magnetRingRadius,
                        playerCenterX + this.magnetRingRadius, 
                        playerCenterY + this.magnetRingRadius
                    );
                    ringGradient.addColorStop(0, '#BCDEFF');
                    ringGradient.addColorStop(0.5, '#82B7F0');
                    ringGradient.addColorStop(1, '#BCDEFF');
                    
                    this.ctx.strokeStyle = ringGradient;
                    this.ctx.lineWidth = 3;
                    
                    // Draw rings
                    // ... existing rings code ...
                    
                    this.ctx.restore();
                }
            }
            
            if (this.characterImage && this.characterImage.complete) {
                // Character-specific drawing adjustments
                let drawY = this.player.y;
                let drawHeight = this.player.height;
                
                switch(this.player.character) {
                    case 'bear':
                        // Bear is taller, adjust drawing position
                        drawY += 8; // Lower the Bear by 8 pixels
                        drawHeight += 5;
                        break;
                    case 'frog':
                        // Frog is shorter, adjust drawing position
                        drawY += 5;
                        drawHeight -= 5;
                        break;
                }
                
                // Apply coffee tint if active
                if (this.activeItems.coffee && this.coffeeTint.active) {
                    this.ctx.save();
                    
                    // Draw character normally
                    this.ctx.drawImage(
                        this.characterImage,
                        this.player.x,
                        drawY,
                        this.player.width,
                        drawHeight
                    );
                    
                    // Apply golden tint overlay with improved gradient
                    const tintGradient = this.ctx.createRadialGradient(
                        playerCenterX, playerCenterY, 0,
                        playerCenterX, playerCenterY, this.player.width
                    );
                    tintGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)'); // Brighter gold at center
                    tintGradient.addColorStop(0.7, 'rgba(255, 140, 0, 0.3)'); // Orange-gold at edges
                    tintGradient.addColorStop(1, 'rgba(255, 69, 0, 0.2)'); // Slight red-orange tint at the outer edge
                    
                    // Add pulsating glow effect in a separate context state
                    this.ctx.save();
                    // Create pulsating animation based on time
                    const pulseAmount = Math.sin(Date.now() * 0.008) * 0.1 + 0.9; // Value between 0.8 and 1.0
                    const auraSize = this.player.width * 1.3 * pulseAmount;
                    
                    // Create energetic glow with multiple layers
                    const glowGradient = this.ctx.createRadialGradient(
                        playerCenterX, playerCenterY, this.player.width * 0.5,
                        playerCenterX, playerCenterY, auraSize
                    );
                    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)'); // Gold
                    glowGradient.addColorStop(0.6, 'rgba(255, 140, 0, 0.1)'); // Orange
                    glowGradient.addColorStop(1, 'rgba(255, 69, 0, 0)'); // Transparent red-orange
                    
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(playerCenterX, playerCenterY, auraSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Add energy burst lines radiating outward
                    const numLines = 12;
                    const maxLineLength = this.player.width * 0.8 * pulseAmount;
                    
                    this.ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)'; // Orange
                    this.ctx.lineWidth = 2;
                    
                    for (let i = 0; i < numLines; i++) {
                        const angle = (i / numLines) * Math.PI * 2;
                        const lineLength = maxLineLength * (0.6 + Math.random() * 0.4); // Varied lengths
                        
                        const startX = playerCenterX + Math.cos(angle) * (this.player.width * 0.6);
                        const startY = playerCenterY + Math.sin(angle) * (this.player.width * 0.6);
                        const endX = playerCenterX + Math.cos(angle) * (this.player.width * 0.6 + lineLength);
                        const endY = playerCenterY + Math.sin(angle) * (this.player.width * 0.6 + lineLength);
                        
                        this.ctx.beginPath();
                        this.ctx.moveTo(startX, startY);
                        this.ctx.lineTo(endX, endY);
                        this.ctx.stroke();
                    }
                    
                    this.ctx.restore();
                    this.ctx.restore();
                } else {
                    // Draw player normally
                    this.ctx.drawImage(
                        this.characterImage,
                        this.player.x,
                        drawY,
                        this.player.width,
                        drawHeight
                    );
                }
            } else {
                // Fallback to rectangle if image not loaded
                this.ctx.fillStyle = '#FFA500';
                this.ctx.fillRect(
                    this.player.x,
                    this.player.y,
                    this.player.width,
                    this.player.height
                );
            }
            
            // Restore the context state
            this.ctx.restore();
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
            
            // Draw token counter with pixelated font
            const fontSize = Math.min(this.canvas.width / 40, this.canvas.height / 20);
            this.ctx.save();
            this.ctx.fillStyle = '#FFD700'; // Gold color for $Grind
            this.ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillText(`$GRIND: ${window.gameState.getBalance()}`, 20, 20);
            this.ctx.restore();
        }
        
        drawHUD() {
            const fontSize = Math.min(this.canvas.width / 40, this.canvas.height / 20);
            const spacing = fontSize + 15;
            this.ctx.save();
            this.ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Simple visibility check for blinking
            const isVisible = this.blinkValue < 0.5;
            
            // Draw score with gold color
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width - 20, 20);
            
            // Draw speed with cyan color
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillText(`SPEED: ${this.gameSpeed.toFixed(1)}`, this.canvas.width - 20, 20 + spacing);
            
            // Draw coffee power duration if active
            if (this.activeItems.coffee) {
                const remainingTime = Math.ceil((this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime)) / 1000);
                const progress = (this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime)) / this.coffeePowerDuration;
                const coffeeWarning = (this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime)) <= this.warningThreshold;
                
                // Simple blinking effect for text
                if (coffeeWarning && !isVisible) {
                    // Text is invisible during blink
                    this.ctx.fillStyle = 'rgba(139, 69, 19, 0)';
                } else {
                this.ctx.fillStyle = '#8B4513';
                }
                
                this.ctx.fillText(`COFFEE: ${remainingTime}s`, this.canvas.width - 20, 20 + spacing * 2);
                
                // Draw progress bar
                const barWidth = 100;
                const barHeight = 10;
                const barX = this.canvas.width - barWidth - 20;
                const barY = 20 + spacing * 2 + fontSize;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress bar with simple blink
                if (coffeeWarning && !isVisible) {
                    // Don't draw progress during blink
                } else {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                }
            }
            
            // Draw magnet duration if active
            if (this.activeItems.magnet) {
                const remainingTime = Math.ceil((this.magnetDuration - (Date.now() - this.magnetStartTime)) / 1000);
                const progress = (this.magnetDuration - (Date.now() - this.magnetStartTime)) / this.magnetDuration;
                const magnetWarning = (this.magnetDuration - (Date.now() - this.magnetStartTime)) <= this.warningThreshold;
                
                // Simple blinking effect for text
                if (magnetWarning && !isVisible) {
                    // Text is invisible during blink
                    this.ctx.fillStyle = 'rgba(255, 165, 0, 0)';
                } else {
                this.ctx.fillStyle = '#FFA500';
                }
                
                this.ctx.fillText(`MAGNET: ${remainingTime}s`, this.canvas.width - 20, 20 + spacing * (this.activeItems.coffee ? 3 : 2));
                
                // Draw progress bar
                const barWidth = 100;
                const barHeight = 10;
                const barX = this.canvas.width - barWidth - 20;
                const barY = 20 + spacing * (this.activeItems.coffee ? 3 : 2) + fontSize;
                
                // Background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress bar with simple blink
                if (magnetWarning && !isVisible) {
                    // Don't draw progress during blink
                } else {
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
                }
            }
            
            // Draw $GRIND balance on the left side
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#FFD700'; // Gold color for $GRIND
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            this.ctx.fillText(`$GRIND: ${window.gameState.getBalance()}`, 20, 20);
            
            this.ctx.restore();
        }
        
        drawGameOver() {
            // Add a semi-transparent overlay to dim the game
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // The actual game over UI is now handled by the modal
        }

        gameOver() {
            this.isGameOver = true;
            
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
                localStorage.setItem('highScore', this.highScore.toString());
            }
            
            // Update profile statistics
            const currentGamesPlayed = parseInt(localStorage.getItem('gamesPlayed') || '0');
            localStorage.setItem('gamesPlayed', (currentGamesPlayed + 1).toString());
            
            const currentTotalGrind = parseInt(localStorage.getItem('totalGrind') || '0');
            localStorage.setItem('totalGrind', (currentTotalGrind + this.tokensCollected).toString());
            
            // Show game over modal
            const gameOverModal = document.querySelector('.game-over-modal');
            const scoreElement = gameOverModal.querySelector('#game-over-score');
            const highScoreElement = gameOverModal.querySelector('#game-over-high-score');
            const tokensElement = gameOverModal.querySelector('#game-over-tokens');
            
            // Update stats
            scoreElement.textContent = this.score;
            highScoreElement.textContent = this.highScore;
            tokensElement.textContent = this.tokensCollected; // Display tokens collected in current game
            
            // Show modal
            gameOverModal.classList.add('active');
            
            // Remove game-running class from game container only
            // Keep it on document.body to keep balance display hidden
            this.gameContainer.classList.remove('game-running');
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
            this.explosionEffects = []; // Add explosion effects array
            this.collectionEffects = []; // Add collection effects array
            this.distance = 0;
            this.scoreMultiplier = 1;
            this.lastSpeedIncrease = Date.now();
            this.lastObstacleSpawn = Date.now();
            this.lastTokenSpawn = Date.now();
            this.combo = 0;
            this.lastTokenCollectTime = 0;
            this.tokensCollected = 0; // Reset token counter for new game
            
            // Reset active items
            this.activeItems = {
                magnet: false,
                coffee: false
            };
            
            // Reset gameState active items
            window.gameState.setItemActive('Coffee', false);
            window.gameState.setItemActive('Magnet', false);
            console.log('Game Reset: Items deactivated in gameState');
            
            // Reset player
            this.player.y = this.groundY - this.player.height - (20 * Math.min(this.canvas.width / 800, this.canvas.height / 400));
            this.player.velocityY = 0;
            this.player.jumping = false;
            
            // Show pause button
            document.querySelector('.pause-btn').style.display = 'block';
            
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
            document.body.classList.add('game-running');
            this.gameContainer.classList.add('game-running');
            
            // Force a game loop update
            this.update();
            this.draw();
            
            // Clear shield timeout
            if (this.shieldTimeout) {
                clearTimeout(this.shieldTimeout);
                this.shieldTimeout = null;
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
            // Create a simple collection effect at the given position
            const effect = new CollectionEffect(x, y);
            this.collectionEffects.push(effect);
        }
        
        updateCollectionEffects() {
            // Update all collection effects and remove finished ones
            this.collectionEffects = this.collectionEffects.filter(effect => effect.update());
        }
        
        drawCollectionEffects() {
            // Draw all collection effects
            this.collectionEffects.forEach(effect => effect.draw(this.ctx));
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
                this.tokens[i].update();
                
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
            
            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            
            // Check spacing from other tokens using proper collision detection
            const tooCloseToToken = this.tokens.some(token => {
                // Rectangle collision detection with safety margin
                const tokenRight = token.x + token.width;
                const tokenBottom = token.y + token.height;
                const newTokenX = this.canvas.width;
                const newTokenY = randomHeight;
                const newTokenWidth = 30 * scale;
                const newTokenHeight = 30 * scale;
                const newTokenRight = newTokenX + newTokenWidth;
                const newTokenBottom = newTokenY + newTokenHeight;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    newTokenRight + margin < token.x || 
                    newTokenX > tokenRight + margin || 
                    newTokenBottom + margin < token.y || 
                    newTokenY > tokenBottom + margin
                );
            });
            
            // Check if token is too close to any obstacle
            const tooCloseToObstacle = this.obstacles.some(obstacle => {
                // Rectangle collision detection with safety margin
                const obstacleRight = obstacle.x + obstacle.width;
                const obstacleBottom = obstacle.y + obstacle.height;
                const newTokenX = this.canvas.width;
                const newTokenY = randomHeight;
                const newTokenWidth = 30 * scale;
                const newTokenHeight = 30 * scale;
                const newTokenRight = newTokenX + newTokenWidth;
                const newTokenBottom = newTokenY + newTokenHeight;
                
                // Add safety margin (80 scale units) - larger margin for obstacles
                const margin = 80 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    newTokenRight + margin < obstacle.x || 
                    newTokenX > obstacleRight + margin || 
                    newTokenBottom + margin < obstacle.y || 
                    newTokenY > obstacleBottom + margin
                );
            });
            
            // Check spacing from items - using full collision detection with all items
            const tooCloseToItem = this.items.some(item => {
                // Rectangle collision detection with safety margin
                const itemRight = item.x + item.width;
                const itemBottom = item.y + item.height;
                const newTokenX = this.canvas.width;
                const newTokenY = randomHeight;
                const newTokenWidth = 30 * scale;
                const newTokenHeight = 30 * scale;
                const newTokenRight = newTokenX + newTokenWidth;
                const newTokenBottom = newTokenY + newTokenHeight;
                
                // Add safety margin (20 scale units)
                const margin = 20 * scale;
                
                // Check if the rectangles would overlap with margin
                return !(
                    newTokenRight + margin < item.x || 
                    newTokenX > itemRight + margin || 
                    newTokenBottom + margin < item.y || 
                    newTokenY > itemBottom + margin
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
                    
                    // Increment tokens collected counter
                    this.tokensCollected++;
                    
                    // Update the global game state balance
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
                
                // Show pause overlay
                document.querySelector('.pause-overlay').classList.add('active');
                
                // Hide pause button
                document.querySelector('.pause-btn').style.display = 'none';
                
                // Update settings toggles
                document.querySelector('#pause-music-toggle').checked = window.audioState.musicEnabled;
                document.querySelector('#pause-sfx-toggle').checked = window.audioState.sfxEnabled;
                document.querySelector('#pause-theme-toggle').checked = localStorage.getItem('theme') === 'night';
                
                // Ensure main menu toggles are also in sync
                const musicToggle = document.getElementById('music-toggle');
                const sfxToggle = document.getElementById('sfx-toggle');
                const themeToggle = document.getElementById('theme-toggle');
                
                if (musicToggle) {
                    musicToggle.checked = window.audioState.musicEnabled;
                }
                if (sfxToggle) {
                    sfxToggle.checked = window.audioState.sfxEnabled;
                }
                if (themeToggle) {
                    themeToggle.checked = localStorage.getItem('theme') === 'night';
                }
            } else {
                // Resume the game
                if (window.audioState.musicEnabled) {
                    this.backgroundMusic.play().catch(err => console.error('Error playing background music:', err));
                }
                
                // Hide pause overlay
                document.querySelector('.pause-overlay').classList.remove('active');
                
                // Show pause button
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
            
            // Stop all audio
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.gameOverSound.pause();
            this.gameOverSound.currentTime = 0;
            this.jumpSound.pause();
            this.jumpSound.currentTime = 0;
            this.hitSound.pause();
            this.hitSound.currentTime = 0;
            this.tokenSound.pause();
            this.tokenSound.currentTime = 0;
            
            // Stop game state
            this.isGameOver = true;
            this.isPaused = true;
            
            // Cancel all game loops and spawning
            clearTimeout(this.obstacleSpawnTimeout);
            clearTimeout(this.tokenSpawnTimeout);
            clearTimeout(this.itemSpawnTimeout);
            
            // Clear any active item timers
            if (this.coffeePowerTimeout) {
                clearTimeout(this.coffeePowerTimeout);
            }
            if (this.magnetTimeout) {
                clearTimeout(this.magnetTimeout);
            }
            if (this.shieldTimeout) {
                clearTimeout(this.shieldTimeout);
            }
            
            // Reset the active items in gameState
            window.gameState.setItemActive('Coffee', false);
            window.gameState.setItemActive('Magnet', false);
            console.log('Game Destroyed: Items deactivated in gameState');
            
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
            
            // Remove game-running classes
            document.body.classList.remove('game-running');
            if (this.gameContainer) {
                this.gameContainer.classList.remove('game-running');
            }
            
            // Show start screen
            document.querySelector('.start-screen').style.display = 'flex';
            
            // Show settings container with proper display style
            const settingsContainer = document.querySelector('.settings-container');
            settingsContainer.style.display = 'flex';
            
            // Reset any positioning issues
            settingsContainer.style.position = 'fixed';
            settingsContainer.style.top = '20px';
            settingsContainer.style.right = '20px';
        }

        drawActiveItems() {
            const scale = Math.min(this.canvas.width / 800, this.canvas.height / 400);
            const iconSize = 20 * scale;
            const startX = 20;
            const startY = 60;
            const spacing = 30 * scale;
            
            let activeCount = 0;
            
            // Simple blink check
            const isVisible = this.blinkValue < 0.5;
            
            // Draw active item icons
            for (const [item, isActive] of Object.entries(this.activeItems)) {
                if (isActive) {
                    const image = this.itemImages[item];
                    const x = startX + (activeCount * spacing);
                    
                    // Check if effect is about to end
                    let isWarning = false;
                    let timeRemaining = 0;
                    
                    if (item === 'coffee' && this.coffeePowerStartTime) {
                        timeRemaining = this.coffeePowerDuration - (Date.now() - this.coffeePowerStartTime);
                        isWarning = timeRemaining <= this.warningThreshold;
                    } else if (item === 'magnet' && this.magnetStartTime) {
                        timeRemaining = this.magnetDuration - (Date.now() - this.magnetStartTime);
                        isWarning = timeRemaining <= this.warningThreshold;
                    }
                    
                    // Only draw if not in warning mode or if visible during blink
                    if (!isWarning || isVisible) {
                    if (image && image.complete) {
                        this.ctx.drawImage(
                            image,
                            x,
                            startY,
                            iconSize,
                            iconSize
                        );
                    } else {
                        // Fallback if image not loaded
                        this.ctx.fillStyle = '#00FF00';
                        this.ctx.fillRect(
                            x,
                            startY,
                            iconSize,
                            iconSize
                        );
                        }
                        
                        // Draw countdown text if warning is active
                        if (isWarning) {
                            const seconds = Math.ceil(timeRemaining / 1000);
                            this.ctx.font = `${Math.floor(10 * scale)}px Arial`;
                            this.ctx.fillStyle = 'white';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(seconds.toString(), x + iconSize / 2, startY + iconSize + 12 * scale);
                        }
                    }
                    
                    activeCount++;
                }
            }
        }

        // Add this method after the constructor
        createGameOverModal() {
            // Check if modal already exists and remove it
            const existingModal = document.querySelector('.game-over-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Create game over modal
            const gameOverModal = document.createElement('div');
            gameOverModal.className = 'game-over-modal';
            gameOverModal.innerHTML = `
                <div class="game-over-content">
                    <h2>Game Over</h2>
                    <div class="game-over-stats">
                        <p>Score: <span id="game-over-score">0</span></p>
                        <p>High Score: <span id="game-over-high-score">0</span></p>
                        <p>Tokens: <span id="game-over-tokens">0</span></p>
                    </div>
                    <div class="game-over-buttons">
                        <button class="game-over-restart-btn">Restart</button>
                        <button class="game-over-home-btn">Home Page</button>
                    </div>
                    <div class="restart-hint">
                        Press <span class="key">↑</span> or <span class="key">Space</span> to restart
                    </div>
                </div>
            `;
            document.body.appendChild(gameOverModal);
            
            // Add event listeners for game over buttons
            const gameOverRestartBtn = gameOverModal.querySelector('.game-over-restart-btn');
            const gameOverHomeBtn = gameOverModal.querySelector('.game-over-home-btn');
            
            gameOverRestartBtn.addEventListener('click', () => {
                // Stop game over sound immediately
                this.gameOverSound.pause();
                this.gameOverSound.currentTime = 0;
                
                // Hide game over modal first
                gameOverModal.classList.remove('active');
                
                // Reset the game
                this.resetGame();
            });
            
            gameOverHomeBtn.addEventListener('click', () => {
                // Stop game over sound immediately
                this.gameOverSound.pause();
                this.gameOverSound.currentTime = 0;
                
                // Hide game over modal
                gameOverModal.classList.remove('active');
                
                // Instead of resetting, properly destroy the game
                this.destroy();
                
                // Make sure to nullify the game reference and set gameRunning to false
                currentGame = null;
                gameRunning = false;
                
                // These are not needed as destroy() handles them
                // document.body.classList.remove('game-running');
                // this.gameContainer.classList.remove('game-running');
                // document.querySelector('.start-screen').style.display = 'flex';
            });
        }
        
        // Add method to activate inventory items
        activateInventoryItem(itemId) {
            // Convert the itemId to gameState format
            const gameStateItemId = itemId.charAt(0).toUpperCase() + itemId.slice(1);
            
            // Check if the item is owned
            if (window.gameState.getItemQuantity(gameStateItemId) <= 0) {
                showMessage("You don't own this item!", 'error');
                return;
            }
            
            // Check if the item is already active
            if (window.gameState.isItemActive(gameStateItemId)) {
                showMessage(`${gameStateItemId} already active!`, 'warning');
                return;
            }
            
            // Decrement the item quantity - Added to fix the quantity issue
            window.gameState.decrementItem(gameStateItemId);
            
            // Apply the item effect
            this.applyItemEffect(itemId);
            
            
            // Set the item as active in gameState
            window.gameState.setItemActive(gameStateItemId, true);
            
            // Play activation sound
            if (window.audioState.sfxEnabled) {
                const activationSound = new Audio(getAssetPath(`assets/sound/${itemId}-activation.wav`));
                activationSound.volume = 0.3;
                activationSound.onerror = () => {
                    console.error(`Failed to load ${itemId} activation sound`);
                };
                activationSound.play().catch(e => console.error('Error playing sound:', e));
            }
            
            // Show message
            showMessage(`${gameStateItemId} activated!`, 'success');
            
            // Update the inventory display to show the new quantity
            if (window.inventory) {
                window.inventory.updateMiniInventory();
                window.inventory.updateInventory();
            }
        }
    }

    // Start button click handler
    startButton.addEventListener('click', () => {
        console.log('Start button clicked');
        document.querySelector('.start-screen').style.display = 'none';
        document.querySelector('.settings-container').style.display = 'none';
        pauseButton.style.display = 'block';
        gameRunning = true;
        document.body.classList.add('game-running');
        
        // Create game instance safely to avoid ReferenceError
        setTimeout(() => {
            window.currentGame = new Game();
            window.currentGame.init();
        }, 0);
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
            image: 'assets/images/coffee.png', // Use coffee.png as a temporary replacement
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
            id: 'coffee',
            name: '☕ Coffee',
            price: 1000,
            image: 'assets/images/coffee.png',
            description: 'Makes you invincible with a caffeine rush'
        }
    ];

    // Initialize store
    function initStore() {
        const storeItemsContainer = document.querySelector('.store-items');
        const storeBalance = document.querySelector('.store-balance');
        const balance = window.gameState.getBalance();

    // Update balance display
        storeBalance.textContent = `Balance: ${balance} $Grind`;
        
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
            // Update gameState balance
            window.gameState.updateBalance(currentBalance - item.price);
            
            // Save the purchased item
            const ownedItems = JSON.parse(localStorage.getItem('ownedItems') || '[]');
            ownedItems.push(item.id);
            localStorage.setItem('ownedItems', JSON.stringify(ownedItems));
            
            // Update displays
            initStore();
            
            // Show success message
            showMessage(`Successfully purchased ${item.name}!`, 'success');
        } else {
            showMessage('Not enough $Grind!', 'error');
        }
    }

    // Show message
    function showMessage(text, type = 'success') {
        // Remove any existing messages to prevent stacking
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        // Message will be removed by CSS animation
    }

    // Initialize store when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        initStore();
    });

    // Initialize character selection
    function initCharacterSelection() {
        const characters = ['hamster', 'bear', 'frog'];
        const characterSelector = document.querySelector('.character-selector');
        
        // Get purchased characters from localStorage
        const purchasedCharacters = JSON.parse(localStorage.getItem('purchasedCharacters')) || ['hamster'];
        
        // Get selected character from localStorage or default to hamster
        const savedSelectedCharacter = localStorage.getItem('selectedCharacter') || 'hamster';
        
        // Create or update the selected character display
        let characterDisplay = document.querySelector('.selected-character-display');
        if (!characterDisplay) {
            characterDisplay = document.createElement('div');
            characterDisplay.className = 'selected-character-display';
            const titleElement = document.querySelector('.title');
            if (titleElement) {
                titleElement.parentNode.insertBefore(characterDisplay, titleElement.nextSibling);
            }
        }
        characterDisplay.textContent = `Playing as: ${savedSelectedCharacter.charAt(0).toUpperCase() + savedSelectedCharacter.slice(1)}`;
        
        // Clear previous character containers
        if (characterSelector) {
            characterSelector.innerHTML = '';
        }
        
        characters.forEach(character => {
            const container = document.createElement('div');
            container.className = 'character-container';
            container.dataset.character = character;
            // Set cursor to pointer for all character containers
            container.style.cursor = 'pointer';
            
            // Check if character is unlocked either in gameState or in localStorage
            const isUnlocked = (window.gameState && window.gameState.getCharacters().includes(character)) || 
                              purchasedCharacters.includes(character);
            
            if (!isUnlocked && character !== 'hamster') {
                container.classList.add('locked');
            } else {
                container.classList.add('unlocked');
            }
            
            // Add selected class if this is the selected character
            if (character === savedSelectedCharacter) {
                container.classList.add('selected');
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
                if (container.classList.contains('locked')) {
                    showMessage('This character is locked!', 'warning');
                } else {
                    selectCharacter(character);
                    // Update the character display when selected
                    characterDisplay.textContent = `Playing as: ${character.charAt(0).toUpperCase() + character.slice(1)}`;
                }
            });
        });
    }

    // Function to load profile data from local storage
    function loadProfileData() {
        // Always fetch the latest values from localStorage
        const username = localStorage.getItem('username') || 'Player1';
        const highScore = localStorage.getItem('highScore') || '0';
        const avatarSrc = localStorage.getItem('avatarSrc') || getAssetPath('assets/images/default-avatar.png');
        
        // Update the DOM elements with the latest values
        document.getElementById('profile-username').textContent = username;
        document.getElementById('profile-highscore').textContent = highScore;
        document.getElementById('profile-avatar').src = avatarSrc;
        
        // Get the edit username modal and elements
        const editUsernameModal = document.getElementById('editUsernameModal');
        const usernameInput = document.getElementById('usernameInput');
        const saveUsernameBtn = document.getElementById('saveUsernameBtn');
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        const editModalCloseBtn = editUsernameModal.querySelector('.close-btn');
        
        // Set up edit button functionality
        const editButtons = document.querySelectorAll('.edit-profile-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const field = this.dataset.field;
                if (field === 'username') {
                    // Set the current username in the input field
                    const currentValue = document.getElementById(`profile-${field}`).textContent;
                    usernameInput.value = currentValue;
                    
                    // Show the edit username modal
                    showModal('editUsernameModal');
                    usernameInput.focus();
                }
            });
        });
        
        // Handle save username button click
        saveUsernameBtn.addEventListener('click', function() {
            const newUsername = usernameInput.value.trim();
            if (newUsername !== '') {
                document.getElementById('profile-username').textContent = newUsername;
                localStorage.setItem('username', newUsername);
                hideModal('editUsernameModal');
            }
        });
        
        // Handle cancel button click
        cancelEditBtn.addEventListener('click', function() {
            hideModal('editUsernameModal');
        });
        
        // Handle close button click
        editModalCloseBtn.addEventListener('click', function() {
            hideModal('editUsernameModal');
        });
        
        // Handle enter key press in the input field
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                saveUsernameBtn.click();
            }
        });
        
        // Set up change avatar button
        const changeAvatarBtn = document.querySelector('.change-avatar-btn');
        const avatarUploadInput = document.getElementById('avatar-upload');
        
        if (changeAvatarBtn && avatarUploadInput) {
            // Show upload dialog when button is clicked
            changeAvatarBtn.addEventListener('click', function() {
                avatarUploadInput.click();
            });
            
            // Handle file selection
            avatarUploadInput.addEventListener('change', function(e) {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    
                    // Check file type and size
                    if (!file.type.match('image.*')) {
                        showMessage('Please select an image file', 'error');
                        return;
                    }
                    
                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                        showMessage('Image file is too large. Maximum size is 5MB', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        try {
                            // Set the image source
                            const avatarElement = document.getElementById('profile-avatar');
                            avatarElement.src = e.target.result;
                            
                            // Save to localStorage
                            localStorage.setItem('avatarSrc', e.target.result);
                            
                            // Remove success notification
                            // showMessage('Avatar updated successfully!', 'success');
                        } catch (error) {
                            console.error('Error updating avatar:', error);
                            showMessage('Failed to update avatar', 'error');
                        }
                    };
                    
                    reader.onerror = function() {
                        showMessage('Failed to read the image file', 'error');
                    };
                    
                    // Read the file as a data URL
                    reader.readAsDataURL(file);
                }
            });
            
            // Add option to use default avatars via right-click menu
            changeAvatarBtn.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                
                // Only use the default avatar
                const defaultAvatar = getAssetPath('assets/images/default-avatar.png');
                
                document.getElementById('profile-avatar').src = defaultAvatar;
                localStorage.setItem('avatarSrc', defaultAvatar);
                
                // Remove notification
                // showMessage('Reset to default avatar', 'info');
            });
        }
    }

    // Function to initialize profile data
    function initializeProfileData() {
        const defaultAvatar = getAssetPath('assets/images/default-avatar.png');
        
        if (!localStorage.getItem('username')) {
            localStorage.setItem('username', 'Player1');
        }
        if (!localStorage.getItem('highScore')) {
            localStorage.setItem('highScore', '0');
        }
        if (!localStorage.getItem('avatarSrc')) {
            localStorage.setItem('avatarSrc', defaultAvatar);
        }
        
        // Load custom avatar if exists
        const avatarSrc = localStorage.getItem('avatarSrc');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (profileAvatar && avatarSrc) {
            // Check if it's a data URI (custom uploaded avatar)
            if (avatarSrc.startsWith('data:image/')) {
                profileAvatar.onload = function() {
                    console.log('Custom avatar loaded successfully');
                };
                profileAvatar.onerror = function() {
                    console.error('Failed to load custom avatar, reverting to default');
                    localStorage.setItem('avatarSrc', defaultAvatar);
                    profileAvatar.src = defaultAvatar;
                };
            } 
            // If it's not the default avatar but a character avatar, reset to default
            else if (avatarSrc !== defaultAvatar) {
                localStorage.setItem('avatarSrc', defaultAvatar);
                avatarSrc = defaultAvatar;
            }
            
            // Set the avatar source
            profileAvatar.src = avatarSrc;
        }
    }
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
        
        // Update the pause theme toggle
        const pauseThemeToggle = document.querySelector('#pause-theme-toggle');
        if (pauseThemeToggle) {
            pauseThemeToggle.checked = newTheme === 'night';
        }
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
window.addEventListener('DOMContentLoaded', () => {
    // Create game instance safely after the entire script has loaded
    setTimeout(() => {
        const game = new Game();
        
        // Log initialization
        console.log('Game instance created');
    }, 0);
}); 

// Show message
function showMessage(text, type = 'success') {
    // Remove any existing messages to prevent stacking
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Add achievements button click handler
document.addEventListener('DOMContentLoaded', function() {
    // Add click event for achievements button
    const achievementsButton = document.querySelector('.achievements-button');
    if (achievementsButton) {
        achievementsButton.addEventListener('click', function() {
            // Show notification message using the showMessage function
            showMessage("Achievements system coming soon. Your grind will be rewarded!", 'info');
        });
    }
});

// Test function to verify audio paths
function testAudioPaths() {
    console.log("Testing audio paths:");
    
    // Function to test audio file
    function testAudioFile(path) {
        console.log(`Testing path: ${path}`);
        
        const audio = new Audio();
        
        audio.addEventListener('error', () => {
            console.error(`Error loading audio at path: ${path}`);
        });
        
        audio.addEventListener('loadeddata', () => {
            console.log(`Successfully loaded audio: ${path}`);
        });
        
        audio.src = path;
        
        try {
            audio.load();
        } catch (e) {
            console.error(`Exception loading audio at path: ${path}`, e);
        }
    }
    
    // Test music file
    function testMusicFile() {
        const path = getAssetPath('assets/music/music.wav');
        testAudioFile(path);
    }
    
    // Test music file
    testMusicFile();
    
    // Test each sound file
    testAudioFile(getAssetPath('assets/sound/coin.wav'));
    testAudioFile(getAssetPath('assets/sound/jump.wav'));
    testAudioFile(getAssetPath('assets/sound/hit.wav'));
    testAudioFile(getAssetPath('assets/sound/game-over.wav'));
    testAudioFile(getAssetPath('assets/sound/magnet.mp3'));
    testAudioFile(getAssetPath('assets/sound/coffee.mp3'));
    
    console.log("Audio path test initialization complete");
}

// ... existing code ...

// Call the test function when the game initializes
window.addEventListener('load', () => {
    // Allow time for other resources to load first
    setTimeout(testAudioPaths, 2000);
});

