// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Popup Notification Manager
    const welcomePopup = document.getElementById('welcome-popup');
    const closePopupBtn = document.getElementById('close-popup');
    const shopPopupBtn = document.getElementById('shop-popup-btn');

    // Show popup after 3 seconds for active notifications
    setTimeout(() => {
        if (welcomePopup) {
            welcomePopup.classList.add('active');
        }
    }, 3000);

    // Close Popup Logic
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            welcomePopup.classList.remove('active');
        });
    }
    
    if (shopPopupBtn) {
        shopPopupBtn.addEventListener('click', () => {
            welcomePopup.classList.remove('active');
            // Navigate is handled by href="#products"
        });
    }

    // 2. Sticky Navbar & Active Link Switching
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links li a');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // 3. Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navList = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
        const icon = menuToggle.querySelector('i');
        if (navList.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // 4. Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, revealOptions);
    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    // 5. Shopping Cart Functionality with Indian Rupees (₹)
    let cart = [];
    const cartIcon = document.getElementById('cart-icon');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartBadge = document.getElementById('cart-badge');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    const toast = document.getElementById('toast');

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }

    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    function formatRupees(amount) {
        return amount.toLocaleString('en-IN');
    }

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const image = btn.getAttribute('data-img');

            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, image, quantity: 1 });
            }

            updateCartUI();
            showToast(`Added ${name} to cart!`);
        });
    });

    function updateCartUI() {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartBadge.innerText = totalItems;
        cartBadge.style.transform = 'scale(1.2)';
        setTimeout(() => cartBadge.style.transform = 'scale(1)', 200);

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is currently empty.</div>';
            cartTotalPrice.innerText = '₹0';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = '';
        
        cart.forEach((item) => {
            total += item.price * item.quantity;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">₹${formatRupees(item.price * item.quantity)}</p>
                    <div class="cart-item-controls">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span class="qty">${item.quantity}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        cartTotalPrice.innerText = `₹${formatRupees(total)}`;
        attachCartListeners();
    }

    function attachCartListeners() {
        const plusBtns = document.querySelectorAll('.qty-btn.plus');
        const minusBtns = document.querySelectorAll('.qty-btn.minus');
        const removeBtns = document.querySelectorAll('.remove-item');

        plusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = cart.find(i => i.id === id);
                if(item) {
                    item.quantity++;
                    updateCartUI();
                }
            });
        });

        minusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = cart.find(i => i.id === id);
                if(item) {
                    if (item.quantity > 1) {
                        item.quantity--;
                    } else {
                        cart = cart.filter(i => i.id !== id);
                    }
                    updateCartUI();
                }
            });
        });

        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                cart = cart.filter(i => i.id !== id);
                updateCartUI();
            });
        });
    }

    function showToast(msg) {
        toast.innerText = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // 6. Upgraded Search Functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const productCards = document.querySelectorAll('.product-card');
    const noProductsMsg = document.getElementById('no-products-msg');

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            filterProducts('');
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let visibleCount = 0;
        
        productCards.forEach(card => {
            const productName = card.querySelector('.product-info h3').innerText.toLowerCase();
            // Fetch the invisible data-tags (like 'cloths', 'jewellary', 'footwear', etc.)
            const productTags = card.getAttribute('data-tags') ? card.getAttribute('data-tags').toLowerCase() : '';
            
            // Check if search matches name OR tags
            if (productName.includes(searchTerm) || productTags.includes(searchTerm)) {
                card.style.display = 'block';
                card.classList.remove('active');
                setTimeout(() => card.classList.add('active'), 10);
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            noProductsMsg.style.display = 'block';
        } else {
            noProductsMsg.style.display = 'none';
        }

        const productsSection = document.getElementById('products');
        if (searchTerm.length > 0 && window.scrollY < (productsSection.offsetTop - 100)) {
            window.scrollTo({
                top: productsSection.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchInput.blur();
        } else if (e.key === 'Escape') {
            searchInput.classList.remove('active');
            searchInput.value = '';
            filterProducts('');
        }
    });

    function filterProducts(term) {
        productCards.forEach(card => {
            card.style.display = 'block';
            card.classList.add('active');
        });
        noProductsMsg.style.display = 'none';
    }
});
