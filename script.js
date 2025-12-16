// =================================================================
// CONFIGURAÇÕES GERAIS
// =================================================================
const CONFIG = {
    telefone: '558499999999',    // SEU WHATSAPP AQUI (DDD + Número)
    nomeLoja: 'Melliê Crochês',
    instagram: 'melliecroches'
};

// Variável para guardar o que está sendo exibido no momento (para a ordenação funcionar)
let produtosAtuais = [];

// =================================================================
// 1. INICIALIZAÇÃO
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa com todos os produtos
    produtosAtuais = [...produtos]; // Cria uma cópia da lista original
    
    inicializarSidebar();
    renderizarProdutos(produtosAtuais);
    atualizarContadorCarrinho();
});

function inicializarSidebar() {
    const listaSidebar = document.getElementById('lista-categorias-sidebar');
    if (!listaSidebar) return;

    listaSidebar.innerHTML = ''; 

    // 1. Opção "Ver Tudo"
    const itemTudo = document.createElement('li');
    itemTudo.textContent = 'Ver Tudo';
    itemTudo.classList.add('ativo'); 
    itemTudo.onclick = () => {
        ativarItemSidebar(itemTudo);
        filtrarCategoria('tudo');
    };
    listaSidebar.appendChild(itemTudo);

    // 2. Pegar categorias únicas
    const categoriasUnicas = [...new Set(produtos.map(p => p.categoria))];

    // 3. Criar itens
    categoriasUnicas.forEach(catId => {
        const li = document.createElement('li');
        
        // Nome bonito (se existir no produtos.js) ou o próprio ID formatado
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

function ativarItemSidebar(itemClicado) {
    const todosItens = document.querySelectorAll('#lista-categorias-sidebar li');
    todosItens.forEach(li => li.classList.remove('ativo'));
    itemClicado.classList.add('ativo');
}

// =================================================================
// 2. FILTROS, BUSCA E ORDENAÇÃO
// =================================================================

function filtrarCategoria(categoria) {
    const titulo = document.getElementById('titulo-categoria-atual');
    const inputBusca = document.getElementById('campo-busca');
    
    // Reseta a busca e o select de ordenação
    inputBusca.value = '';
    document.getElementById('select-ordenacao').value = 'padrao';

    if (categoria === 'tudo') {
        titulo.textContent = 'Todas as Peças';
        produtosAtuais = [...produtos];
    } else {
        const nomeCat = (typeof NOMES_CATEGORIAS !== 'undefined' && NOMES_CATEGORIAS[categoria]) 
                        ? NOMES_CATEGORIAS[categoria] : categoria;
        titulo.textContent = nomeCat;

        produtosAtuais = produtos.filter(p => p.categoria === categoria);
    }

    renderizarProdutos(produtosAtuais);
}

// Busca por Texto
document.getElementById('campo-busca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const titulo = document.getElementById('titulo-categoria-atual');
    
    if (termo === '') {
        titulo.textContent = 'Todas as Peças';
        produtosAtuais = [...produtos];
    } else {
        titulo.textContent = `Buscando por: "${termo}"`;
        produtosAtuais = produtos.filter(p => p.nome.toLowerCase().includes(termo));
    }
    
    renderizarProdutos(produtosAtuais);
});

// NOVA FUNÇÃO: ORDENAÇÃO
function aplicarOrdenacao() {
    const tipo = document.getElementById('select-ordenacao').value;
    
    // Ordena a lista "produtosAtuais"
    if (tipo === 'menor-preco') {
        produtosAtuais.sort((a, b) => a.preco - b.preco);
    } else if (tipo === 'maior-preco') {
        produtosAtuais.sort((a, b) => b.preco - a.preco);
    } else if (tipo === 'az') {
        produtosAtuais.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (tipo === 'za') {
        produtosAtuais.sort((a, b) => b.nome.localeCompare(a.nome));
    } else {
        // Padrão: volta para a ordem original do array de produtos (geralmente por ID ou data de inserção)
        // Como 'produtosAtuais' já está filtrado, precisamos re-filtrar da origem para garantir a ordem
        // (Simplificação: ordenamos por ID se existir, senão mantemos como está)
        produtosAtuais.sort((a, b) => a.id - b.id);
    }

    renderizarProdutos(produtosAtuais);
}

function renderizarProdutos(lista) {
    const container = document.getElementById('catalogo-principal');
    const msgErro = document.getElementById('mensagem-sem-resultados');
    const contador = document.getElementById('contador-produtos');
    
    container.innerHTML = '';

    // Atualiza o contador na Toolbar
    if (contador) {
        contador.textContent = `Mostrando ${lista.length} produto(s)`;
    }

    if (lista.length === 0) {
        msgErro.classList.remove('escondido');
        return;
    } else {
        msgErro.classList.add('escondido');
    }

    lista.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = (e) => {
            // Se clicar no botão "Ver Detalhes", não dispara o click do card duas vezes
            if(e.target.tagName === 'BUTTON') return; 
            abrirModalProduto(produto);
        };

        card.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}" loading="lazy">
            <h3>${produto.nome}</h3>
            <span class="price">${formatarMoeda(produto.preco)}</span>
            <button class="btn-detalhes" onclick="abrirModalProdutoId(${produto.id})">Ver Detalhes</button>
        `;

        container.appendChild(card);
    });
}

// Pequeno helper para o botão chamar a função passando o objeto certo
function abrirModalProdutoId(id) {
    const prod = produtos.find(p => p.id === id);
    if(prod) abrirModalProduto(prod);
}

// =================================================================
// 3. CARRINHO E CHECKOUT
// =================================================================

let carrinho = JSON.parse(localStorage.getItem('carrinho_mellie')) || [];

function adicionarAoCarrinho() {
    if (!produtoAtualModal) return;

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
    abrirModalCheckout(); 
    atualizarContadorCarrinho();
}

// =================================================================
// 4. MODAL DE PRODUTO
// =================================================================
let produtoAtualModal = null;

function abrirModalProduto(produto) {
    produtoAtualModal = produto;
    const modal = document.getElementById('modal-produto');
    const imgPrincipal = document.getElementById('modal-img');
    const galeriaContainer = document.getElementById('galeria-miniaturas');
    
    // 1. Define a imagem principal inicial
    imgPrincipal.src = produto.imagem;
    imgPrincipal.onclick = () => abrirLightbox(imgPrincipal.src); // Zoom

    // 2. Lógica da Galeria (CORRIGIDA)
    galeriaContainer.innerHTML = ''; 

    // AQUI ESTAVA O ERRO. AGORA CORRIGIDO:
    // Cria uma lista começando com a imagem principal
    let listaImagens = [produto.imagem];

    // Se tiver fotos extras, adiciona elas na lista (sem apagar a principal)
    if (produto.fotosExtras && produto.fotosExtras.length > 0) {
        listaImagens = listaImagens.concat(produto.fotosExtras);
    }
    
    // Remove duplicatas (caso você tenha colocado a imagem principal dentro das extras sem querer)
    listaImagens = [...new Set(listaImagens)];

    // Só exibe a galeria se tiver mais de 1 foto no total
    if (listaImagens.length > 1) { 
        listaImagens.forEach((fotoSrc) => {
            const thumb = document.createElement('img');
            thumb.src = fotoSrc;
            
            // Se essa miniatura for igual à foto que está grande agora, marca como ativa
            if (fotoSrc === imgPrincipal.src) thumb.classList.add('ativa');

            thumb.onclick = () => {
                // Troca a imagem grande
                imgPrincipal.src = fotoSrc;
                imgPrincipal.onclick = () => abrirLightbox(fotoSrc); // Atualiza zoom

                // Atualiza borda rosa
                document.querySelectorAll('.galeria-miniaturas img').forEach(img => img.classList.remove('ativa'));
                thumb.classList.add('ativa');
            };

            galeriaContainer.appendChild(thumb);
        });
    }

    // 3. Preenche textos
    document.getElementById('modal-titulo').textContent = produto.nome;
    document.getElementById('modal-desc').textContent = produto.descricao || "Peça artesanal feita com carinho.";
    document.getElementById('modal-preco').textContent = formatarMoeda(produto.preco);
    
    const tamEl = document.getElementById('modal-tamanho');
    tamEl.textContent = produto.tamanho ? `Tamanho: ${produto.tamanho}` : '';

    document.getElementById('qtd-selecionada').textContent = '1';

    // 4. Selects de Cores
    const containerCores = document.getElementById('container-opcoes-cores');
    containerCores.innerHTML = '';

    if (produto.camposCor && produto.camposCor.length > 0) {
        produto.camposCor.forEach(campo => {
            const div = document.createElement('div');
            div.className = 'grupo-select';
            let optionsHTML = '';
            const coresColecao = (typeof CORES_COLECAO !== 'undefined' && CORES_COLECAO[campo.paleta]) 
                                 ? CORES_COLECAO[campo.paleta] : [];
            coresColecao.forEach(cor => {
                optionsHTML += `<option value="${cor.nome}">${cor.nome}</option>`;
            });
            div.innerHTML = `<label>${campo.label}:</label><select class="select-cor-dinamico">${optionsHTML}</select>`;
            containerCores.appendChild(div);
        });
    }

    modal.style.display = 'flex';
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

function abrirLightbox(src) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('imagem-destaque');
    img.src = src;
    lb.style.display = 'flex';
}
function fecharLightbox() { document.getElementById('lightbox').style.display = 'none'; }