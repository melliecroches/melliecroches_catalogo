// =================================================================
// CONFIGURAÇÕES GERAIS
// =================================================================
const CONFIG = {
    telefone: '558499999999',    // SEU WHATSAPP AQUI (DDD + Número)
    nomeLoja: 'Melliê Crochês',
    instagram: 'melliecroches'
};

// =================================================================
// 1. INICIALIZAÇÃO E SIDEBAR
// =================================================================

// Assim que a página carrega, fazemos isso:
document.addEventListener('DOMContentLoaded', () => {
    inicializarSidebar();
    renderizarProdutos(produtos); // Mostra tudo inicialmente
    atualizarContadorCarrinho();
});

function inicializarSidebar() {
    const listaSidebar = document.getElementById('lista-categorias-sidebar');
    if (!listaSidebar) return;

    listaSidebar.innerHTML = ''; // Limpa antes de criar

    // 1. Criar opção "Tudo" (Padrão)
    const itemTudo = document.createElement('li');
    itemTudo.textContent = 'Ver Tudo';
    itemTudo.classList.add('ativo'); // Começa marcado
    itemTudo.onclick = () => {
        ativarItemSidebar(itemTudo);
        filtrarCategoria('tudo');
    };
    listaSidebar.appendChild(itemTudo);

    // 2. Pegar categorias únicas dos produtos
    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];

    // 3. Criar os itens da lista
    categoriasUnicas.forEach(catId => {
        const li = document.createElement('li');
        
        // Tenta usar o nome bonito do produtos.js, se não tiver, usa o ID mesmo
        const nomeExibicao = (typeof NOMES_CATEGORIAS !== 'undefined' && NOMES_CATEGORIAS[catId]) 
                             ? NOMES_CATEGORIAS[catId] 
                             : catId.charAt(0).toUpperCase() + catId.slice(1);

        li.textContent = nomeExibicao;
        
        li.onclick = () => {
            ativarItemSidebar(li);
            filtrarCategoria(catId);
        };

        listaSidebar.appendChild(li);
    });
}

// Função visual para trocar o "Check" (✓) e a cor rosa
function ativarItemSidebar(itemClicado) {
    const todosItens = document.querySelectorAll('#lista-categorias-sidebar li');
    todosItens.forEach(li => li.classList.remove('ativo'));
    itemClicado.classList.add('ativo');
}

// =================================================================
// 2. LÓGICA DE EXIBIÇÃO E FILTRO
// =================================================================

function filtrarCategoria(categoria) {
    const titulo = document.getElementById('titulo-categoria-atual');
    const inputBusca = document.getElementById('campo-busca');
    
    // Limpa a busca quando troca de categoria para não confundir
    inputBusca.value = '';

    if (categoria === 'tudo') {
        titulo.textContent = 'Todas as Peças';
        renderizarProdutos(produtos);
    } else {
        // Atualiza o título
        const nomeCat = (typeof NOMES_CATEGORIAS !== 'undefined' && NOMES_CATEGORIAS[categoria]) 
                        ? NOMES_CATEGORIAS[categoria] : categoria;
        titulo.textContent = nomeCat;

        // Filtra
        const filtrados = produtos.filter(p => p.categoria === categoria);
        renderizarProdutos(filtrados);
    }
}

// Busca por texto (Funciona junto com o layout novo)
document.getElementById('campo-busca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const titulo = document.getElementById('titulo-categoria-atual');
    
    if (termo === '') {
        titulo.textContent = 'Todas as Peças';
        renderizarProdutos(produtos);
        return;
    }

    titulo.textContent = `Buscando por: "${termo}"`;
    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(termo));
    renderizarProdutos(filtrados);
});

