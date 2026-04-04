let cart = JSON.parse(localStorage.getItem('cart')) || [];

function renderProducts(productsToRender = products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <img src="${product.img}" alt="${product.name}" style="width:100%; height:200px; object-fit:cover; border-radius:5px;">
            <h3 style="margin:15px 0 10px; color:var(--dark);">${product.name}</h3>
            <p style="font-size:1.2rem; font-weight:800; color:var(--gold);">₦${product.price.toLocaleString()}</p>
            <button onclick="addToCart(${product.id})" class="add-cart-btn">
                ${cart.find(item => item.id === product.id) ? '✅ In Cart' : 'Add to Cart'}
            </button>
        </div>
    `).join('');
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProducts(); // Refresh to show "In Cart"
    showNotification(`${product.name} added to cart!`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderProducts();
    updateCartDisplay();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            updateCartDisplay();
        }
    }
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartLink = document.querySelector('.nav-links a[href*="order"], .nav-order-btn');
    if (cartLink) {
        cartLink.innerHTML = cart.length > 0 ? `Cart (${count})` : 'Place Order';
    }
}

function showNotification(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: var(--gold); 
        color: var(--dark); padding: 15px 20px; border-radius: 5px; 
        font-weight: 600; z-index: 10000; transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }, 100);
}

// Search & Filter
function filterProducts() {
    const search = document.getElementById('search')?.value.toLowerCase() || '';
    const category = document.getElementById('category')?.value || 'all';
    
    const filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search);
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderProducts(filtered);
}

// Cart Preview/Modal
function toggleCartPreview() {
    const cartPreview = document.getElementById('cart-preview');
    if (!cartPreview) return;
    
    if (cartPreview.style.display !== 'block') {
        updateCartDisplay();
        cartPreview.style.display = 'block';
    } else {
        cartPreview.style.display = 'none';
    }
}

function updateCartDisplay() {
    const cartPreview = document.getElementById('cart-preview');
    if (!cartPreview) return;
    
    if (cart.length === 0) {
        cartPreview.innerHTML = '<p style="text-align:center; padding:20px;">Your cart is empty</p>';
        return;
    }
    
    cartPreview.innerHTML = cart.map(item => `
        <div style="display:flex; gap:10px; padding:10px 0; border-bottom:1px solid #eee;">
            <img src="${item.img}" style="width:60px; height:60px; object-fit:cover; border-radius:3px;">
            <div style="flex:1;">
                <h4 style="margin:0 0 5px;">${item.name}</h4>
                <p style="margin:0; color:var(--gold);">₦${item.price.toLocaleString()}</p>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="updateQuantity(${item.id}, -1)">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="removeFromCart(${item.id})" style="color:red;">×</button>
            </div>
        </div>
    `).join('') + `
        <div style="padding:15px; border-top:2px solid var(--gold);">
            <p><strong>Total: ₦${getCartTotal().toLocaleString()}</strong></p>
            <a href="order.html" style="background:var(--gold); color:var(--dark); padding:10px 20px; text-decoration:none; border-radius:4px; display:block; text-align:center; font-weight:600;">Proceed to Checkout</a>
        </div>
    `;
}

// Category filter dropdown (add this to your HTML)
function createFilterControls() {
    const marketSection = document.querySelector('#market');
    if (!marketSection || document.getElementById('filter-controls')) return;
    
    marketSection.insertAdjacentHTML('afterbegin', `
        <div id="filter-controls" style="margin-bottom:30px; display:flex; gap:15px; flex-wrap:wrap; align-items:center; max-width:1200px; margin:0 auto 30px;">
            <input id="search" type="text" placeholder="🔍 Search products..." 
                   style="padding:12px 20px; border:1px solid var(--border); border-radius:4px; flex:1; min-width:250px;"
                   oninput="filterProducts()">
            <select id="category" style="padding:12px 20px; border:1px solid var(--border); border-radius:4px;"
                    onchange="filterProducts()">
                <option value="all">All Categories</option>
                <option value="Solar & Energy">Solar & Energy</option>
                <option value="Security">Security</option>
                <option value="Digital">Digital</option>
                <option value="Consulting">Consulting</option>
                <option value="Maintenance">Maintenance</option>
            </select>
        </div>
    `);
    
    // Add cart preview
    const nav = document.querySelector('nav');
    nav.insertAdjacentHTML('beforeend', `
        <div id="cart-preview" style="position:absolute; top:100%; right:0; background:var(--white); min-width:350px; box-shadow:0 10px 30px rgba(0,0,0,0.1); border:1px solid var(--border); border-radius:8px; display:none; z-index:1001;"></div>
    `);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    createFilterControls();
    renderProducts();
    updateCartCount();
    
    // Cart preview toggle on nav button
    const cartBtn = document.querySelector('.nav-order-btn, .nav-links a[href*="order"]');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                e.preventDefault();
                toggleCartPreview();
            }
        });
    }
    
    // Close cart preview when clicking outside
    document.addEventListener('click', (e) => {
        const cartPreview = document.getElementById('cart-preview');
        const cartBtn = document.querySelector('.nav-order-btn');
        if (cartPreview?.style.display === 'block' && !cartBtn?.contains(e.target) && !cartPreview.contains(e.target)) {
            cartPreview.style.display = 'none';
        }
    });
});