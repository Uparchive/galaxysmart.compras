// script.js
let sections = [];

document.addEventListener('DOMContentLoaded', function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        document.getElementById('mainContent').style.display = 'block';
    } else {
        showLoginForm();
    }

    window.onscroll = function() {
        toggleScrollToTopButton();
    };
});
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

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // O usuário está autenticado
        console.log('Usuário autenticado:', user.uid);
    } else {
        // Nenhum usuário autenticado
        console.error('Usuário não autenticado.');
    }
});

// Dados armazenados no localStorage ou inicializados vazios
let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];

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
    const sectionName = document.getElementById('newSectionName').value.trim();

    if (!sectionName) {
        alert('Por favor, insira um nome para a seção.');
        return;
    }

    const newSection = {
        name: sectionName,
        items: []
    };

    sections.push(newSection);
    renderSections(); // Atualiza a interface com a nova seção

    document.getElementById('newSectionName').value = ''; // Limpa o campo de entrada
}

// Função para adicionar uma seção ao DOM
function addSectionToDOM(name, items, isFixed) {
    const sectionsContainer = document.getElementById('sections');
    if (!sectionsContainer) return;

    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('section');
    sectionDiv.innerHTML = `
        <h2>${name}</h2>
        <div class="section-buttons">
            <button class="discard-section-btn" onclick="discardSection(event, '${name}')">Descartar Seção</button>
            <button class="edit-section-btn" onclick="editSectionName(event, '${name}')">Editar Seção</button>
            <button class="pin-section-btn" onclick="toggleFixSection('${name}')">${isFixed ? 'Destravar Seção' : 'Fixar Seção'}</button>
        </div>
        <input type="text" class="search-bar" placeholder="Pesquisar na seção..." onkeyup="filterItems(event, '${name}')">
        <ul class="sortable" data-section-name="${name}"></ul>
        <div class="add-item">
            <input type="number" placeholder="Qtd Estoque" class="newItemStock">
            <input type="text" placeholder="Nome do Produto" class="newItemName">
            <input type="number" placeholder="Qtd Pedida" class="newItemRequested">
            <input type="text" placeholder="Loja" class="newItemStore">
            <button onclick="addItem(event, '${name}')">Adicionar Produto</button>
        </div>`;
    
    sectionsContainer.appendChild(sectionDiv);
    
    const ulElement = sectionDiv.querySelector('ul');

    // Adiciona a classe 'fixed' se a seção estiver fixada
    if (isFixed) {
        ulElement.classList.add('fixed');
    }

    // Certifica-se de adicionar itens já existentes
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
            <div class="item-name">${item.name}</div>
            <div class="item-store">${item.store}</div>
            <div class="item-separator"></div>
            <div class="item-details">
                <span>Est: ${item.stock}</span>
                <span>Ped: ${item.requested}</span>
                <span>Forn: ${item.supplier || 'Não especificado'}</span> <!-- Adiciona o fornecedor -->
            </div>
        </div>
        <div class="button-group">
            <input type="number" min="0" placeholder="Qtd" value="${item.purchased}" class="purchased-input" onchange="updatePurchased(event, '${sectionName}', '${item.uniqueId}')">
            <button class="edit-button" onclick="editItem(event, '${sectionName}', '${item.uniqueId}')" title="Editar">✎</button>
            <button class="mark-button" onclick="toggleRiscado(event, '${item.uniqueId}')" title="Marcar">✓</button>
            <button class="unmark-button" onclick="toggleRiscado(event, '${item.uniqueId}')" style="display: none;" title="Desmarcar">✗</button>
            <button class="discard-button" onclick="discardItem(event, '${sectionName}', '${item.uniqueId}')" title="Descartar">🗑️</button>
        </div>
    `;
    ulElement.appendChild(listItem);

    // Se o item já estava riscado (purchased > 0), atualiza a interface
    if (item.purchased > 0) {
        listItem.classList.add('riscado');
        const markButton = listItem.querySelector('.mark-button');
        const unmarkButton = listItem.querySelector('.unmark-button');
        markButton.style.display = 'none';
        unmarkButton.style.display = 'inline-block';
    }

    updateTotalItemCount(); // Atualiza a contagem total ao adicionar um item
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
            if (item.purchased > 0) { // Considera apenas os itens comprados
                reportHTML += `<li>(${item.purchased}) - ${item.name} - (${item.store})</li>`;
            }
        });
        reportHTML += `</ul>`;
    });
    document.getElementById('report').innerHTML = reportHTML;
    document.getElementById('report').scrollIntoView({ behavior: 'smooth' }); // Rola até o relatório

    // Cria botão para download do relatório em PDF
    const downloadButton = document.createElement('button');
    downloadButton.innerText = 'Baixar Relatório em PDF';
    downloadButton.onclick = generatePDF;
    document.getElementById('report').appendChild(downloadButton);
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10; // Posição Y inicial no PDF
    doc.setFontSize(16);
    doc.text('Relatório de Produtos', 10, y);
    y += 10;

    sections.forEach(section => {
        doc.setFontSize(14);
        doc.text(`${section.name}:`, 10, y);
        y += 10;
        section.items.forEach(item => {
            if (item.purchased > 0) {
                doc.setFontSize(12);
                doc.text(`(${item.purchased}) - ${item.name} - (${item.store})`, 10, y);
                y += 10;
            }
        });
        y += 5;
    });

    doc.save('relatorio_de_compras.pdf');
}

function saveOnline() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        alert('Você precisa estar logado para salvar online.');
        return;
    }

    const database = firebase.database().ref('savedStates/' + loggedInUser);
    const sectionsData = JSON.stringify(sections);

    database.set({
        sections: sectionsData
    }).then(() => {
        alert('Histórico salvo com sucesso!');
    }).catch((error) => {
        console.error('Erro ao salvar o histórico: ', error);
        alert('Não foi possível salvar o histórico.');
    });
}

function loadSavedStates() {
    const user = JSON.parse(localStorage.getItem('loggedInUser'));
    const savedCardsContainer = document.getElementById('savedCards');

    if (!user || !savedCardsContainer) return;

    savedCardsContainer.innerHTML = '<p>Carregando salvamentos...</p>';
    
    database.ref(`/savedStates/${user.storeName}`).once('value').then(snapshot => {
        const savedStates = [];
        snapshot.forEach(childSnapshot => {
            const savedState = childSnapshot.val();
            savedState.key = childSnapshot.key;
            savedStates.push(savedState);
        });

        savedStates.sort((a, b) => b.timestamp - a.timestamp);
        savedCardsContainer.innerHTML = '';
        savedStates.forEach(savedState => {
            addSavedCardToDOM(savedState);
        });
    }).catch(error => {
        savedCardsContainer.innerHTML = '<p>Erro ao carregar salvamentos.</p>';
        console.error('Erro ao carregar salvamentos:', error);
    });
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

// Função para mostrar o formulário de cadastro na primeira visita
window.onload = function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        document.getElementById('mainContent').style.display = 'block';
    } else {
        showLoginForm();
    }
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

function registerUser() {
    const storeName = document.getElementById('storeName').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[storeName]) {
        alert('Este nome de loja já está registrado.');
        return;
    }

    users[storeName] = { password };
    localStorage.setItem('users', JSON.stringify(users));
    alert('Cadastro realizado com sucesso!');
    showLoginForm();
}

function loginUser() {
    const storeName = document.getElementById('loginStoreName').value.trim();
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[storeName] && users[storeName].password === password) {
        localStorage.setItem('loggedInUser', storeName);
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

        // Carregar histórico online do Firebase
        const database = firebase.database().ref('savedStates/' + storeName);
        database.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const savedSections = JSON.parse(snapshot.val().sections);
                sections = savedSections;
                renderSections(); // Função para renderizar as seções no HTML
            }
        }).catch((error) => {
            console.error('Erro ao carregar o histórico: ', error);
        });
    } else {
        alert('Nome da loja ou senha incorretos.');
    }
}

// Função para mostrar o conteúdo principal após login/registro
function showMainContent() {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadSavedStates(); // Carrega os dados específicos do usuário
}

function logoutUser() {
    localStorage.removeItem('loggedInUser');
    location.reload();
}

function showLoginForm() {
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

function showRegistrationForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
}

function renderSections() {
    const sectionsContainer = document.getElementById('sections');
    sectionsContainer.innerHTML = '';

    sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'section';
        sectionDiv.innerHTML = `<h3>${section.name}</h3>`;

        const ulElement = document.createElement('ul');
        section.items.forEach(item => {
            const liElement = document.createElement('li');
            liElement.textContent = `${item.name} - Estoque: ${item.stock} - Loja: ${item.store}`;
            ulElement.appendChild(liElement);
        });

        sectionDiv.appendChild(ulElement);
        sectionsContainer.appendChild(sectionDiv);
    });
}