# Docelar — Front-end base

Projeto base do sistema de estoque da padaria Docelar, feito somente com:

- HTML5
- CSS3
- JavaScript puro
- localStorage para simular persistência

## Como executar

1. Extraia a pasta.
2. Abra `index.html` no navegador.

Para uma experiência melhor, use o VS Code com a extensão Live Server.

## Telas implementadas

- Tela Principal
- Cadastro de Produto
- Entrada de Produtos
- Estoque
- Saída de Produtos
- Troca & Devolução
- Perfil
- Inventário de Recheios
- Inventário de Frios
- Relatórios Analíticos

## Navegação

As telas usam hash routing:

`#home`
`#products`
`#entry`
`#stock`
`#output`
`#returns`
`#profile`
`#recheios`
`#frios`
`#report`

## Como ligar ao backend depois

O arquivo `js/data.js` contém os dados mockados. Quando o backend estiver disponível, substitua as operações de `localStorage` por `fetch()`.

Exemplo:

```js
async function getProducts() {
  const response = await fetch("http://localhost:3000/api/produtos");
  if (!response.ok) throw new Error("Erro ao buscar produtos");
  return response.json();
}
```

Depois, as funções de cadastro, edição, exclusão, entrada e saída podem enviar:

- GET para listar
- POST para cadastrar
- PUT/PATCH para editar
- DELETE para excluir

## Estrutura

docelar-frontend/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── data.js
    └── app.js

O frontend é uma SPA simples para facilitar a integração futura com o backend.


### Menu
O menu lateral fica fechado por padrão. O botão ☰ no canto superior esquerdo abre a gaveta de navegação e um clique fora dela fecha o menu.
