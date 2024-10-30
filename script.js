// script.js

// Configuração do Firebase
var firebaseConfig = {
    apiKey: "AIzaSyAbADgKRicHlfDWoaXmIfU0EjGbU6nFkPQ",
    authDomain: "armazene-acd30.firebaseapp.com",
    databaseURL: "https://armazene-acd30-default-rtdb.firebaseio.com",
    projectId: "armazene-acd30",
    storageBucket: "armazene-acd30.appspot.com",
    messagingSenderId: "853849509051",
    appId: "1:853849509051:web:6fa7e18d0af9b9375b2d9e",
    measurementId: "G-PHWMDP8QE0"
};
// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// Dados armazenados no localStorage ou inicializados vazios
let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];
let sections = JSON.parse(localStorage.getItem('sections')) || [];

// Função de cadastro de usuário
function signUp() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validação de email simples com regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    if (!emailRegex.test(email)) {
        alert('Por favor, insira um email válido.');
        return;
    }

    // Cadastrar usuário com Firebase
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sucesso no cadastro
            const user = userCredential.user;
            alert('Usuário cadastrado com sucesso!');
            console.log('Usuário cadastrado:', user);
        })
        .catch((error) => {
            // Erro ao cadastrar
            alert('Erro ao cadastrar: ' + error.message);
        });
}

// Função de login de usuário
function signIn() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Login com Firebase
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sucesso no login
            const user = userCredential.user;
            alert('Login realizado com sucesso!');
            console.log('Usuário logado:', user);
        })
        .catch((error) => {
            // Erro no login
            alert('Erro ao fazer login: ' + error.message);
        });
}

// Função de logout de usuário
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            alert('Logout realizado com sucesso!');
            document.getElementById('auth-container').style.display = 'block';
            document.getElementById('logout-btn').style.display = 'none';
        })
        .catch((error) => {
            alert(`Erro ao fazer logout: ${error.message}`);
        });
}

// Verifica o estado de autenticação do usuário
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'block';
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
    }
});

// Função para salvar o estado no localStorage
function saveState() {
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
    localStorage.setItem('sections', JSON.stringify(sections));
    updateTotalItemCount(); // Atualiza a contagem total sempre que o estado é salvo
}

// Função para alternar o estado riscado do item
function toggleRiscado(event, uniqueId) {
    const listItem = event.target.closest('li');
    const markButton = listItem.querySelector('.mark-button');
    const unmarkButton = listItem.querySelector('.unmark-button');

    const section = sections.find(s => s.items.some(i => i.uniqueId === uniqueId));
    if (!section) return;
    const item = section.items.find(i => i.uniqueId === uniqueId);

    if (listItem.classList.contains('riscado')) {
        // Desmarcar item
        item.purchased = 0;
        purchasedItems = purchasedItems.filter(p => p.uniqueId !== uniqueId);
    } else {
        // Marcar item
        const purchasedQuantity = parseInt(listItem.querySelector('.purchased-input').value);
        if (!purchasedQuantity || purchasedQuantity <= 0) {
            alert('Por favor, insira a quantidade comprada antes de marcar o item.');
            return;
        }
        item.purchased = purchasedQuantity;
        purchasedItems.push({ name: item.name, store: item.store, purchased: item.purchased, uniqueId: uniqueId });
    }

    // Atualiza a interface do usuário
    listItem.classList.toggle('riscado');
    markButton.style.display = listItem.classList.contains('riscado') ? 'none' : 'inline-block';
    unmarkButton.style.display = listItem.classList.contains('riscado') ? 'inline-block' : 'none';

    saveState();
}

