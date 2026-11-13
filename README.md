# Snake Arena — Jogo da Cobrinha

Aplicativo web estático de jogo estilo **Snake**, construído com **HTML, CSS e JavaScript puro**, pronto para execução imediata no navegador, versionamento no GitHub e deploy na Vercel sem etapas de build complexas.

## Funcionalidades

- **5 níveis de dificuldade progressiva**:
  1. **Campo Aberto** (`0–49 pts`): Arena livre 20×20 e velocidade inicial.
  2. **Quatro Pilares** (`50–119 pts`): Pilares de pedra nos cantos internos e ritmo mais rápido.
  3. **Portais Centrais** (`120–209 pts`): Barreiras centrais que exigem curvas precisas.
  4. **Arena Compacta** (`210–319 pts`): Área jogável reduzida para 18×18 com corredores adicionais.
  5. **Núcleo Extremo** (`320+ pts`): Área mínima de 16×16 e velocidade máxima (com aceleração contínua após 320 pontos).
- **Frutas bônus douradas**: Aparecem ocasionalmente por tempo limitado valendo `+25` pontos.
- **Nome do jogador**: Campo antes do início da partida; se vazio, assume automaticamente `"Jogador"`.
- **Ranking Top 10 persistente**: Salvo no `localStorage` do navegador com nome, nível alcançado e pontuação em ordem decrescente.
- **Controles completos**:
  - **Teclado**: Setas ou `WASD` para mover, `P` para pausar/retomar, `Enter` ou `Espaço` para iniciar/reiniciar.
  - **Celular / Toque**: Botões direcionais na tela e gestos de deslize (*swipe*) no tabuleiro.

## Estrutura de Arquivos

- `index.html`: Estrutura da página, HUD, overlays e controles.
- `style.css`: Layout responsivo, paleta esmeralda/ardósia e animações sutis.
- `script.js`: Motor do jogo em Canvas HiDPI, progressão de fases, áudio sintetizado e ranking em `localStorage`.
- `README.md`: Documentação de uso local e publicação.

> **Nota sobre o crédito de criação:** O rodapé do `index.html` exibe `Criado por [NOME DO CRIADOR]`. Substitua `[NOME DO CRIADOR]` pelo seu nome antes de publicar.

---

## Como Executar Localmente

Por utilizar módulos ES (`<script type="module" src="./script.js"></script>`), execute o projeto por meio de um servidor HTTP local simples:

### Opção 1: VS Code Live Server
1. Abra a pasta do projeto no Visual Studio Code.
2. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

### Opção 2: Python (já instalado na maioria dos sistemas)
```bash
python3 -m http.server 8080
```
Depois acesse `http://localhost:8080` no navegador.

### Opção 3: Node.js (`npx serve`)
```bash
npx serve .
```

---

## Como Publicar no GitHub

1. Crie um repositório vazio no GitHub (sem inicializar com README, caso já tenha os arquivos locais).
2. No terminal, dentro da pasta do projeto, execute:

```bash
git init
git add index.html style.css script.js README.md
git commit -m "feat: adiciona jogo Snake Arena com 5 níveis e ranking"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

---

## Como Fazer Deploy na Vercel (Site Estático sem Build)

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **Add New... > Project**.
3. Selecione e importe o repositório do jogo no GitHub.
4. Na tela de configuração (**Configure Project**):
   - **Framework Preset**: `Other`
   - **Build and Output Settings**:
     - **Build Command**: deixe em branco (desativado)
     - **Output Directory**: `.` (ou deixe o padrão raiz)
     - **Install Command**: deixe em branco (desativado)
5. Clique em **Deploy**.

Em poucos segundos, a Vercel publicará o site estático e fornecerá a URL pública do jogo.
