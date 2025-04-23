// Game State Management System
class GameState {
    constructor() {
        this.state = {
            items: {
                Coffee: { quantity: 0, active: false },
                Magnet: { quantity: 0, active: false }
            },
            balance: 0,
            characters: ['hamster'],
            selectedCharacter: 'hamster'
        };
        this.observers = [];
        this.loadState();
    }

    // Observer pattern implementation
    subscribe(observer) {
        this.observers.push(observer);
        // Immediately notify new observer of current state
        observer(this.state);
    }

    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.state));
        // Update main page balance only if we're not in game mode
        if (!document.querySelector('.game-running')) {
            const mainBalance = document.getElementById('main-balance');
            if (mainBalance) {
                mainBalance.textContent = `Balance: ${this.state.balance} $Grind`;
            }
        }
    }

    // Item management
    updateItemQuantity(itemName, quantity) {
        if (this.state.items[itemName]) {
            this.state.items[itemName].quantity = Math.max(0, quantity);
            this.saveState();
            this.notifyObservers();
        }
    }

    incrementItem(itemName) {
        if (this.state.items[itemName]) {
            this.state.items[itemName].quantity++;
            this.saveState();
            this.notifyObservers();
        }
    }

    decrementItem(itemName) {
        if (this.state.items[itemName]) {
            this.state.items[itemName].quantity = Math.max(0, this.state.items[itemName].quantity - 1);
            this.saveState();
            this.notifyObservers();
        }
    }

    setItemActive(itemName, active) {
        if (this.state.items[itemName]) {
            this.state.items[itemName].active = active;
            this.saveState();
            this.notifyObservers();
        }
    }

    // Balance management
    updateBalance(amount) {
        this.state.balance = Math.max(0, amount);
        this.saveState();
        this.notifyObservers();
    }

    addBalance(amount) {
        this.updateBalance(this.state.balance + amount);
    }

    // Character management
    addCharacter(characterId) {
        if (!this.state.characters.includes(characterId)) {
            this.state.characters.push(characterId);
            this.saveState();
            this.notifyObservers();
        }
    }

    saveState() {
        localStorage.setItem('gameState', JSON.stringify(this.state));
    }

    loadState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                this.state = {
                    ...this.state,
                    ...parsedState,
                    items: {
                        ...this.state.items,
                        ...parsedState.items
                    }
                };
            } catch (e) {
                console.error('Error loading game state:', e);
            }
        }
    }

    // Getters
    getItemQuantity(itemName) {
        return this.state.items[itemName]?.quantity || 0;
    }

    isItemActive(itemName) {
        return this.state.items[itemName]?.active || false;
    }

    getBalance() {
        return this.state.balance;
    }

    getCharacters() {
        return this.state.characters;
    }
}

// Create and export singleton instance
window.gameState = new GameState(); 