function toggleSectionVisibility(event, sectionName) {
    const sectionDiv = event.target.closest('.section');
    if (!sectionDiv) return;

    // Seleciona os elementos que serão ocultados/exibidos
    const elementsToToggle = sectionDiv.querySelectorAll('.section-buttons, .search-bar, ul, .add-item');
    const eyeIcon = sectionDiv.querySelector('.eye-icon'); // Procurar no contexto da seção toda

    // Verifique se o eyeIcon foi encontrado antes de tentar modificar seu conteúdo
    if (!eyeIcon) {
        console.error('Eye icon not found for section:', sectionName);
        return;
    }

    console.log('Toggling visibility for section:', sectionName);

    // Alterna a visibilidade dos elementos utilizando a classe 'hidden'
    let allHidden = true;
    elementsToToggle.forEach(element => {
        element.classList.toggle('hidden');
        if (!element.classList.contains('hidden')) {
            allHidden = false;
        }
    });

    // Atualiza o ícone com base no estado atual dos elementos
    eyeIcon.textContent = allHidden ? '🙈' : '👁️'; // Olho riscado quando oculto, olho normal quando visível
}

// Função para descartar um item
function discardItem(event, sectionName, uniqueId) {
    const section = sections.find(s => s.name === sectionName);
    if (section) {
        section.items = section.items.filter(item => item.uniqueId !== uniqueId);
        purchasedItems = purchasedItems.filter(item => item.uniqueId !== uniqueId);
        const listItem = event.target.closest('li');
        if (listItem) listItem.remove();
        saveState();
    }
}

// Função para descartar uma seção
function discardSection(event, sectionName) {
    sections = sections.filter(section => section.name !== sectionName);
    purchasedItems = purchasedItems.filter(item => item.section !== sectionName);
    const sectionDiv = event.target.closest('.section');
    if (sectionDiv) sectionDiv.remove();
    saveState();
}

// Função para editar o nome da seção
function editSectionName(event, oldName) {
    const newName = prompt('Editar nome da seção:', oldName);
    if (newName && newName.trim() !== '') {
        // Verifica se já existe uma seção com o novo nome
        const existingSection = sections.find(s => s.name.toLowerCase() === newName.toLowerCase());
        if (existingSection) {
            alert('Já existe uma seção com este nome.');
            return;
        }

        const section = sections.find(s => s.name === oldName);
        if (section) {
            section.name = newName;

            // Atualizar o DOM
            const sectionDiv = event.target.closest('.section');
            if (sectionDiv) {
                sectionDiv.querySelector('h2').textContent = newName;
                const ulElement = sectionDiv.querySelector('ul');
                ulElement.dataset.sectionName = newName;
            }

            saveState();
        }
    }
}

// Função para restaurar o estado salvo
function restoreState() {
    const sectionsContainer = document.getElementById('sections');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = '';
        sections.forEach(section => {
            addSectionToDOM(section.name, section.items, section.isFixed);
        });
    }
    updateTotalItemCount(); // Atualiza a contagem total ao restaurar o estado
}

// Função para adicionar uma nova seção
function addSection() {
    const sectionNameInput = document.getElementById('newSectionName');
    if (!sectionNameInput) return;
    const sectionName = sectionNameInput.value.trim();
    if (sectionName) {
        // Verifica se já existe uma seção com o mesmo nome
        const existingSection = sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
        if (existingSection) {
            alert('Já existe uma seção com este nome.');
            return;
        }

        const newSection = { name: sectionName, items: [], isFixed: false };
        sections.push(newSection);
        addSectionToDOM(sectionName, [], false);
        sectionNameInput.value = '';
        saveState();
    } else {
        alert('Por favor, insira um nome para a seção.');
    }
}

