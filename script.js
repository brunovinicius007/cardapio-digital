document.addEventListener('DOMContentLoaded', () => {
    // Seletores DOM
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('search-input');
    const categoryNav = document.getElementById('category-nav');
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');

    // Estado da Aplicação
    let allMenuData = [];
    let currentCategory = 'Todos';
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // --- Inicialização ---
    async function init() {
        await loadMenuFromCSV('cardapio.csv');
        updateCartUI();
        setupEventListeners();
    }

    // --- Lógica de Dados ---
    async function loadMenuFromCSV(url) {
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    console.log("Produtos carregados:", results.data.length);
                    allMenuData = results.data.filter(item => item && item.Nome && item.Nome.trim() !== ""); 
                    createCategoryNav();
                    renderMenu();
                },
                error: function(err) {
                    console.error("Erro no PapaParse:", err);
                    menuContainer.innerHTML = '<p class="error-msg">Erro ao processar o cardápio.</p>';
                }
            });
        } catch (error) {
            console.error('Erro:', error);
            menuContainer.innerHTML = '<p class="error-msg">Ops! Ocorreu um erro ao carregar o menu.</p>';
        }
    }

    // --- UI: Menu & Categorias ---
    function createCategoryNav() {
        const categories = ['Todos', ...new Set(allMenuData.map(item => item.Categoria).filter(Boolean))];
        categoryNav.innerHTML = categories.map(cat => `
            <div class="category-pill ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">
                ${cat}
            </div>
        `).join('');

        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                currentCategory = pill.dataset.category;
                document.querySelector('.category-pill.active').classList.remove('active');
                pill.classList.add('active');
                renderMenu();
            });
        });
    }

    function renderMenu(searchTerm = '') {
        // Ordenar: Prato do Dia primeiro
        const sortedData = [...allMenuData].sort((a, b) => {
            if (a.Categoria === 'Prato do Dia') return -1;
            if (b.Categoria === 'Prato do Dia') return 1;
            return 0;
        });

        const filtered = sortedData.filter(item => {
            const matchesCategory = currentCategory === 'Todos' || item.Categoria === currentCategory;
            const matchesSearch = item.Nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                (item.Descricao && item.Descricao.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            menuContainer.innerHTML = '<p class="no-results">Nenhum prato encontrado para sua busca.</p>';
            return;
        }

        menuContainer.innerHTML = `
            <div class="menu-grid">
                ${filtered.map((item, index) => renderCard(item, index)).join('')}
            </div>
        `;

        // Adiciona eventos aos botões "Adicionar"
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('.card').dataset.index;
                const item = filtered[index];
                addToCart(item);
            });
        });
    }

    function renderCard(item, index) {
        const priceFormatted = formatCurrency(parsePrice(item.Preco));
        const isSpecial = item.Categoria === 'Prato do Dia' ? '<span class="badge">Especial</span>' : '';
        return `
            <div class="card" data-index="${index}">
                ${isSpecial}
                <img src="${item.URL_da_Foto || 'https://via.placeholder.com/400x300?text=Sem+Foto'}" class="card-img" alt="${item.Nome}" onerror="this.src='https://via.placeholder.com/400x300?text=Madero'">
                <div class="card-body">
                    <h3 class="card-title">${item.Nome}</h3>
                    <p class="card-desc">${item.Descricao || 'Uma experiência única de sabor.'}</p>
                    <div class="card-footer">
                        <span class="price">${priceFormatted}</span>
                        <button class="add-btn"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Lógica do Carrinho ---
    function addToCart(item) {
        const existing = cart.find(c => c.Nome === item.Nome);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        updateCartUI();
        cartSidebar.classList.remove('hidden'); // Abre o carrinho ao adicionar
    }

    function removeFromCart(itemName) {
        cart = cart.filter(item => item.Nome !== itemName);
        updateCartUI();
    }

    function updateCartUI() {
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Contagem de itens
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Lista de itens
        cartItemsContainer.innerHTML = cart.map(item => {
            const price = parsePrice(item.Preco) * item.quantity;
            return `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <strong>${item.Nome}</strong><br>
                        <small>${item.quantity}x ${formatCurrency(parsePrice(item.Preco))}</small>
                    </div>
                    <div class="cart-item-actions">
                        <span class="item-price">${formatCurrency(price)}</span>
                        <button class="remove-item" onclick="removeFromCart('${item.Nome}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Preço Total
        const totalValue = cart.reduce((acc, item) => acc + (parsePrice(item.Preco) * item.quantity), 0);
        cartTotalDisplay.textContent = formatCurrency(totalValue);

        // Adiciona evento de remover após renderizar (usando delegação ou global)
        window.removeFromCart = removeFromCart; 
    }

    // --- Auxiliares ---
    function parsePrice(price) {
        if (!price) return 0;
        if (typeof price === 'number') return price;
        return parseFloat(String(price).replace('R$', '').replace(',', '.').trim()) || 0;
    }

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function setupEventListeners() {
        searchInput.addEventListener('input', (e) => renderMenu(e.target.value));
        cartToggle.addEventListener('click', () => cartSidebar.classList.remove('hidden'));
        closeCartBtn.addEventListener('click', () => cartSidebar.classList.add('hidden'));
        
        document.getElementById('checkout-btn').addEventListener('click', () => {
            if (cart.length === 0) return alert('Seu carrinho está vazio!');
            const msg = `Olá! Gostaria de fazer o seguinte pedido:\n\n${cart.map(i => `${i.quantity}x ${i.Nome}`).join('\n')}\n\nTotal: ${cartTotalDisplay.textContent}`;
            window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`, '_blank');
        });
    }

    init();
});
