// Shop functionality
class Shop {
    constructor() {
        this.items = [
            {
                id: 'bear_character',
                name: 'Bear',
                description: 'Play as the bear character',
                price: 100,
                image: getAssetPath('assets/images/bear.png'),
                category: 'character',
                owned: false,
                quantity: 0,
                type: 'character',
                characterId: 'bear'
            },
            {
                id: 'frog_character',
                name: 'Frog',
                description: 'Play as the frog character',
                price: 100,
                image: getAssetPath('assets/images/frog.png'),
                category: 'character',
                owned: false,
                quantity: 0,
                type: 'character',
                characterId: 'frog'
            },
            {
                id: 'coffee_item',
                name: 'Coffee',
                description: 'Increases your running speed temporarily',
                price: 50,
                image: getAssetPath('assets/images/coffee.png'),
                category: 'item',
                owned: false,
                quantity: 0,
                type: 'powerup',
                usable: true
            },
            {
                id: 'magnet_item',
                name: 'Magnet',
                description: 'Attracts tokens to you for a short time',
                price: 25,
                image: getAssetPath('assets/images/magnet.png'),
                category: 'item',
                owned: false,
                quantity: 0,
                type: 'powerup',
                usable: true
            }
        ];
        this.loadState();
        this.init();
    }

    init() {
        this.modal = document.querySelector('.shop-modal');
        this.itemsContainer = document.querySelector('.shop-items');
        this.balanceElement = document.querySelector('.balance');
        
        // Note: We no longer handle button events in the Shop class
        // Event handlers for buttons are now managed separately
        
        this.updateBalance();
        this.displayItems();
        this.updateCharacterAvailability();
    }

    // Event listeners are now handled in the DOMContentLoaded handler
    // So we're removing the setupEventListeners method completely

    // These methods remain available for other parts of code to use
    // but are no longer called by event listeners in this class
    openShop() {
        console.log('Opening shop modal (legacy method)');
        if (!this.modal) return;
        
        // Update item ownership from gameState before opening
        this.syncWithGameState();
        
        this.modal.style.display = 'flex';
        setTimeout(() => {
            this.modal.classList.add('active');
            this.updateBalance();
            this.displayItems();
            this.updateCharacterAvailability();
        }, 10);
    }