// Função para adicionar uma seção ao DOM
function addSectionToDOM(name, items, isFixed) {
    const sectionsContainer = document.getElementById('sections');
    if (!sectionsContainer) return;
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');
    sectionDiv.innerHTML = `
        <h2>
            ${name}
            <button class="toggle-section-btn" onclick="toggleSectionVisibility(event, '${name}')">
                <span class="eye-icon">👁️</span>
            </button>
        </h2>
        <div class="section-buttons">
            <button class="discard-section-btn" onclick="discardSection(event, '${name}')">Descartar Seção</button>
            <button class="edit-section-btn" onclick="editSectionName(event, '${name}')">Editar Seção</button>
            <button class="pin-section-btn" onclick="toggleFixSection('${name}')">${isFixed ? 'Destravar Seção' : 'Fixar Seção'}</button>
        </div>
        <input type="text" class="search-bar" placeholder="Pesquisar na seção..." onkeyup="filterItems(event, '${name}')">
        <ul class="sortable" data-section-name="${name}" style="display: block;"></ul>
        <div class="add-item">
            <input type="number" placeholder="Qtd Estoque" class="newItemStock">
            <input type="text" placeholder="Nome do Produto" class="newItemName">
            <input type="number" placeholder="Qtd Pedida" class="newItemRequested">
            <input type="text" placeholder="Loja" class="newItemStore">
            <button onclick="addItem(event, '${name}')">Adicionar Produto</button>
        </div>`;
    sectionsContainer.appendChild(sectionDiv);

    const ulElement = sectionDiv.querySelector('ul');
    if (!items) {
        items = [];
    } else if (!Array.isArray(items)) {
        items = Object.values(items);
    }

    if (items.length === 0) {
        ulElement.classList.add('placeholder');
    }

    items.forEach(item => {
        addItemToDOM(ulElement, item, name);
    });

    initializeSortable(ulElement, isFixed);
}

