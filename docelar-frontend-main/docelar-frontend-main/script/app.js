/* =========================
   DOCELAR - FRONTEND SPA
   HTML + CSS + JavaScript puro
   ========================= */

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const icons = {
  home: "▦", products: "⊕", entry: "⇩", stock: "▤", output: "⇧",
  return: "↩", profile: "♙", menu: "☰", bell: "♧", search: "⌕",
  report: "▥", save: "✓", trash: "⌫", edit: "✎", print: "▣"
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2400);
}

function navigate(page) {
  location.hash = page;
  render();
  toggleSidebar(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentPage() {
  return location.hash.replace("#", "") || "home";
}

function statusBadge(status) {
  const map = {
    ok: ["OK", "ok"],
    low: ["BAIXO", "low"],
    critical: ["CRÍTICO", "critical"]
  };
  const [text, cls] = map[status] || [status, ""];
  return `<span class="badge ${cls}">${text}</span>`;
}

function header() {
  return `
    <header class="topbar">
      <button class="menu-toggle" aria-label="Abrir menu" onclick="toggleSidebar()">☰</button>
      <div class="search">
        <span>${icons.search}</span>
        <input id="globalSearch" placeholder="Buscar produtos ou insumos..." oninput="globalSearch(this.value)">
      </div>
      <div class="header-user">
        <span class="bell">${icons.bell}</span>
        <div>
          <strong>${db.user.name}</strong>
          <small>Administrador</small>
        </div>
        <div class="avatar">👩🏻‍🍳</div>
      </div>
    </header>
  `;
}

function sidebar() {
  const page = currentPage();
  const active = p => page === p ? "active" : "";
  return `
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar(false)"></div>
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="logo">Docelar</div>
        <div class="brand-name">DOCELAR<small>PANIFICAÇÃO</small></div>
      </div>
      <nav>
        <button class="${active("home")}" onclick="navigate('home')">${icons.home}<span>TELA PRINCIPAL</span></button>
        <button class="${active("products")}" onclick="navigate('products')">${icons.products}<span>CADASTRO DE PRODUTOS</span></button>
        <button class="${active("entry")}" onclick="navigate('entry')">${icons.entry}<span>ENTRADA DE PRODUTOS</span></button>
        <button class="${active("stock")}" onclick="navigate('stock')">${icons.stock}<span>ESTOQUE</span></button>
        <button class="${active("output")}" onclick="navigate('output')">${icons.output}<span>SAÍDA DE PRODUTOS</span></button>
        <button class="${active("returns")}" onclick="navigate('returns')">${icons.return}<span>DEVOLUÇÃO</span></button>
        <button class="${active("report")}" onclick="navigate('report')">${icons.report}<span>RELATÓRIOS</span></button>
        <button class="${active("profile")}" onclick="navigate('profile')">${icons.profile}<span>TELA PERFIL</span></button>
      </nav>
      <button class="new-order" onclick="showToast('Novo pedido iniciado!')">＋ Novo Pedido</button>
    </aside>
  `;
}

function shell(content, title="") {
  return `
    <div class="layout">
      ${sidebar()}
      <main class="main">
        ${header()}
        <div class="content">${content}</div>
        <footer><span>© 2026 Docelar Gestão de Padaria</span><span>Suporte &nbsp;&nbsp; Voltar</span></footer>
      </main>
    </div>
  `;
}

function statCard(label, value, extra="", cls="") {
  return `
    <div class="stat-card ${cls}">
      <div class="stat-icon">▣</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-extra">${extra}</div>
    </div>
  `;
}

function homePage() {
  const critical = criticalCount();
  return shell(`
    <section class="hero">
      <div>
        <h1>Bom dia, Chef.</h1>
        <p>Sua padaria está com <b>4 novas ordens de produção</b> para hoje. Vamos começar?</p>
      </div>
      <button class="light-btn" onclick="showToast('Agenda de produção aberta')">▣ Ver Agenda de Produção</button>
    </section>

    <div class="stats three">
      ${statCard("TOTAL DE ITENS", totalItems().toLocaleString("pt-BR"), "+12%")}
      ${statCard("ALERTAS CRÍTICOS", String(critical).padStart(2,"0"), "Ação necessária", "danger")}
      ${statCard("SAÍDAS HOJE", "342", "Hoje")}
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-title"><h2>Ações Prioritárias</h2></div>
        <div class="quick-actions">
          <button onclick="navigate('products')">🛒<span>Novo<br>Produto</span></button>
          <button onclick="navigate('stock')">🚚<span>Estoque</span></button>
          <button onclick="navigate('returns')">▣<span>Devolução</span></button>
          <button onclick="navigate('entry')">⇩<span>Receber</span></button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title"><h2>Atividade Recente</h2></div>
        <div class="activity-list">
          ${db.activities.map((a,i)=>`<div class="activity"><span class="activity-icon">${i===0?"▣":i===1?"▤":"↩"}</span><div>${a}<small>${i+1} HORA${i ? "S" : ""} ATRÁS</small></div></div>`).join("")}
        </div>
        <button class="dark-btn full" onclick="showToast('Histórico completo')">Ver Histórico Completo</button>
      </section>
    </div>

    <section class="panel stock-warning">
      <div class="panel-title"><h2>Percepções de Estoque</h2><button class="text-btn" onclick="navigate('stock')">Ver Inventário Completo →</button></div>
      <div class="insights">
        ${db.products.filter(p=>p.status!=="ok").slice(0,2).map(p=>`
          <div class="insight">
            <span class="product-emoji">${p.image}</span>
            <div><b>${p.name}</b><small>ESTOQUE CRÍTICO: ${p.stock}%</small><div class="progress"><i style="width:${Math.max(8,p.stock/p.min*100)}%"></i></div></div>
          </div>`).join("")}
      </div>
    </section>
  `);
}

function productsPage() {
  return shell(`
    <div class="page-heading">
      <div><h1>Cadastro de Produto</h1><p>Insira os detalhes técnicos de sua criação artesanal.</p></div>
      <div class="crumb">Inventário &gt; <b>Novo Produto</b></div>
    </div>
    <div class="form-layout">
      <div>
        <section class="panel form-panel">
          <h2>ⓘ Informações Básicas</h2>
          <div class="form-grid">
            <label class="span-2">NOME DO PRODUTO<input id="pName" placeholder="Ex: Baguete de Fermentação Natural"></label>
            <label>CÓDIGO SKU<input id="pSku" placeholder="BAG-001"></label>
            <label>CATEGORIA<select id="pCategory"><option>Paes Artesanais</option><option>Doces</option><option>Salgados</option><option>Frios</option><option>Recheios</option><option>Derivados</option></select></label>
          </div>
        </section>
        <section class="panel form-panel">
          <h2>▣ Estoque & Valores</h2>
          <div class="form-grid">
            <label>QTD. ATUAL<input id="pStock" type="number" value="120"></label>
            <label>ESTOQUE MÍN.<input id="pMin" type="number" value="20"></label>
            <label>VALOR UNITÁRIO<input id="pPrice" type="number" step="0.01" value="12.50"></label>
            <label class="span-2">FORNECEDOR<input value="Moinho de Trigo Integral S/A"></label>
            <div class="total-box"><small>VALOR TOTAL EM ESTOQUE</small><b id="productTotal">R$ 1.500,00</b></div>
          </div>
        </section>
      </div>
      <aside class="product-side">
        <section class="panel visual">
          <h2>Visual</h2><div class="product-preview">🥖<button onclick="showToast('Seletor de imagem: conecte ao backend futuramente')">☁ Trocar Imagem</button></div>
          <small>FORMATOS SUGERIDOS: JPG, PNG.<br>MÍNIMO DE 800X800PX.</small>
        </section>
        <button class="primary-btn full" onclick="createProduct()">✓ CADASTRO CONCLUÍDO</button>
        <button class="outline-btn full" onclick="resetProductForm()">↻ ATUALIZAR DADOS</button>
        <div class="side-actions"><button onclick="showToast('Consulta realizada')">◉ CONSULTAR</button><button class="danger-outline" onclick="showToast('Exclusão cancelada no modo demonstração')">▣ APAGAR</button></div>
        <div class="tip"><b>💡 DICA DE GESTÃO</b><p>Mantenha o estoque mínimo sempre acima do consumo semanal para evitar interrupções.</p></div>
      </aside>
    </div>
  `);
}

function stockPage() {
  const products = db.products;
  return shell(`
    <div class="page-heading"><div><h1>Estoque</h1><p>Gerencie seus produtos e acompanhe os níveis de estoque.</p></div><button class="outline-btn" onclick="showToast('Relatório enviado para impressão')">▣ Imprimir Relatório</button></div>
    <div class="stats four">
      ${statCard("VALOR TOTAL", money(totalStockValue()), "+12% vs mês anterior")}
      ${statCard("ITENS TOTAIS", totalItems().toLocaleString("pt-BR"), "24 categorias ativas")}
      ${statCard("BAIXO ESTOQUE", products.filter(p=>p.status==="low").length, "Requer atenção imediata")}
      ${statCard("CRÍTICO", products.filter(p=>p.status==="critical").length, "Ruptura iminente", "danger")}
    </div>
    <div class="filter-row">${["Todos","Derivados de Leite","Frios","Salgados","Doces","Bebidas","Recheios","Embalagens"].map((x,i)=>`<button class="${i===0?"selected":""}" onclick="filterStock('${x}',this)">${x}</button>`).join("")}</div>
    <section class="panel table-panel">
      <div class="table-wrap"><table id="stockTable"><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>QTD. ESTOQUE</th><th>VALOR TOTAL</th><th>STATUS</th><th>AÇÕES</th></tr></thead>
      <tbody>${products.map(p=>productRow(p)).join("")}</tbody></table></div>
      <div class="pagination">Mostrando ${products.length} itens <span>‹ <b>1</b> 2 3 ›</span></div>
    </section>
  `);
}

function productRow(p) {
  return `<tr data-category="${p.category}">
    <td><span class="product-img">${p.image}</span><b>${p.name}</b></td><td>${p.category}</td><td>${p.stock} ${p.unit}</td><td>${money(p.total)}</td><td>${statusBadge(p.status)}</td>
    <td><button class="table-icon" onclick="editProduct('${p.id}')">${icons.edit}</button><button class="table-icon" onclick="deleteProduct('${p.id}')">${icons.trash}</button></td>
  </tr>`;
}

function filterStock(category, btn) {
  document.querySelectorAll(".filter-row button").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  document.querySelectorAll("#stockTable tbody tr").forEach(row => {
    row.style.display = category==="Todos" || row.dataset.category===category ? "" : "none";
  });
}

function entryPage() {
  return shell(`
    <div class="page-heading"><div><h1>Entrada de Mercadorias</h1><p>Registre o recebimento de insumos e matérias-primas no estoque.</p></div><div class="heading-actions"><button class="outline-btn">Cancelar Operação</button><button class="primary-btn" onclick="finishEntry()">Finalizar Entrada</button></div></div>
    <div class="entry-grid">
      <div>
        <section class="panel form-panel"><h2>▤ Dados da Nota Fiscal</h2><div class="form-grid"><label>NÚMERO DA NF<input value="000.182.943"></label><label>FORNECEDOR<select><option>Moinho Tradição Alimentos Ltda.</option></select></label><label>DATA DE EMISSÃO<input type="date" value="2024-05-20"></label><label class="span-2">OBSERVAÇÕES DO RECEBIMENTO<input placeholder="Ex: Conferido por João - Lote com 6 meses de validade"></label></div></section>
        <section class="panel table-panel"><div class="panel-title"><h2>Itens Adicionados</h2><span>4 itens na lista</span></div><table><thead><tr><th>COD.</th><th>PRODUTO</th><th>QUANTIDADE</th><th>UNITÁRIO</th><th>TOTAL</th><th>AÇÕES</th></tr></thead><tbody>
          <tr><td>001</td><td>🌾 Farinha Integral Orgânica</td><td>4 sacas</td><td>R$ 145,00</td><td>R$ 580,00</td><td>⌫</td></tr>
          <tr><td>042</td><td>🧈 Manteiga Extra Sal</td><td>12 kg</td><td>R$ 42,50</td><td>R$ 510,00</td><td>⌫</td></tr>
        </tbody></table></section>
      </div>
      <aside><div class="summary-card dark"><small>TOTAL DA NOTA</small><strong>R$ 1.090,00</strong><hr><span>Subtotal R$ 1.090,00</span><span>Impostos R$ 0,00</span><span>Descontos - R$ 0,00</span></div><div class="tip">ⓘ <b>Resumo Fiscal</b><p>A conferência dos itens impactará diretamente o CMV e o estoque.</p></div></aside>
    </div>
  `);
}

function outputPage() {
  const total = db.outputItems.reduce((s,p)=>s+p.qty*p.unitPrice,0);
  return shell(`
    <div class="page-heading"><div><h1>Saída de Produtos</h1><p>Gerencie a expedição de itens artesanais para pedidos confirmados.</p></div><span class="order-code">PED-2024-0892</span></div>
    <div class="output-grid">
      <div>
        <section class="panel add-product"><label>BUSCAR POR NOME OU CÓDIGO<input value="🍞 Pão Integral"></label><label>QUANTIDADE<input value="10"></label><button class="dark-btn" onclick="showToast('Item adicionado à saída')">⊕ Adicionar</button></section>
        <section class="panel table-panel"><div class="panel-title"><h2>Itens na Saída</h2><span>4 ITENS LISTADOS</span></div><table><thead><tr><th>PRODUTO</th><th>CÓDIGO</th><th>QTD</th><th>VALOR UNIT.</th><th>TOTAL</th><th>AÇÕES</th></tr></thead><tbody>${db.outputItems.map(p=>`<tr><td><span class="product-img">${p.image}</span><b>${p.name}</b></td><td>#${p.id}</td><td>${p.qty}</td><td>${money(p.unitPrice)}</td><td>${money(p.qty*p.unitPrice)}</td><td>▣</td></tr>`).join("")}</tbody></table></section>
      </div>
      <aside><div class="panel"><h2>Resumo e Finalização</h2><div class="summary-line">🚚 <b>Luan Silva - Moto 03</b></div><div class="summary-line">▣ Pagamento<br><b>Faturado - 15 Dias</b></div><button class="primary-btn full" onclick="finishOutput()">✓ Salvar Saída</button></div><div class="total-output"><small>VALOR TOTAL DA SAÍDA</small><strong>${money(total)}</strong><span>Subtotal de itens ${money(total)}</span><span>Taxa de Embalagem R$ 0,00</span></div></aside>
    </div>
  `);
}

function returnsPage() {
  return shell(`
    <div class="page-heading"><div><h1>Troca & Devolução</h1></div><div><button class="outline-btn">Cancelar Processo</button> <button class="primary-btn" onclick="showToast('Troca confirmada')">Confirmar Troca</button></div></div>
    <div class="return-grid">
      <div>
        <section class="panel form-panel"><h2>👤 Dados do Comprador e Protocolo</h2><div class="form-grid"><label>NOME COMPLETO<input value="Maria Aparecida de Souza"></label><label>CPF / CNPJ<input value="123.456.789-00"></label><label>E-MAIL PARA CONTATO<input value="maria.souza@email.com"></label><label>TELEFONE<input value="(11) 98765-4321"></label></div></section>
        <section class="panel form-panel"><h2>▣ Identificação do Produto</h2><div class="return-product"><span class="product-img">🍞</span><div><b>Pão de Campanha Tradicional</b><small>Código: #PA-001<br>Unidade: 500g • Fornada: 22/10</small></div><div class="quantity">− &nbsp; 02 &nbsp; +</div></div></section>
        <section class="panel form-panel"><h2>❕ Motivo da Solicitação</h2><label>JUSTIFICATIVA<select><option>Produto com avaria ou defeito de fabricação</option><option>Produto incorreto</option><option>Desistência</option></select></label><label>OBSERVAÇÕES DETALHADAS<textarea placeholder="Descreva aqui o problema encontrado no produto..."></textarea></label></section>
      </div>
      <aside><div class="protocol"><small>PROTOCOLO ATIVO</small><strong>#2024-0892</strong><span>Tipo de Ação TROCA</span><span>Status Atual <b>Aguardando Coleta</b></span><span>Valor Estimado <strong>R$ 62,80</strong></span><button class="primary-btn full">⇄ Confirmar Troca</button><button class="dark-btn full">▣ Confirmar Devolução</button></div><div class="tip">Precisa de ajuda?<p>Consulte nossa política de trocas ou fale com um supervisor.</p></div><button class="primary-btn full">⇄ Ver o histórico de trocas</button></aside>
    </div>
  `);
}

function profilePage() {
  return shell(`
    <div class="profile-grid">
      <aside><section class="panel profile-card"><div class="profile-avatar">👩🏻‍🍳</div><h2>Chef Marina</h2><span class="role">Administrador</span><hr><p>✉ ${db.user.email}</p><p>⌕ ${db.user.phone}</p></section><section class="panel quick-pref"><h2>Preferências Rápidas</h2><label>Modo Escuro <input type="checkbox" onchange="toggleDark(this)"></label><label>Notificações Push <input type="checkbox" checked></label></section></aside>
      <div><section class="panel form-panel"><h2>Informações Pessoais</h2><div class="form-grid"><label class="span-2">NOME COMPLETO<input id="profileName" value="${db.user.fullName}"></label><label>EMAIL PRINCIPAL<input value="${db.user.email}"></label><label>IDIOMA DO SISTEMA<select><option>Português (Brasil)</option></select></label></div><hr><h3>Segurança da Conta</h3><div class="form-grid"><label>NOVA SENHA<input type="password" value="12345678"></label><label>CONFIRMAR NOVA SENHA<input type="password" value="12345678"></label></div></section>
      <section class="panel form-panel"><h2>Configurações de Inventário</h2><div class="setting danger-setting">⚠ <span><b>Alertas de Estoque Crítico</b><small>Receber notificações quando itens atingirem 10% da capacidade.</small></span><input type="checkbox" checked></div><div class="setting">▣ <span><b>Relatórios Semanais Automáticos</b><small>Enviar resumo de entradas e saídas por e-mail toda segunda-feira.</small></span><input type="checkbox"></div></section>
      <div class="form-actions"><button class="outline-btn" onclick="showToast('Saindo da conta...')">↪ Sair da Conta</button><button class="primary-btn" onclick="saveProfile()">▣ Salvar Alterações</button></div></div>
    </div>
  `);
}

function inventoryPage(type) {
  const isCold = type === "frios";
  const list = db.products.filter(p=>p.category===type==="recheios"?"Recheios":"Frios");
  return shell(`
    <div class="breadcrumb">INVENTÁRIO / <b>${isCold ? "FRIOS" : "RECHEIOS"}</b></div>
    <div class="page-heading"><h1>${isCold ? "Frios" : "Recheios"}</h1></div>
    <div class="stats three">
      ${statCard("TOTAL DE ITENS", "142", "+12% vs mês anterior")}
      ${statCard("VALOR EM ESTOQUE", isCold ? "R$ 12.450,80" : "R$ 636,00", "Avaliação Atual")}
      ${statCard("ESTOQUE CRÍTICO", isCold ? "08" : "04", "Ação Requerida", "danger")}
    </div>
    <section class="panel table-panel"><div class="filter-row small"><button class="selected">Todos</button><button>Em Estoque</button><button>Baixo Estoque</button><button>Crítico</button></div>
      <table><thead><tr><th>SKU</th><th>NOME DO PRODUTO</th><th>QTD ATUAL</th><th>UNIDADE</th><th>VL. UNITÁRIO</th><th>TOTAL</th><th>AÇÕES</th></tr></thead>
      <tbody>${list.map(p=>`<tr><td>${p.id}</td><td><span class="product-img">${p.image}</span><b>${p.name}</b></td><td>${statusBadge(p.status)} ${p.stock}</td><td>${p.unit}</td><td>${money(p.price)}</td><td>${money(p.total)}</td><td>✎ ↻</td></tr>`).join("")}</tbody></table>
    </section>
  `);
}

function reportPage() {
  return shell(`
    <div class="page-heading"><div><h1>Relatórios Analíticos</h1><p>Visão detalhada do desempenho da padaria artesanal.</p></div><div><button class="outline-btn">▣ Últimos 30 dias</button><button class="primary-btn" onclick="showToast('Relatório exportado')">⇩ Exportar</button></div></div>
    <div class="stats four">
      ${statCard("VENDAS TOTAIS","R$ 42.850,00","+12%")}
      ${statCard("GIRO DE ESTOQUE","4.2× / mês","Estável")}
      ${statCard("RUPTURAS DE ESTOQUE","8 Itens","Atenção","danger")}
      ${statCard("NOVOS CLIENTES","124","+5%")}
    </div>
    <div class="report-grid">
      <section class="panel chart-panel"><div class="panel-title"><h2>Vendas por Período</h2><span>● Receita &nbsp; ● Metas</span></div><div class="bars">${[55,82,70,96,110,91].map((h,i)=>`<div class="bar-wrap"><div class="bar-bg" style="height:${h}px"><i style="height:${h-18}px"></i></div><small>${["Seg","Ter","Qua","Qui","Sex","Sáb"][i]}</small></div>`).join("")}</div></section>
      <section class="panel donut-panel"><div class="panel-title"><h2>Produtos +Vendidos</h2></div><div class="donut"><b>640<small>Total un.</small></b></div><ul><li>Pão de Fermentação <b>42%</b></li><li>Croissant Clássico <b>28%</b></li><li>Outros <b>30%</b></li></ul></section>
    </div>
    <section class="panel table-panel"><div class="panel-title"><h2>Resumo de Movimentações</h2><span>Ver todas</span></div><table><thead><tr><th>DATA</th><th>PRODUTO</th><th>TIPO</th><th>FORNECEDOR</th><th>QUANTIDADE</th><th>VALOR TOTAL</th></tr></thead><tbody><tr><td>15/05/2024</td><td>🌾 Farinha Integral Orgânica</td><td><span class="badge ok">Entrada</span></td><td>Moinho Central Ltda.</td><td>50kg</td><td>R$ 450,00</td></tr></tbody></table></section>
  `);
}

function createProduct() {
  const name = document.querySelector("#pName")?.value.trim();
  if (!name) return showToast("Informe o nome do produto.");
  const stock = Number(document.querySelector("#pStock").value);
  const min = Number(document.querySelector("#pMin").value);
  const price = Number(document.querySelector("#pPrice").value);
  db.products.push({
    id: document.querySelector("#pSku").value || `NEW-${Date.now()}`,
    name, category: document.querySelector("#pCategory").value,
    stock, min, unit: "un", price, total: stock*price,
    status: stock <= min ? (stock <= min/2 ? "critical":"low") : "ok", image:"🥖"
  });
  saveDB(db); showToast("Produto cadastrado com sucesso!"); navigate("stock");
}

function deleteProduct(id) {
  if (!confirm("Excluir este produto?")) return;
  db.products = db.products.filter(p=>p.id!==id); saveDB(db); render(); showToast("Produto excluído.");
}

function editProduct(id) {
  const p = db.products.find(x=>x.id===id);
  if (!p) return;
  const newStock = prompt(`Nova quantidade para ${p.name}:`, p.stock);
  if (newStock === null) return;
  p.stock = Number(newStock); p.total = p.stock*p.price;
  p.status = p.stock <= p.min ? (p.stock <= p.min/2 ? "critical":"low") : "ok";
  saveDB(db); render(); showToast("Estoque atualizado.");
}

function saveProfile() {
  const name = document.querySelector("#profileName")?.value;
  if (name) db.user.fullName = name;
  saveDB(db); showToast("Alterações salvas!");
}

function finishEntry() { showToast("Entrada finalizada com sucesso!"); }
function finishOutput() { showToast("Saída salva com sucesso!"); }
function resetProductForm() { render(); showToast("Dados restaurados."); }

function globalSearch(value) {
  if (!value.trim()) return;
  if (currentPage() !== "stock") return;
  document.querySelectorAll("#stockTable tbody tr").forEach(row=>{
    row.style.display = row.innerText.toLowerCase().includes(value.toLowerCase()) ? "" : "none";
  });
}

function toggleSidebar(force) {
  const sidebar = document.querySelector("#sidebar");
  const overlay = document.querySelector("#sidebarOverlay");
  if (!sidebar || !overlay) return;

  const shouldOpen = typeof force === "boolean"
    ? force
    : !sidebar.classList.contains("open");

  sidebar.classList.toggle("open", shouldOpen);
  overlay.classList.toggle("show", shouldOpen);
  document.body.classList.toggle("menu-open", shouldOpen);
}

function toggleDark(input) {
  document.body.classList.toggle("dark-mode", input.checked);
}

function render() {
  const page = currentPage();
  const pages = {
    home: homePage,
    products: productsPage,
    entry: entryPage,
    stock: stockPage,
    output: outputPage,
    returns: returnsPage,
    profile: profilePage,
    recheios: () => inventoryPage("recheios"),
    frios: () => inventoryPage("frios"),
    report: reportPage
  };
  app.innerHTML = (pages[page] || homePage)();
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