    closeShop() {
        console.log('Closing shop modal (legacy method)');
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    displayItems() {
        if (!this.itemsContainer) return;
        
        // Always sync with gameState before displaying items
        this.syncWithGameState();
        
        this.itemsContainer.innerHTML = '';
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            
            // Create quantity display for non-character items
            let quantityDisplay = '';
            if (item.type !== 'character') {
                quantityDisplay = `<p class="item-quantity">Owned: ${item.quantity}</p>`;
            }
            
            // Only show description for non-character items
            const descriptionDisplay = item.type !== 'character' ? 
                `<p class="item-description">${item.description}</p>` : '';
            
            // Prepare price element with appropriate class
            const priceClass = item.type === 'character' ? 'item-price character-price' : 'item-price';
            
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <h3 class="item-name">${item.name}</h3>
                ${descriptionDisplay}
                <p class="${priceClass}">Price: ${item.price} $Grind</p>
                ${quantityDisplay}
                <button class="purchase-button" ${item.type === 'character' && item.owned ? 'disabled' : ''}>
                    ${item.type === 'character' && item.owned ? 'Owned' : item.type === 'character' ? 'Unlock' : 'Purchase'}
                </button>
            `;

            const purchaseButton = itemElement.querySelector('.purchase-button');
            purchaseButton.addEventListener('click', () => this.purchaseItem(item));

            this.itemsContainer.appendChild(itemElement);
        });
        
        // Add the "coming soon" message at the bottom of the shop
        const comingSoonMessage = document.createElement('div');
        comingSoonMessage.className = 'shop-coming-soon';
        comingSoonMessage.innerHTML = `
            <p class="coming-soon-text"><span class="highlight">More to grind for</span><br>New items and outfits on the way!</p>
        `;
        
        // Add click event to show a special message when clicked
        comingSoonMessage.addEventListener('click', () => {
            this.showMessage('Stay tuned! Exciting new items coming in the next update!', 'info');
        });
        
        this.itemsContainer.appendChild(comingSoonMessage);
    }

    purchaseItem(item) {
        const currentBalance = window.gameState.getBalance();
        
        if (currentBalance < item.price) {
            this.showMessage('Not enough $Grind!', 'error');
            return;
        }

        if (item.type === 'character' && item.owned) {
            this.showMessage('You already own this character!', 'error');
            return;
        }

        window.gameState.updateBalance(currentBalance - item.price);
        
        this.updateBalance();
        this.saveState();

        if (item.type === 'character') {
            item.owned = true;
            this.unlockCharacter(item.characterId);
        } else if (item.type === 'powerup') {
            // Increment quantity
            item.quantity++;
            
            // Add the powerup to inventory
            if (window.inventory) {
                // Add the item to inventory
                window.inventory.addItem({
                    name: item.name,
                    image: item.image,
                    description: item.description,
                    quantity: 1,
                    usable: item.usable,
                    type: 'powerup'
                });
                
                // Update inventory displays
                window.inventory.updateInventory();
                window.inventory.updateMiniInventory();
                
                // Highlight the item in inventory if it exists
                const inventoryItems = document.querySelectorAll('.inventory-item .item-name');
                let inventoryItem = null;
                
                // Find the item by name using standard DOM traversal
                inventoryItems.forEach(el => {
                    if (el.textContent === item.name) {
                        inventoryItem = el.closest('.inventory-item');
                    }
                });
                
                if (inventoryItem) {
                    inventoryItem.classList.add('quantity-updated');
                    setTimeout(() => inventoryItem.classList.remove('quantity-updated'), 1000);
                }
            }
        }

        // Show purchase success message
        this.showMessage(`Successfully purchased ${item.name}!`, 'success');
        this.displayItems();
    }

    unlockCharacter(characterId) {
        // Enable the character in the character selector
        const characterContainer = document.querySelector(`.character-container[data-character="${characterId}"]`);
        if (characterContainer) {
            characterContainer.classList.remove('locked');
            characterContainer.classList.add('unlocked');
        }

        // Enable the mascot
        const mascot = document.querySelector(`.${characterId}-mascot`);
        if (mascot) {
            mascot.classList.remove('locked');
            mascot.classList.add('unlocked');
        }

        // Save to gameState to persist across refreshes
        if (window.gameState) {
            window.gameState.addCharacter(characterId);
        }

        // Also save to purchasedCharacters in localStorage as backup
        const purchasedCharacters = JSON.parse(localStorage.getItem('purchasedCharacters')) || ['hamster'];
        if (!purchasedCharacters.includes(characterId)) {
            purchasedCharacters.push(characterId);
            localStorage.setItem('purchasedCharacters', JSON.stringify(purchasedCharacters));
        }

        // Update the character selection UI
        if (window.updateCharacterSelectionUI) {
            window.updateCharacterSelectionUI();
        }
    }

    updateCharacterAvailability() {
        this.items.forEach(item => {
            if (item.type === 'character') {
                const characterContainer = document.querySelector(`.character-container[data-character="${item.characterId}"]`);
                if (characterContainer) {
                    if (item.owned) {
                        characterContainer.classList.remove('locked');
                        characterContainer.classList.add('unlocked');
                    } else {
                        characterContainer.classList.add('locked');
                        characterContainer.classList.remove('unlocked');
                    }
                }
            }
        });
    }

    updateBalance() {
        if (this.balanceElement) {
            const balance = window.gameState.getBalance();
            this.balanceElement.textContent = `Balance: ${balance} $Grind`;
        }
    }

    showMessage(text, type = 'success') {
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

    saveState() {
        localStorage.setItem('shopState', JSON.stringify(this.items));
    }

    loadState() {
        // First load from shopState in localStorage
        const savedState = localStorage.getItem('shopState');
        if (savedState) {
            try {
                const savedItems = JSON.parse(savedState);
                this.items = this.items.map(item => {
                    const savedItem = savedItems.find(si => si.name === item.name);
                    return savedItem ? { ...item, owned: savedItem.owned } : item;
                });
            } catch (e) {
                console.error('Error loading shop state:', e);
            }
        }
        
        // Then check gameState for character ownership to ensure consistency
        if (window.gameState) {
            const ownedCharacters = window.gameState.getCharacters() || [];
            this.items.forEach(item => {
                if (item.type === 'character' && ownedCharacters.includes(item.characterId)) {
                    item.owned = true;
                }
            });
            // Save the corrected state
            this.saveState();
        }
    }

    // Add a new method to sync shop state with gameState
    syncWithGameState() {
        if (window.gameState) {
            const ownedCharacters = window.gameState.getCharacters() || [];
            this.items.forEach(item => {
                if (item.type === 'character') {
                    // Update ownership status based on gameState
                    item.owned = ownedCharacters.includes(item.characterId);
                } else if (item.type === 'powerup') {
                    // Update powerup quantities directly from gameState instead of inventory
                    const quantity = window.gameState.getItemQuantity(item.name);
                    item.quantity = quantity;
                    item.owned = quantity > 0;
                }
            });
            this.saveState();
        }
    }
}

// Initialize shop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create shop instance globally
    window.shop = new Shop();
    
    // Also ensure the main balance display is updated
    const mainBalance = document.getElementById('main-balance');
    if (mainBalance) {
        mainBalance.textContent = `Balance: ${window.gameState.getBalance()} $Grind`;
    }
    
    // Fix missing wallet and leaderboard button functionality
    const walletButton = document.querySelector('.wallet-button');
    if (walletButton) {
        walletButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Wallet button clicked');
            showMessage('Wallet support is in the works. Soon you\'ll flex those $Grind tokens properly! 💼', 'info');
        };
    }
    
    const leaderboardButton = document.querySelector('.leaderboard-button');
    if (leaderboardButton) {
        leaderboardButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Leaderboard button clicked');
            showMessage('Leaderboard feature coming soon!', 'info');
        };
    }
    
    // COMPLETE REPLACEMENT OF SHOP BUTTON HANDLING
    // Remove the old shop button from DOM and create a fresh one to eliminate any issues
    const shopButtonContainer = document.querySelector('.shop-button').parentNode;
    const oldShopButton = document.querySelector('.shop-button');
    
    if (shopButtonContainer && oldShopButton) {
        // Create a brand new button element
        const newShopButton = document.createElement('button');
        newShopButton.className = 'menu-button shop-button';
        newShopButton.textContent = 'Shop';
        
        // Replace the old one
        shopButtonContainer.replaceChild(newShopButton, oldShopButton);
        
        console.log('Replaced shop button with fresh element');
        
        // Add click handler to the new button
        newShopButton.onclick = function(e) {
            console.log('Shop button clicked directly');
            e.preventDefault();
            e.stopPropagation();
            
            const shopModal = document.querySelector('.shop-modal');
            if (shopModal) {
                console.log('Found shop modal, toggling visibility');
                
                // Force display block to ensure the element is visible in the DOM
                shopModal.style.display = 'flex';
                
                // Give browser a moment to register the display change
                setTimeout(() => {
                    // Then add active class for animation
                    shopModal.classList.add('active');
                    
                    // Update shop content after opening
                    if (window.shop) {
                        // Sync with gameState before updating UI
                        window.shop.syncWithGameState();
                        window.shop.updateBalance();
                        window.shop.displayItems();
                        window.shop.updateCharacterAvailability();
                    }
                }, 10);
            } else {
                console.error('Shop modal not found in DOM');
            }
        };
    } else {
        console.error('Could not find shop button or its container');
    }
    
    // Helper function to close the shop modal
    function closeShopModal() {
        const shopModal = document.querySelector('.shop-modal');
        if (shopModal) {
            // Remove active class first (for animation)
            shopModal.classList.remove('active');
            
            // Check if this modal was opened from a paused game and show pause overlay IMMEDIATELY
            if (shopModal.classList.contains('from-paused-game')) {
                shopModal.classList.remove('from-paused-game');
                // Show pause overlay immediately without delay
                const pauseOverlay = document.querySelector('.pause-overlay');
                if (pauseOverlay) {
                    pauseOverlay.classList.add('active');
                }
            }
            
            // Hide after animation completes
            setTimeout(() => {
                shopModal.style.display = 'none';
            }, 300);
        }
    }
    
    // Also directly handle the close button
    const closeShopButton = document.querySelector('.shop-modal .close-button');
    if (closeShopButton) {
        closeShopButton.onclick = function(e) {
            console.log('Close button clicked directly');
            e.preventDefault();
            e.stopPropagation();
            closeShopModal();
        };
    }
    
    // Add click handler to the modal background for closing
    const shopModal = document.querySelector('.shop-modal');
    if (shopModal) {
        shopModal.addEventListener('click', function(e) {
            // Only close if clicking directly on the modal (background), not its contents
            if (e.target === shopModal) {
                console.log('Clicked on shop modal background');
                closeShopModal();
            }
        });
    }
    
    // Add escape key handler for closing the shop
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const shopModal = document.querySelector('.shop-modal');
            if (shopModal && shopModal.classList.contains('active')) {
                console.log('Escape key pressed, closing shop');
                closeShopModal();
            }
        }
    });
    
    // Also set up the pause menu shop button
    const pauseShopBtn = document.querySelector('.shop-btn');
    if (pauseShopBtn) {
        pauseShopBtn.onclick = function(e) {
            console.log('Pause menu shop button clicked');
            e.preventDefault();
            e.stopPropagation();
            
            // Hide pause overlay
            const pauseOverlay = document.querySelector('.pause-overlay');
            if (pauseOverlay) {
                pauseOverlay.classList.remove('active');
            }
            
            // Show shop modal
            const shopModal = document.querySelector('.shop-modal');
            if (shopModal) {
                shopModal.style.display = 'flex';
                setTimeout(() => {
                    shopModal.classList.add('active');
                    
                    // Mark the modal as coming from the pause screen
                    shopModal.classList.add('from-paused-game');
                    
                    // Update shop content
                    if (window.shop) {
                        window.shop.syncWithGameState();
                        window.shop.updateBalance();
                        window.shop.displayItems();
                        window.shop.updateCharacterAvailability();
                    }
                }, 10);
            }
        };
    }
    
    // Ensure shop state is always in sync on page load
    if (window.shop && window.inventory) {
        // Initially sync shop with inventory
        window.shop.syncWithGameState();
    }
}); 