function filterItems(event, sectionName) {
    const searchTerm = event.target.value.toLowerCase();
    const section = sections.find(s => s.name === sectionName);
    if (!section) return;

    const sectionDiv = event.target.closest('.section');
    const itemsList = sectionDiv.querySelector('ul');
    const listItems = itemsList.querySelectorAll('li');

    listItems.forEach(item => {
        const itemName = item.querySelector('.item-name').textContent.toLowerCase();
        const itemStore = item.querySelector('.item-store').textContent.toLowerCase();
        const itemSupplier = item.querySelector('.item-details span:nth-child(3)').textContent.toLowerCase(); // Inclui o campo de fornecedor

        if (itemName.includes(searchTerm) || itemStore.includes(searchTerm) || itemSupplier.includes(searchTerm)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}

// Função para alternar o estado fixado de uma seção
function toggleFixSection(sectionName) {
    const section = sections.find(s => s.name === sectionName);
    if (!section) return;

    section.isFixed = !section.isFixed;

    // Atualizar o DOM
    const sectionDiv = document.querySelector(`[data-section-name="${sectionName}"]`).closest('.section');
    const pinButton = sectionDiv.querySelector('.pin-section-btn');
    const ulElement = sectionDiv.querySelector('ul');

    if (section.isFixed) {
        ulElement.classList.add('fixed');
        pinButton.textContent = "Destravar Seção";
        ulElement._sortable.option("disabled", true); // Desabilita a ordenação
    } else {
        ulElement.classList.remove('fixed');
        pinButton.textContent = "Fixar Seção";
        ulElement._sortable.option("disabled", false); // Habilita a ordenação
    }

    saveState();
}

// Função para adicionar um item a uma seção
function addItem(event, sectionName) {
    // Localiza a seção alvo
    const sectionDiv = event.target.closest('.section');
    if (!sectionDiv) return;

    // Captura os valores dos inputs
    const itemNameInput = sectionDiv.querySelector('.newItemName');
    const itemStoreInput = sectionDiv.querySelector('.newItemStore');
    const itemStockInput = sectionDiv.querySelector('.newItemStock');
    const itemRequestedInput = sectionDiv.querySelector('.newItemRequested');
    const itemSupplierInput = sectionDiv.querySelector('.newItemSupplier');

    // Verifica se todos os campos necessários estão preenchidos
    if (!itemNameInput || !itemStoreInput || !itemStockInput || !itemRequestedInput || !itemSupplierInput) {
        console.error("Algum dos campos do formulário não foi encontrado.");
        return;
    }

    // Captura os valores dos inputs
    const itemName = itemNameInput.value.trim();
    const itemStore = itemStoreInput.value.trim();
    const itemStock = parseInt(itemStockInput.value) || 0;
    const itemRequested = parseInt(itemRequestedInput.value) || 0;
    const itemSupplier = itemSupplierInput.value.trim();

    // Cria um identificador único para o item
    const uniqueId = `${itemName}-${itemStore}-${Date.now()}`;

    // Verifica se o nome do produto e a loja foram preenchidos
    if (itemName && itemStore) {
        const section = sections.find(s => s.name === sectionName);
        if (!section) return;

        // Cria um novo item
        const newItem = {
            name: itemName,
            store: itemStore,
            stock: itemStock,
            requested: itemRequested,
            supplier: itemSupplier,
            purchased: 0,
            uniqueId: uniqueId
        };

        // Adiciona o novo item à seção correspondente
        section.items.push(newItem);

        // Atualiza o DOM
        const ulElement = sectionDiv.querySelector('ul');
        ulElement.classList.remove('placeholder');
        addItemToDOM(ulElement, newItem, sectionName);

        // Limpa os valores dos inputs após adicionar o item
        itemNameInput.value = '';
        itemStoreInput.value = '';
        itemStockInput.value = '';
        itemRequestedInput.value = '';
        itemSupplierInput.value = '';

        // Salva o estado atualizado
        saveState();
    } else {
        alert('Por favor, insira um nome para o produto e uma loja.');
    }
}

// Função para adicionar um item ao DOM
function addItemToDOM(ulElement, item, sectionName) {
    const listItem = document.createElement('li');
    listItem.setAttribute('data-unique-id', item.uniqueId);
    listItem.innerHTML = `
        <div class="item-header">
            <div class="item-main-info">
                <span class="item-name">${item.name}</span>
                <span class="item-store highlight">${item.store}</span>
            </div>
            <div class="item-details">
                <span>Est: ${item.stock}</span>
                <span>Ped: ${item.requested}</span>
                <span>Forn: ${item.supplier || 'Não especificado'}</span>
            </div>
        </div>
        <div class="button-group-custom">
            <button class="quantity-button" onclick="changeQuantity(event, '${sectionName}', '${item.uniqueId}', 1)">+</button>
            <input type="number" min="0" value="${item.purchased}" class="purchased-input" onchange="updatePurchased(event, '${sectionName}', '${item.uniqueId}')">
            <button class="quantity-button" onclick="changeQuantity(event, '${sectionName}', '${item.uniqueId}', -1)">-</button>
            <button class="edit-button" onclick="editItem(event, '${sectionName}', '${item.uniqueId}')" title="Editar">✎</button>
            <button class="mark-button" onclick="toggleRiscado(event, '${item.uniqueId}')" title="Marcar">✓</button>
            <button class="unmark-button" onclick="toggleRiscado(event, '${item.uniqueId}')" style="display: none;" title="Desmarcar">✗</button>
            <button class="discard-button" onclick="discardItem(event, '${sectionName}', '${item.uniqueId}')" title="Descartar">🗑️</button>
        </div>
    `;
    ulElement.appendChild(listItem);

    if (item.purchased > 0) {
        listItem.classList.add('riscado');
        const markButton = listItem.querySelector('.mark-button');
        const unmarkButton = listItem.querySelector('.unmark-button');
        markButton.style.display = 'none';
        unmarkButton.style.display = 'inline-block';
    }

    updateTotalItemCount();
}

function filterBy(type) {
    switch(type) {
        case 'loja':
            alert('Filtrando por Loja...');
            break;
        case 'fornecedores':
            alert('Filtrando por Fornecedores...');
            break;
        case 'estoque':
            alert('Filtrando por Quantidade em Estoque...');
            break;
        default:
            console.error('Filtro desconhecido:', type);
    }
}

// Função para alterar a quantidade comprada
function changeQuantity(event, sectionName, uniqueId, change) {
    const listItem = event.target.closest('li');
    const input = listItem.querySelector('.purchased-input');
    let currentValue = parseInt(input.value) || 0;
    currentValue = Math.max(0, currentValue + change); // Impede valores negativos
    input.value = currentValue;
    updatePurchased(event, sectionName, uniqueId);
}

// Função para editar um item
function editItem(event, sectionName, uniqueId) {
    const listItem = event.target.closest('li');
    if (!listItem) return;
    const itemIndex = sections.findIndex(section => section.name === sectionName);
    if (itemIndex !== -1) {
        const item = sections[itemIndex].items.find(item => item.uniqueId === uniqueId);
        if (item) {
            // Verifica se já existe um formulário de edição aberto
            if (listItem.querySelector('.edit-form')) return;

            // Cria um formulário para editar o item
            const editForm = document.createElement('div');
            editForm.classList.add('edit-form');
            editForm.innerHTML = `
                <input type="text" placeholder="Nome" value="${item.name}" class="edit-name">
                <input type="text" placeholder="Loja" value="${item.store}" class="edit-store">
                <input type="text" placeholder="Fornecedor" value="${item.supplier || ''}" class="edit-supplier"> <!-- Novo campo para fornecedor -->
                <input type="number" min="0" placeholder="Estoque" value="${item.stock}" class="edit-stock">
                <input type="number" min="0" placeholder="Pedido" value="${item.requested}" class="edit-requested">
                <div class="edit-form-buttons">
                    <button onclick="saveEditItem(event, '${sectionName}', '${uniqueId}')">Salvar</button>
                    <button onclick="cancelEditItem(event)">Cancelar</button>
                </div>
            `;
            // Substitui o conteúdo do item pelo formulário
            listItem.innerHTML = '';
            listItem.appendChild(editForm);
        }
    }
}

// Função para salvar a edição de um item
function saveEditItem(event, sectionName, uniqueId) {
    const listItem = event.target.closest('li');
    if (!listItem) return;
    const nameInput = listItem.querySelector('.edit-name');
    const storeInput = listItem.querySelector('.edit-store');
    const supplierInput = listItem.querySelector('.edit-supplier'); // Novo campo para fornecedor
    const stockInput = listItem.querySelector('.edit-stock');
    const requestedInput = listItem.querySelector('.edit-requested');

    const updatedName = nameInput.value.trim();
    const updatedStore = storeInput.value.trim();
    const updatedSupplier = supplierInput.value.trim();
    const updatedStock = stockInput.value.trim();
    const updatedRequested = requestedInput.value.trim();

    if (!updatedName || !updatedStore) {
        alert('Por favor, insira um nome e uma loja válidos.');
        return;
    }

    // Verifica se já existe um item com o mesmo nome e loja na seção
    const section = sections.find(s => s.name === sectionName);
    if (section) {
        const duplicateItem = section.items.find(i => i.name.toLowerCase() === updatedName.toLowerCase() && i.store.toLowerCase() === updatedStore.toLowerCase() && i.uniqueId !== uniqueId);
        if (duplicateItem) {
            alert('Já existe um item com este nome e loja na seção.');
            return;
        }
    }

    const sectionIndex = sections.findIndex(section => section.name === sectionName);
    if (sectionIndex !== -1) {
        const itemIndex = sections[sectionIndex].items.findIndex(item => item.uniqueId === uniqueId);
        if (itemIndex !== -1) {
            sections[sectionIndex].items[itemIndex].name = updatedName;
            sections[sectionIndex].items[itemIndex].store = updatedStore;
            sections[sectionIndex].items[itemIndex].supplier = updatedSupplier; // Atualiza o fornecedor
            sections[sectionIndex].items[itemIndex].stock = parseInt(updatedStock) || 0;
            sections[sectionIndex].items[itemIndex].requested = parseInt(updatedRequested) || 0;
            saveState();
            // Recria o item na DOM
            const ulElement = listItem.parentElement;
            ulElement.removeChild(listItem);
            addItemToDOM(ulElement, sections[sectionIndex].items[itemIndex], sectionName);
        }
    }
}

// Função para cancelar a edição de um item
function cancelEditItem(event) {
    // Recarrega o estado atual da seção para desfazer a edição
    restoreState();
}

// Função para deletar um estado salvo no Firebase
function deleteSavedState(key) {
    const password = prompt("Digite a senha para confirmar a exclusão:");
    if (password === "DJL2024") {
        database.ref('/savedStates/' + key).remove().then(() => {
            loadSavedStates();
        }).catch(function(error) {
            alert('Erro ao excluir o salvamento: ' + error.message);
            console.error('Erro ao excluir o salvamento:', error);
        });
    } else {
        alert("Senha incorreta. Operação de exclusão cancelada.");
    }
}

// Função para inicializar o Sortable.js em um elemento <ul>
function initializeSortable(ulElement, isFixed) {
    const sortable = new Sortable(ulElement, {
        group: {
            name: 'shared',
            pull: true,
            put: true
        },
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        scroll: true,
        scrollSensitivity: 60,
        scrollSpeed: 20,
        emptyInsertThreshold: 10,
        supportPointer: false,
        disabled: isFixed, // Desabilita a ordenação se a seção estiver fixada
        onEnd: function (evt) {
            const itemId = evt.item.getAttribute('data-unique-id');
            const oldSectionName = evt.from.dataset.sectionName;
            const newSectionName = evt.to.dataset.sectionName;

            if (oldSectionName && newSectionName && oldSectionName !== newSectionName) {
                const oldSection = sections.find(section => section.name === oldSectionName);
                const newSection = sections.find(section => section.name === newSectionName);
                if (oldSection && newSection) {
                    const movedItem = oldSection.items.find(item => item.uniqueId === itemId);

                    // Remover o item da seção antiga e adicionar na nova
                    oldSection.items = oldSection.items.filter(item => item.uniqueId !== itemId);
                    newSection.items.push(movedItem);
                    saveState();
                }
            }

            // Atualizar o placeholder das seções
            if (evt.from.children.length === 0) {
                evt.from.classList.add('placeholder');
            }
            if (evt.to.children.length > 0) {
                evt.to.classList.remove('placeholder');
            }

            updateTotalItemCount(); // Atualiza a contagem total após mover um item
        }
    });

    // Salva a instância do Sortable no próprio elemento para controle posterior
    ulElement._sortable = sortable;
}

// Função para atualizar a quantidade comprada de um item
function updatePurchased(event, sectionName, uniqueId) {
    const section = sections.find(s => s.name === sectionName);
    if (section) {
        const item = section.items.find(i => i.uniqueId === uniqueId);
        if (item) {
            const newPurchased = parseInt(event.target.value) || 0;
            item.purchased = newPurchased;

            // Atualiza o estado de riscado se a quantidade comprada for maior que 0
            const listItem = event.target.closest('li');
            const markButton = listItem.querySelector('.mark-button');
            const unmarkButton = listItem.querySelector('.unmark-button');
            if (newPurchased > 0) {
                if (!listItem.classList.contains('riscado')) {
                    listItem.classList.add('riscado');
                    markButton.style.display = 'none';
                    unmarkButton.style.display = 'inline-block';
                }
                // Atualiza purchasedItems
                const existingItem = purchasedItems.find(p => p.uniqueId === uniqueId);
                if (existingItem) {
                    existingItem.purchased = newPurchased;
                } else {
                    purchasedItems.push({ name: item.name, store: item.store, purchased: newPurchased, uniqueId: uniqueId });
                }
            } else {
                if (listItem.classList.contains('riscado')) {
                    listItem.classList.remove('riscado');
                    markButton.style.display = 'inline-block';
                    unmarkButton.style.display = 'none';
                }
                purchasedItems = purchasedItems.filter(p => p.uniqueId !== uniqueId);
            }
            saveState();
        }
    }
}

// Função para gerar um relatório dos itens comprados
function generateReport() {
    let reportHTML = '<h2>Relatório de Produtos</h2>';
    sections.forEach(section => {
        reportHTML += `<h3>${section.name}:</h3><ul>`;
        section.items.forEach(item => {
            if (item.purchased > 0) {
                reportHTML += `<li>(${item.purchased}) - ${item.name} - (${item.store})</li>`;
            }
        });
        reportHTML += `</ul>`;
    });
    document.getElementById('report').innerHTML = reportHTML;
    document.getElementById('report').scrollIntoView({ behavior: 'smooth' });

    // Torna visível o botão de download após gerar o relatório
    document.getElementById('downloadSection').style.display = 'block';
}

async function generateWord() {
    // Cria um novo documento Word
    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: sections.map(section => {
                    const sectionTitle = new docx.Paragraph({
                        text: section.name || 'Seção',
                        heading: docx.HeadingLevel.HEADING_1,
                        spacing: { after: 200 }
                    });

                    const itemParagraphs = section.items.map(item => {
                        if (item.purchased > 0) {
                            return new docx.Paragraph({
                                text: `(${item.purchased}) - ${item.name} - (${item.store})`,
                                spacing: { after: 100 }
                            });
                        }
                    }).filter(Boolean);

                    return [sectionTitle, ...itemParagraphs, new docx.Paragraph({ text: '', spacing: { after: 200 } })];
                }).flat()
            }
        ]
    });

    try {
        // Gera o documento Word como um Blob e faz o download
        const blob = await docx.Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'relatorio_de_compras.docx';
        link.click();
    } catch (error) {
        console.error('Erro ao gerar o documento Word:', error);
        alert('Ocorreu um erro ao gerar o documento Word. Verifique o console para mais detalhes.');
    }
}

