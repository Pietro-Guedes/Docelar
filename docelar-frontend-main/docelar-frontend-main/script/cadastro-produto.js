/* =========================================================
   DOCELAR — Cadastro de Produto
   Liga o formulário à API real (ProdutoService / imagemService).
   ========================================================= */
 
const els = {
  form: document.querySelector("#formProduto"),
  nome: document.querySelector("#nome"),
  descricao: document.querySelector("#descricao"),
  valor: document.querySelector("#valor_unitario"),
  categoria: document.querySelector("#id_categoria"),
  fornecedor: document.querySelector("#id_fornecedor"),
  funcionario: document.querySelector("#id_funcionario"),
  imagemInput: document.querySelector("#imagemInput"),
  tagDrop: document.querySelector("#tagDrop"),
  tagPreview: document.querySelector("#tagPreview"),
  tagLabel: document.querySelector("#tagLabel"),
  btnSalvar: document.querySelector("#btnSalvar"),
  btnLimpar: document.querySelector("#btnLimpar"),
  toast: document.querySelector("#toast"),
  connDot: document.querySelector("#connDot"),
  connLabel: document.querySelector("#connLabel"),
};
 
let imagemSelecionada = null;
 
/* ---------- toast ---------- */
 
function showToast(message, kind = "") {
  els.toast.textContent = message;
  els.toast.className = `toast show ${kind}`;
  setTimeout(() => (els.toast.className = "toast"), 3200);
}
 
/* ---------- validação de campo ---------- */
 
function setFieldError(fieldId, hasError) {
  document.querySelector(`#${fieldId}`).classList.toggle("invalid", hasError);
}
 
/* ---------- checagem de conexão com a API ---------- */
 
async function checarConexao() {
  try {
    await apiRequest("/");
    els.connDot.classList.add("ok");
    els.connLabel.textContent = "Conectado à API";
  } catch {
    els.connDot.classList.add("error");
    els.connLabel.textContent = "API indisponível (verifique se o servidor está rodando na porta 3000)";
  }
}
 
/* ---------- popular selects ---------- */
 
function popularSelect(select, itens, { placeholder, labelKey = "nome", valueKey = "id" }) {
  select.innerHTML = "";
 
  const optPlaceholder = document.createElement("option");
  optPlaceholder.value = "";
  optPlaceholder.textContent = placeholder;
  select.appendChild(optPlaceholder);
 
  itens.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    select.appendChild(opt);
  });
}
 
async function carregarListas() {
  try {
    const { dados: categorias } = await Api.categorias.listar();
    popularSelect(els.categoria, categorias, { placeholder: "Selecione uma categoria" });
  } catch (err) {
    popularSelect(els.categoria, [], { placeholder: "Não foi possível carregar" });
  }
 
  try {
    const { dados: fornecedores } = await Api.fornecedores.listar();
    popularSelect(els.fornecedor, fornecedores, { placeholder: "Selecione um fornecedor" });
  } catch (err) {
    popularSelect(els.fornecedor, [], { placeholder: "Não foi possível carregar" });
  }
 
  try {
    const { dados: funcionarios } = await Api.funcionarios.listar();
    popularSelect(els.funcionario, funcionarios, { placeholder: "Selecione o responsável" });
  } catch (err) {
    popularSelect(els.funcionario, [], { placeholder: "Não foi possível carregar" });
  }
}
 
/* ---------- imagem: preview + drag&drop ---------- */
 
function tratarArquivoImagem(file) {
  if (!file) return;
 
  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (!tiposPermitidos.includes(file.type)) {
    showToast("Apenas imagens JPEG, PNG ou WEBP são permitidas.", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("A imagem deve ter no máximo 5MB.", "error");
    return;
  }
 
  imagemSelecionada = file;
  els.tagLabel.textContent = file.name;
 
  const reader = new FileReader();
  reader.onload = (e) => {
    els.tagPreview.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização" />`;
  };
  reader.readAsDataURL(file);
}
 
els.imagemInput.addEventListener("change", (e) => tratarArquivoImagem(e.target.files[0]));
 
["dragenter", "dragover"].forEach((evt) =>
  els.tagDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    els.tagDrop.classList.add("dragover");
  })
);
 
["dragleave", "drop"].forEach((evt) =>
  els.tagDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    els.tagDrop.classList.remove("dragover");
  })
);
 
els.tagDrop.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  tratarArquivoImagem(file);
});
 
/* ---------- validação + submit ---------- */
 
function validarFormulario() {
  let valido = true;
 
  const nomeOk = els.nome.value.trim().length > 0;
  setFieldError("fieldNome", !nomeOk);
  valido = valido && nomeOk;
 
  const descricaoOk = els.descricao.value.trim().length > 0;
  setFieldError("fieldDescricao", !descricaoOk);
  valido = valido && descricaoOk;
 
  const valorNum = Number(els.valor.value);
  const valorOk = els.valor.value !== "" && !Number.isNaN(valorNum) && valorNum >= 0;
  setFieldError("fieldValor", !valorOk);
  valido = valido && valorOk;
 
  const funcionarioOk = els.funcionario.value !== "";
  setFieldError("fieldFuncionario", !funcionarioOk);
  valido = valido && funcionarioOk;
 
  return valido;
}
 
function limparFormulario() {
  els.form.reset();
  imagemSelecionada = null;
  els.tagPreview.innerHTML = "🍞";
  els.tagLabel.textContent = "Clique ou arraste uma imagem";
  ["fieldNome", "fieldDescricao", "fieldValor", "fieldFuncionario"].forEach((id) => setFieldError(id, false));
}
 
els.btnLimpar.addEventListener("click", limparFormulario);
 
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
 
  if (!validarFormulario()) {
    showToast("Confira os campos destacados.", "error");
    return;
  }
 
  const dados = {
    nome: els.nome.value.trim(),
    descricao: els.descricao.value.trim(),
    valor_unitario: Number(els.valor.value),
    id_categoria: els.categoria.value ? Number(els.categoria.value) : null,
    id_fornecedor: els.fornecedor.value ? Number(els.fornecedor.value) : null,
    id_funcionario: Number(els.funcionario.value),
  };
 
  els.btnSalvar.disabled = true;
  els.btnSalvar.textContent = "Salvando...";
 
  try {
    const resultado = await Api.produtos.cadastrar(dados);
    const idProduto = resultado.id;
 
    if (imagemSelecionada && idProduto) {
      try {
        await Api.imagens.cadastrar(idProduto, imagemSelecionada);
      } catch (imgErr) {
        showToast(`Produto cadastrado, mas a imagem falhou: ${imgErr.mensagem}`, "error");
        limparFormulario();
        return;
      }
    }
 
    showToast("Produto cadastrado com sucesso!", "success");
    limparFormulario();
  } catch (err) {
    showToast(err.mensagem || "Erro ao cadastrar produto.", "error");
  } finally {
    els.btnSalvar.disabled = false;
    els.btnSalvar.textContent = "✓ Cadastrar Produto";
  }
});
 
/* ---------- init ---------- */
 
checarConexao();
carregarListas();