class Inventory {
    constructor() {
        this.items = {
            characters: [
                {
                    name: 'Hamster',
                    image: 'assets/images/Hamster.png',
                    selected: true,
                    characterId: 'hamster'
                },
                {
                    name: 'Bear',
                    image: 'assets/images/Bear.png',
                    selected: false,
                    characterId: 'bear'
                },
                {
                    name: 'Frog',
                    image: 'assets/images/Frog.png',
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
            Coffee: { image: 'assets/images/coffee.jpg' },
            Magnet: { image: 'assets/images/magnet.png' }
        };

        Object.entries(items).forEach(([name, data]) => {
            const quantity = window.gameState.getItemQuantity(name);
            if (quantity > 0) {
                const itemElement = document.createElement('div');
                itemElement.className = 'mini-inventory-item';
                itemElement.dataset.item = name;
                itemElement.dataset.active = window.gameState.isItemActive(name);
                
                itemElement.innerHTML = `
                    <img src="${data.image}" alt="${name}">
                    <span class="quantity">${quantity}</span>
                `;

                itemElement.addEventListener('click', () => {
                    if (window.gameState.isItemActive(name)) {
                        window.gameState.setItemActive(name, false);
                    } else {
                        this.useItem({ name });
                    }
                });

                this.miniInventoryContainer.appendChild(itemElement);
            }
        });
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
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
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
                name: 'Coffee',
                image: 'assets/images/coffee.jpg',
                description: 'Temporary invincibility for 20 seconds',
                usable: false
            },
            {
                name: 'Magnet',
                image: 'assets/images/magnet.png',
                description: 'Attracts nearby coins for 20 seconds',
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
                <p>Visit the Store to get items!</p>
            `;
            this.itemsContainer.appendChild(emptyMessage);
        }
    }
}

// Initialize inventory
window.inventory = new Inventory(); 