function copyReportToClipboard() {
    const reportElement = document.getElementById('report');
    if (!reportElement || reportElement.innerText.trim() === '') {
        alert('O relatório está vazio. Por favor, gere o relatório primeiro.');
        return;
    }

    // Cria uma string que armazenará o texto do relatório
    let reportText = '';

    // Itera sobre cada seção do relatório, adicionando parágrafos entre elas
    sections.forEach(section => {
        reportText += `\n${section.name}:\n\n`; // Adiciona o nome da seção com duas quebras de linha
        section.items.forEach(item => {
            if (item.purchased > 0) {
                reportText += `(${item.purchased}) - ${item.name} - (${item.store})\n`;
            }
        });
        reportText += '\n'; // Adiciona uma quebra de linha entre as seções para espaçamento
    });

    // Cria um elemento temporário para copiar o texto
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = reportText.trim(); // Remove espaços em excesso antes e depois do texto
    document.body.appendChild(tempTextArea);

    // Seleciona o conteúdo e copia para a área de transferência
    tempTextArea.select();
    document.execCommand('copy');

    // Remove o elemento temporário
    document.body.removeChild(tempTextArea);

    // Alerta o usuário que o texto foi copiado
    alert('Relatório copiado para a área de transferência!');
}

// Salvar estado online no Firebase
function saveOnline() {
    const user = firebase.auth().currentUser;

    if (user) {
        const saveName = prompt("Nome para o salvamento:");
        if (saveName && saveName.trim() !== '') {
            const data = {
                sections: sections,
                purchasedItems: purchasedItems,
                timestamp: Date.now(),
                name: saveName.trim()
            };
            const userId = user.uid;  // Pegando o UID do usuário
            const newDataKey = firebase.database().ref().child('savedStates').child(userId).push().key;

            const updates = {};
            updates[`/savedStates/${userId}/${newDataKey}`] = data;

            firebase.database().ref().update(updates)
                .then(() => {
                    alert('Estado salvo online com sucesso!');
                    loadSavedStates(); // Atualiza a lista de salvamentos
                })
                .catch((error) => {
                    alert('Erro ao salvar online: ' + error.message);
                });
        }
    } else {
        alert("Você precisa estar logado para salvar online.");
    }
}

