document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-container');
    const searchInput = document.getElementById('search-input');
    let allMenuData = []; // Para armazenar todos os dados do cardápio

    // Função para carregar e processar o CSV
    async function loadMenuFromCSV(url) {
        try {
            const response = await fetch(url);
            const csvText = await response.text();

            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    allMenuData = results.data; // Armazena os dados originais
                    displayMenu(allMenuData); // Exibe o cardápio completo inicialmente
                },
                error: function(err) {
                    console.error('Erro ao parsear CSV:', err);
                    menuContainer.innerHTML = '<p>Erro ao carregar o cardápio. Por favor, tente novamente mais tarde.</p>';
                }
            });
        } catch (error) {
            console.error('Erro ao buscar o CSV:', error);
            menuContainer.innerHTML = '<p>Erro ao carregar o cardápio. Por favor, tente novamente mais tarde.</p>';
        }
    }

    // Função para exibir o cardápio
    function displayMenu(menuData) {
        menuContainer.innerHTML = ''; // Limpa o container antes de adicionar novos itens

        if (menuData.length === 0) {
            menuContainer.innerHTML = '<p style="text-align: center; color: #d3c8b8;">Nenhum item encontrado com os critérios de busca.</p>';
            return;
        }

        // Agrupar itens por categoria
        const categories = menuData.reduce((acc, item) => {
            if (item.Categoria) { // Garante que a categoria existe
                if (!acc[item.Categoria]) {
                    acc[item.Categoria] = [];
                }
                acc[item.Categoria].push(item);
            } else if (item.Nome) { // Itens sem categoria definida vão para uma categoria 'Outros' ou similar
                if (!acc['Outros']) {
                    acc['Outros'] = [];
                }
                acc['Outros'].push(item);
            }
            return acc;
        }, {});

        // Iterar sobre as categorias e criar as seções
        for (const category in categories) {
            const categorySection = document.createElement('section');
            categorySection.classList.add('category-section');

            const categoryTitle = document.createElement('h2');
            categoryTitle.classList.add('category-title');
            categoryTitle.textContent = category;
            categorySection.appendChild(categoryTitle);

            const menuItemsGrid = document.createElement('div');
            menuItemsGrid.classList.add('menu-items-grid');

            categories[category].forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.classList.add('menu-item');

                // Imagem do item (se existir)
                if (item.URL_da_Foto && item.URL_da_Foto !== 'N/A') {
                    const itemImage = document.createElement('img');
                    itemImage.classList.add('menu-item-image');
                    itemImage.src = item.URL_da_Foto;
                    itemImage.alt = item.Nome;
                    menuItem.appendChild(itemImage);
                }

                const itemContent = document.createElement('div');
                itemContent.classList.add('menu-item-content');

                const itemTitle = document.createElement('h3');
                itemTitle.classList.add('menu-item-title');
                itemTitle.textContent = item.Nome;
                itemContent.appendChild(itemTitle);

                const itemDescription = document.createElement('p');
                itemDescription.classList.add('menu-item-description');
                itemDescription.textContent = item.Descricao || ''; // Descrição opcional
                itemContent.appendChild(itemDescription);

                menuItem.appendChild(itemContent);

                const itemPrice = document.createElement('span');
                itemPrice.classList.add('menu-item-price');
                // Corrected price parsing
                const priceValue = parseFloat(item.Preco.replace('R$', '').replace(',', '.'));
                itemPrice.textContent = `R$ ${priceValue ? priceValue.toFixed(2).replace('.', ',') : 'N/A'}`;
                menuItem.appendChild(itemPrice);

                menuItemsGrid.appendChild(menuItem);
            });
            categorySection.appendChild(menuItemsGrid);
            menuContainer.appendChild(categorySection);
        }
    }

    // Adiciona o event listener para o campo de busca
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredMenu = allMenuData.filter(item => {
            const nameMatch = item.Nome.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.Descricao ? item.Descricao.toLowerCase().includes(searchTerm) : false;
            const categoryMatch = item.Categoria ? item.Categoria.toLowerCase().includes(searchTerm) : false;
            return nameMatch || descriptionMatch || categoryMatch;
        });
        displayMenu(filteredMenu);
    });

    // Carregar o cardápio do arquivo CSV (substitua 'cardapio.csv' pelo caminho real do seu arquivo)
    loadMenuFromCSV('cardapio.csv');
});