function renderizarProdutos(listaProdutos) {
    const container = document.getElementById('catalogo-principal');
    const msgErro = document.getElementById('mensagem-sem-resultados');
    
    container.innerHTML = '';

    if (listaProdutos.length === 0) {
        msgErro.classList.remove('escondido');
        return;
    } else {
        msgErro.classList.add('escondido');
    }

    listaProdutos.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Ao clicar no card, abre o modal (exceto se clicar no botão)
        card.onclick = () => abrirModalProduto(produto);

        card.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
            <h3>${produto.nome}</h3>
            <span class="price">${formatarMoeda(produto.preco)}</span>
            <button class="btn-detalhes">Ver Detalhes</button>
        `;

        container.appendChild(card);
    });
}

// =================================================================
// 3. CARRINHO E CHECKOUT (Lógica Mantida)
// =================================================================

let carrinho = JSON.parse(localStorage.getItem('carrinho_mellie')) || [];

function adicionarAoCarrinho() {
    if (!produtoAtualModal) return;

    // Pega opções de cor (se houver)
    let corSelecionada = 'Padrão';
    const selects = document.querySelectorAll('.select-cor-dinamico');
    if (selects.length > 0) {
        const escolhas = Array.from(selects).map(s => s.options[s.selectedIndex].text);
        corSelecionada = escolhas.join(' / ');
    }

    const qtd = parseInt(document.getElementById('qtd-selecionada').textContent);
    
    const item = {
        id: produtoAtualModal.id,
        nome: produtoAtualModal.nome,
        preco: produtoAtualModal.preco,
        imagem: produtoAtualModal.imagem,
        cor: corSelecionada,
        qtd: qtd
    };

    // Verifica se já existe igual no carrinho para somar
    const existente = carrinho.find(i => i.id === item.id && i.cor === item.cor);
    if (existente) {
        existente.qtd += qtd;
    } else {
        carrinho.push(item);
    }

    salvarCarrinho();
    mostrarToast("Item adicionado ao carrinho!");
    fecharModalProduto();
    atualizarContadorCarrinho();
}

function atualizarContadorCarrinho() {
    const count = carrinho.reduce((total, item) => total + item.qtd, 0);
    document.getElementById('contador-carrinho').textContent = count;
}

function abrirModalCheckout() {
    const modal = document.getElementById('modal-checkout');
    const lista = document.getElementById('lista-itens-carrinho');
    const totalEl = document.getElementById('valor-total-carrinho');
    
    lista.innerHTML = '';
    let total = 0;

    if (carrinho.length === 0) {
        lista.innerHTML = '<p style="text-align:center; padding:20px;">Seu carrinho está vazio.</p>';
    } else {
        carrinho.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'item-carrinho';
            div.innerHTML = `
                <div class="item-info">
                    <h4>${item.nome} <span style="font-size:0.8rem; color:#888;">(x${item.qtd})</span></h4>
                    <span>${item.cor}</span>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="item-total">${formatarMoeda(item.preco * item.qtd)}</span>
                    <button class="btn-remover" onclick="removerDoCarrinho(${index})">Remover</button>
                </div>
            `;
            lista.appendChild(div);
            total += item.preco * item.qtd;
        });
    }

    totalEl.textContent = formatarMoeda(total);
    modal.style.display = 'flex';
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    salvarCarrinho();
    abrirModalCheckout(); // Recarrega a lista
    atualizarContadorCarrinho();
}

// =================================================================
// 4. MODAL DE PRODUTO
// =================================================================
let produtoAtualModal = null;

function abrirModalProduto(produto) {
    produtoAtualModal = produto;
    const modal = document.getElementById('modal-produto');
    
    // Preenche dados básicos
    document.getElementById('modal-img').src = produto.imagem;
    document.getElementById('modal-img').onclick = () => abrirLightbox(produto.imagem); // Zoom
    document.getElementById('modal-titulo').textContent = produto.nome;
    document.getElementById('modal-desc').textContent = produto.descricao || "Peça artesanal feita com carinho.";
    document.getElementById('modal-preco').textContent = formatarMoeda(produto.preco);
    
    // Tamanho (se existir)
    const tamEl = document.getElementById('modal-tamanho');
    tamEl.textContent = produto.tamanho ? `Tamanho: ${produto.tamanho}` : '';

    // Reset quantidade
    document.getElementById('qtd-selecionada').textContent = '1';

    // Gerar Selects de Cor (Dinâmico do produtos.js)
    const containerCores = document.getElementById('container-opcoes-cores');
    containerCores.innerHTML = '';

    if (produto.camposCor && produto.camposCor.length > 0) {
        produto.camposCor.forEach(campo => {
            const div = document.createElement('div');
            div.className = 'grupo-select';
            
            let optionsHTML = '';
            // Pega as cores da coleção definida no produto
            const coresColecao = CORES_COLECAO[campo.paleta] || [];
            
            coresColecao.forEach(cor => {
                optionsHTML += `<option value="${cor.nome}">${cor.nome}</option>`;
            });

            div.innerHTML = `
                <label>${campo.label}:</label>
                <select class="select-cor-dinamico">
                    ${optionsHTML}
                </select>
            `;
            containerCores.appendChild(div);
        });
    }

    modal.style.display = 'flex';
}

function mudarQtd(delta) {
    const span = document.getElementById('qtd-selecionada');
    let atual = parseInt(span.textContent);
    atual += delta;
    if (atual < 1) atual = 1;
    span.textContent = atual;
}

// =================================================================
// 5. UTILITÁRIOS E WHATSAPP
// =================================================================

function alternarEntrega() {
    const tipo = document.querySelector('input[name="entrega"]:checked').value;
    const divEnvio = document.getElementById('info-envio');
    const divRetirada = document.getElementById('info-retirada');

    if (tipo === 'envio') {
        divEnvio.classList.remove('escondido');
        divRetirada.classList.add('escondido');
    } else {
        divEnvio.classList.add('escondido');
        divRetirada.classList.remove('escondido');
    }
}

function enviarPedidoWhatsapp() {
    if (carrinho.length === 0) return alert("Seu carrinho está vazio!");

    let mensagem = `Olá! Gostaria de fazer um pedido na ${CONFIG.nomeLoja}:\n\n`;
    
    let total = 0;
    carrinho.forEach(item => {
        const subtotal = item.preco * item.qtd;
        mensagem += `▪ ${item.qtd}x ${item.nome}\n   Detalhes: ${item.cor}\n   Valor: ${formatarMoeda(subtotal)}\n`;
        total += subtotal;
    });

    mensagem += `\n*TOTAL PRODUTOS: ${formatarMoeda(total)}*\n`;

    // Dados de Entrega
    const tipoEntrega = document.querySelector('input[name="entrega"]:checked').value;
    if (tipoEntrega === 'retirada') {
        mensagem += `\n📦 Forma de Entrega: RETIRADA`;
    } else {
        const rua = document.getElementById('end-rua').value;
        const bairro = document.getElementById('end-bairro').value;
        if (!rua || !bairro) return alert("Por favor, preencha o endereço de entrega.");
        
        mensagem += `\n📦 Forma de Entrega: ENVIO`;
        mensagem += `\n📍 Endereço: ${rua}, ${document.getElementById('end-numero').value} - ${bairro}`;
        mensagem += `\n🏙 Cidade: ${document.getElementById('end-cidade').value}`;
    }

    const link = `https://wa.me/${CONFIG.telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
}

function salvarCarrinho() {
    localStorage.setItem('carrinho_mellie', JSON.stringify(carrinho));
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'mostrar';
    setTimeout(() => { toast.className = toast.className.replace('mostrar', ''); }, 3000);
}

// Fechar modais ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
    if (event.target.classList.contains('lightbox')) {
        fecharLightbox();
    }
}

function fecharModalProduto() { document.getElementById('modal-produto').style.display = 'none'; }
function fecharModalCheckout() { document.getElementById('modal-checkout').style.display = 'none'; }

// Lightbox (Zoom)
function abrirLightbox(src) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('imagem-destaque');
    img.src = src;
    lb.style.display = 'flex';
}
function fecharLightbox() { document.getElementById('lightbox').style.display = 'none'; }