// Carregar os estados salvos do usuário
function loadSavedStates() {
    const user = firebase.auth().currentUser;

    if (user) {
        const userId = user.uid;  // Pegando o UID do usuário

        firebase.database().ref(`/savedStates/${userId}`).once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                // Processa e exibe os dados do usuário
                if (data) {
                    // Código para atualizar a interface com os dados carregados
                    console.log("Dados carregados: ", data);
                } else {
                    alert("Nenhum salvamento encontrado para este usuário.");
                }
            })
            .catch((error) => {
                alert('Erro ao carregar salvamentos: ' + error.message);
            });
    } else {
        alert("Você precisa estar logado para carregar os salvamentos.");
    }
}

// Função para adicionar um cartão de salvamento ao DOM
function addSavedCardToDOM(savedState) {
    const savedCardsContainer = document.getElementById('savedCards');
    if (!savedCardsContainer) return;
    const card = document.createElement('div');
    card.classList.add('saved-card');
    const date = new Date(savedState.timestamp);
    card.innerHTML = `
        <div class="saved-card-header">
            <strong>${savedState.name || 'Salvamento sem nome'} - ${date.toLocaleString()}</strong>
            <div>
                <button onclick="restoreSavedState('${savedState.key}')">Restaurar</button>
                <button onclick="deleteSavedState('${savedState.key}')">Excluir</button>
            </div>
        </div>`;
    savedCardsContainer.appendChild(card);
}

