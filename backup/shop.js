// Shop functionality
class Shop {
    constructor() {
        this.items = [
            {
                id: 'bear',
                name: 'Bear',
                price: 100,
                image: 'assets/images/Bear.png',
                type: 'character',
                characterId: 'bear'
            },
            {
                id: 'frog',
                name: 'Frog',
                price: 100,
                image: 'assets/images/Frog.png',
                type: 'character',
                characterId: 'frog'
            },
            {
                id: 'coffee',
                name: 'Coffee',
                price: 50,
                image: 'assets/images/coffee.png',
                description: 'Temporary invincibility for 20 seconds',
                type: 'powerup'
            },
            {
                id: 'magnet',
                name: 'Magnet',
                price: 25,
                image: 'assets/images/magnet.png',
                description: 'Attracts nearby coins for 20 seconds',
                type: 'powerup'
            }
        ];
        
        // Initialize gameState if not already initialized
        if (!window.gameState) {
            console.error('GameState is not initialized. Please ensure gameState.js is loaded before shop.js');
            return;
        }
        this.init();
    }

    init() {
        this.modal = document.querySelector('.shop-modal');
        this.itemsContainer = document.querySelector('.shop-items');
        this.balanceElement = document.querySelector('.balance');
        this.closeButton = this.modal?.querySelector('.close-button');
        this.shopButton = document.querySelector('.shop-button');

        if (!this.modal || !this.itemsContainer || !this.balanceElement || !this.closeButton || !this.shopButton) {
            console.error('Required shop elements not found');
            return;
        }

        this.updateBalance();
        this.setupEventListeners();
        this.displayItems();
        this.updateCharacterAvailability();

        // Subscribe to gameState changes
        if (window.gameState) {
            window.gameState.subscribe((state) => {
                this.updateBalance();
                this.updateCharacterAvailability();
                this.displayItems(); // Refresh items when gameState changes
            });
        } else {
            console.error('GameState not found');
        }
    }

    setupEventListeners() {
        console.log('Setting up shop event listeners');
        console.log('Close button:', this.closeButton);
        console.log('Shop button:', this.shopButton);
        
        this.closeButton.addEventListener('click', () => {
            console.log('Close button clicked');
            this.closeShop();
        });
        
        this.shopButton.addEventListener('click', () => {
            console.log('Shop button clicked');
            this.openShop();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeShop();
            }
        });
    }

    openShop() {
        console.log('Opening shop modal');
        console.log('Modal element:', this.modal);
        this.modal.classList.add('active');
        this.displayItems();
        this.updateCharacterAvailability();
    }

    closeShop() {
        this.modal.classList.remove('active');
    }

    displayItems() {
        if (!this.itemsContainer) {
            console.error('Shop items container not found');
            return;
        }
        
        this.itemsContainer.innerHTML = '';
        this.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';
            itemElement.setAttribute('data-type', item.type);
            
            // Check if character is unlocked
            let isUnlocked = false;
            if (item.type === 'character') {
                try {
                    const ownedCharacters = window.gameState?.getCharacters() || [];
                    isUnlocked = ownedCharacters.includes(item.characterId);
                    if (isUnlocked) {
                        itemElement.classList.add('unlocked');
                    }
                } catch (error) {
                    console.error('Error checking character unlock status:', error);
                }
            }
            
            // Build the item HTML
            let itemHTML = `
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <h3 class="item-name">${item.name}</h3>
                ${item.type === 'powerup' ? `<p class="item-description">${item.description}</p>` : ''}
                <p class="item-price">Price: ${item.price} $GRIND</p>
            `;

            // Add either the unlock button or unlocked label
            if (item.type === 'character') {
                if (isUnlocked) {
                    itemHTML += '<div class="unlocked-label">Unlocked</div>';
                } else {
                    const canAfford = window.gameState?.getBalance() >= item.price;
                    itemHTML += `
                        <button class="purchase-button" ${!canAfford ? 'disabled' : ''}>
                            Unlock
                        </button>
                    `;
                }
            } else {
                // For powerups, always show purchase button
                const canAfford = window.gameState?.getBalance() >= item.price;
                itemHTML += `
                    <button class="purchase-button" ${!canAfford ? 'disabled' : ''}>
                        Purchase
                    </button>
                `;
            }

            itemElement.innerHTML = itemHTML;

            // Add click event only if not unlocked
            if (item.type === 'character' && !isUnlocked) {
                const purchaseButton = itemElement.querySelector('.purchase-button');
                if (purchaseButton) {
                    purchaseButton.addEventListener('click', () => {
                        this.purchaseItem(item);
                    });
                }
            } else if (item.type === 'powerup') {
                const purchaseButton = itemElement.querySelector('.purchase-button');
                if (purchaseButton) {
                    purchaseButton.addEventListener('click', () => {
                        this.purchaseItem(item);
                    });
                }
            }

            this.itemsContainer.appendChild(itemElement);
        });
    }

    purchaseItem(item) {
        const currentBalance = window.gameState.getBalance();
        
        if (currentBalance < item.price) {
            this.showMessage('Not enough $GRIND!', 'error');
            return;
        }

        if (item.type === 'character') {
            const ownedCharacters = window.gameState.getCharacters();
            if (ownedCharacters.includes(item.characterId)) {
                this.showMessage('You already own this character!', 'error');
                return;
            }
        }

        // Update balance
        window.gameState.updateBalance(currentBalance - item.price);

        if (item.type === 'character') {
            window.gameState.addCharacter(item.characterId);
            this.unlockCharacter(item.characterId);
        } else if (item.type === 'powerup') {
            // Increment the item quantity
            window.gameState.incrementItem(item.name);
            
            // Force inventory to update
            if (window.inventory) {
                window.inventory.updateInventory();
                window.inventory.updateMiniInventory();
            }
        }

        this.showMessage(`Successfully purchased ${item.name}!`, 'success');
        this.displayItems();
        this.updateBalance();
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

        // Update the character selection UI
        if (window.updateCharacterSelectionUI) {
            window.updateCharacterSelectionUI();
        }
    }

    updateCharacterAvailability() {
        // Update character containers based on ownership
        this.items.forEach(item => {
            if (item.type === 'character') {
                const characterContainer = document.querySelector(`.character-container[data-character="${item.characterId}"]`);
                if (characterContainer) {
                    const isOwned = window.gameState.getCharacters().includes(item.characterId);
                    if (isOwned) {
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
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = text;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}

// Initialize shop when DOM is loaded and GameState is available
document.addEventListener('DOMContentLoaded', () => {
    // Wait for GameState to be available
    const checkGameState = setInterval(() => {
        if (window.gameState) {
            clearInterval(checkGameState);
            window.shop = new Shop();
        }
    }, 100);
}); 