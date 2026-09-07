# Enquadro

Sistema simples para enquadrar fotos no tamanho do azulejo e imprimir em papel A4, sem perder qualidade.

Feito para o fluxo de quem imprime foto em azulejo: as imagens costumam chegar no formato story (9:16), e precisam entrar em medidas como 10×10 cm.

## O que faz

- Carrega a foto no navegador (nada sobe para um servidor)
- **Foto inteira**: a imagem entra completa no azulejo, sem cortar nada, e o espaço que sobra recebe fundo branco, preto ou desfoque da própria foto
- **Cortar**: quando o cliente prefere preencher o azulejo inteiro
- Tamanhos: 10×10, 15×15, 20×20, 10×15, 15×20 ou personalizado
- Mostra a foto no tamanho real dentro de uma folha A4
- Preenche a folha com quantos azulejos couberem
- Imprime ou baixa PDF em **300 DPI**
- Avisa se a foto original não tem resolução suficiente para o tamanho

O modo padrão é **foto inteira**. Uma story 9:16 num azulejo 10×10 aparece completa, com faixas laterais no fundo escolhido.

## Como usar

```bash
npm install
npm run dev
```

Abra o endereço local, carregue a foto, escolha o ajuste e o tamanho, e clique em **Imprimir A4** ou **Baixar PDF**.

Na impressão do navegador, use papel A4 e margem **nenhuma** / **0**.

## Qualidade

O enquadramento é feito na imagem original. A folha é montada em 300 DPI (2480 × 3508 px). O sistema não estica a foto além dos pixels que ela já tem: se a resolução ficar baixa para o tamanho, aparece um aviso.

No modo foto inteira a imagem nunca é ampliada além do que cabe, então a resolução efetiva é sempre maior que no modo cortar.

## Scripts

```bash
npm test
npm run build
npm run preview
```