// Função para restaurar um estado salvo
function restoreSavedState(key) {
    database.ref('/savedStates/' + key).once('value').then(function(snapshot) {
        const data = snapshot.val();

        // Converter sections em array se for um objeto
        sections = data.sections || [];
        if (!Array.isArray(sections)) {
            sections = Object.values(sections);
        }

        // Garantir que items em cada section sejam arrays e adicionar isFixed
        sections.forEach(section => {
            if (section.items) {
                if (!Array.isArray(section.items)) {
                    section.items = Object.values(section.items);
                }
            } else {
                section.items = [];
            }
            if (typeof section.isFixed !== 'boolean') {
                section.isFixed = false;
            }
        });

        // Converter purchasedItems em array se for um objeto
        purchasedItems = data.purchasedItems || [];
        if (!Array.isArray(purchasedItems)) {
            purchasedItems = Object.values(purchasedItems);
        }

        saveState();
        // Limpar o DOM e reconstruir
        document.getElementById('sections').innerHTML = '';
        restoreState();
        // Limpar o relatório
        document.getElementById('report').innerHTML = '';
    }).catch(function(error) {
        alert('Erro ao restaurar o salvamento: ' + error.message);
        console.error('Erro ao restaurar o salvamento:', error);
    });
}

// Função para mostrar/ocultar os salvamentos online e realizar o scroll
function toggleOnlineSaves() {
    const onlineSavesSection = document.getElementById('onlineSavesSection');
    if (onlineSavesSection) {
        if (onlineSavesSection.style.display === 'none' || onlineSavesSection.style.display === '') {
            onlineSavesSection.style.display = 'block';
            // Scroll automático para a seção de salvamentos online
            onlineSavesSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            onlineSavesSection.style.display = 'none';
        }
    }
}

