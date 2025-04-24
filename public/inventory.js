class Inventory {
    constructor() {
        this.items = {
            characters: [
                {
                    id: 'hamster',
                    name: 'Hamster',
                    description: 'Default character',
                    image: getAssetPath('assets/images/hamster.png'),
                    selected: true,
                    characterId: 'hamster'
                },
                {
                    id: 'bear',
                    name: 'Bear',
                    description: 'A strong character with high durability',
                    image: getAssetPath('assets/images/bear.png'),
                    selected: false,
                    characterId: 'bear'
                },
                {
                    id: 'frog',
                    name: 'Frog',
                    description: 'A fast jumper with special abilities',
                    image: getAssetPath('assets/images/frog.png'),
                    selected: false,
                    characterId: 'frog'
                }
            ],
            powerupItems: []
        };
        this.modal = document.querySelector('.inventory-modal');
        this.itemsContainer = document.querySelector('.inventory-items');
        this.miniInventoryContainer = document.querySelector('.mini-inventory-items');
        this.closeButton = this.modal.querySelector('.close-button');
        this.inventoryButton = document.querySelector('.inventory-button');
        
        this.setupEventListeners();
        this.updateInventory();
        this.updateMiniInventory();

        // Subscribe to gameState changes
        window.gameState.subscribe((state) => {
            this.updateInventory();
            this.updateMiniInventory();
        });

        // Item quick use mappings
        this.itemKeyMappings = {
            Coffee: { image: getAssetPath('assets/images/coffee.png'), key: 'Ctrl' },
            Magnet: { image: getAssetPath('assets/images/magnet.png'), key: 'Shift' }
        };
    }

    setupEventListeners() {
        this.closeButton.addEventListener('click', () => this.closeInventory());
        this.inventoryButton.addEventListener('click', () => this.openInventory());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeInventory();
            }
        });

        // Add click-outside functionality
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeInventory();
            }
        });

        // Prevent clicks inside the modal content from closing it
        this.modal.querySelector('.inventory-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    openInventory() {
        console.log('Opening inventory modal');
        this.modal.style.display = 'flex';
        requestAnimationFrame(() => {
            this.modal.classList.add('active');
        });
        this.updateInventory();
    }

    closeInventory() {
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    updateMiniInventory() {
        if (!this.miniInventoryContainer) return;
        
        this.miniInventoryContainer.innerHTML = '';
        
        // Get powerup items from gameState
        const items = {
            Coffee: { image: getAssetPath('assets/images/coffee.png'), key: 'Ctrl' },
            Magnet: { image: getAssetPath('assets/images/magnet.png'), key: 'Shift' }
        };

        // Log current state of items
        console.log('Updating mini inventory', {
            'Coffee active': window.gameState.isItemActive('Coffee'),
            'Magnet active': window.gameState.isItemActive('Magnet')
        });

        Object.entries(items).forEach(([name, data]) => {
            const quantity = window.gameState.getItemQuantity(name);
            const isActive = window.gameState.isItemActive(name);
            
            // Log individual item state
            console.log(`Item ${name}: active=${isActive}, quantity=${quantity}`);
            
            // Create element for all items, regardless of quantity
            const itemElement = document.createElement('div');
            itemElement.className = 'mini-inventory-item';
            itemElement.dataset.item = name.toLowerCase(); // Use lowercase for compatibility with game.js
            
            // Force the active state to be a boolean to prevent string-based truthy values
            const activeState = isActive === true;
            
            // Mark as active if the item is active (with a strict boolean check)
            if (activeState) {
                itemElement.dataset.active = 'true';
                itemElement.title = `${name} is active (${quantity} in inventory)`;
            } else {
                itemElement.dataset.active = 'false';
                itemElement.title = `${quantity > 0 ? `Click to use ${name} (${quantity} available)` : `No ${name} available`}`;
            }
            
            // Changed the HTML structure to place the quantity at the bottom left
            itemElement.innerHTML = `
                <img src="${data.image}" alt="${name}">
                <span class="key-hint">${data.key}</span>
                ${activeState ? '<span class="active-indicator">ACTIVE</span>' : ''}
                <span class="quantity">${quantity}</span>
            `;

            itemElement.addEventListener('click', () => {
                // Re-check active state at click time
                const currentlyActive = window.gameState.isItemActive(name) === true;
                
                if (currentlyActive) {
                    // Can't deactivate an active item
                    this.showMessage(`${name} is already active!`, 'warning');
                } else if (quantity <= 0) {
                    // Can't use an item with zero quantity
                    this.showMessage(`No ${name} available in inventory!`, 'error');
                } else {
                    // Try to use the item through the game
                    if (window.currentGame && typeof window.currentGame.activateInventoryItem === 'function') {
                        window.currentGame.activateInventoryItem(name.toLowerCase());
                    } else {
                        this.showMessage(`Game not initialized or item can't be used now`, 'error');
                    }
                }
            });

            this.miniInventoryContainer.appendChild(itemElement);
        });
    }

    addItem(item) {
        // Check if the item already exists in gameState
        const existingQuantity = window.gameState.getItemQuantity(item.name);
        
        // Always increment the item quantity when adding to inventory
        window.gameState.incrementItem(item.name);
        
        // Show a notification about the item being added
        this.showMessage(`${item.name} added to your inventory!`, 'success');
        
        // Update the inventory displays
        this.updateInventory();
        this.updateMiniInventory();
    }

    useItem(item) {
        const quantity = window.gameState.getItemQuantity(item.name);
        if (quantity <= 0) {
            this.showMessage(`No ${item.name} available!`, 'error');
            return;
        }

        window.gameState.decrementItem(item.name);
        window.gameState.setItemActive(item.name, true);
        
        // Show success message
        this.showMessage(`Used ${item.name}!`, 'success');
        
        // Update displays
        this.updateInventory();
        this.updateMiniInventory();
    }

    showMessage(text, type = 'success') {
        // Remove any existing messages to prevent stacking
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        // Message will be removed by CSS animation
    }

    // Add method to get an item by name from the inventory
    getItemByName(itemName) {
        // Check if the item exists in gameState
        const quantity = window.gameState.getItemQuantity(itemName);
        const isActive = window.gameState.isItemActive(itemName);
        
        // Return item details
        return {
            name: itemName,
            quantity: quantity,
            active: isActive
        };
    }

    updateInventory() {
        if (!this.itemsContainer) {
            console.error('Inventory container not found');
            return;
        }
        
        this.itemsContainer.innerHTML = '';
        
        // Define powerup items with their properties
        const powerupItems = [
            {
                id: 'coffee',
                name: 'Coffee',
                description: 'Increases your running speed temporarily',
                image: getAssetPath('assets/images/coffee.png'),
                usable: false
            },
            {
                id: 'magnet',
                name: 'Magnet',
                description: 'Attracts tokens to you for a short time',
                image: getAssetPath('assets/images/magnet.png'),
                usable: false
            }
        ];
        
        // Display each item
        powerupItems.forEach(item => {
            const quantity = window.gameState.getItemQuantity(item.name);
            if (quantity > 0) {
                const itemElement = document.createElement('div');
                itemElement.className = 'inventory-item';
                itemElement.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="item-image">
                    <h3 class="item-name">${item.name}</h3>
                    <p class="item-quantity">Quantity: ${quantity}</p>
                    ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                `;

                this.itemsContainer.appendChild(itemElement);
            }
        });

        // Show empty inventory message if no items are visible
        if (this.itemsContainer.children.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-inventory-message';
            emptyMessage.innerHTML = `
                <div class="empty-message-icon">📦</div>
                <h3>Your inventory is empty</h3>
                <p>Visit the Shop to get items!</p>
            `;
            this.itemsContainer.appendChild(emptyMessage);
        }
    }
}

// Initialize inventory
window.inventory = new Inventory(); 