// Função para atualizar a contagem total de itens
function updateTotalItemCount() {
    const totalCountElement = document.getElementById('totalItemCount');
    if (!totalCountElement) return;
    let total = 0;
    sections.forEach(section => {
        total += section.items.length;
    });
    totalCountElement.textContent = total;
}

// Função para organizar itens por similaridade de nomes dentro das seções
function organizeBySimilarity() {
    // Itera sobre cada seção para ordenar seus itens
    sections.forEach(section => {
        // Ordena os itens da seção com base no nome (case-insensitive)
        section.items.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    });

    // Re-renderiza todas as seções para refletir a nova ordem
    restoreState();

    saveState();
    alert('Itens organizados por similaridade de nomes.');
}

// Função para capitalizar a primeira letra de uma string (não mais necessária para organizar por similaridade, mas mantida para outras funcionalidades)
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Função para inicializar tudo ao carregar a página
window.onload = function() {
    restoreState();
    loadSavedStates();
};

window.onscroll = function() {
    toggleScrollToTopButton();
};

function toggleScrollToTopButton() {
    const btn = document.getElementById("scrollToTopBtn");
    if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
        btn.style.display = "block"; // Mostra o botão quando rola mais de 100px
    } else {
        btn.style.display = "none"; // Oculta o botão se voltar ao topo
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Faz a rolagem suave até o topo
    });
}

