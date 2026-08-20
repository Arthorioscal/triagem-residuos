# Guia de entrega — passo a passo

O código está pronto, com typecheck e build passando. Falta o que depende de
vocês: treinar o modelo, gravar a evidência e publicar.

Tempo total estimado: **~1h30**, sendo 40 min só de coleta de amostras.

---

## ETAPA 0 — Confirmar que o ambiente roda (5 min)

Faça isso ANTES de treinar. Se algo estiver quebrado, é melhor descobrir agora.

```bash
cd ~/triagem-residuos
npm run dev
```

O Vite abre `http://localhost:5173`. O navegador vai pedir a câmera — **aceite**.
Você verá o erro vermelho *"Não foi possível carregar o modelo"* no topo: está
correto, o modelo ainda não existe.

Agora abra **`http://localhost:5173/?demo=1`**. Com um modelo simulado, a
interface inteira funciona: lixeira abrindo, bipe, contador subindo. É assim que
deve ficar no final.

Pare o servidor com `Ctrl+C`.

---

## ETAPA 1 — Treinar o modelo (~40 min, os dois juntos)

### 1.1 Criar o projeto

<https://teachablemachine.withgoogle.com> → **Get Started** →
**Image Project** → **Standard image model**.

### 1.2 Criar as 4 classes com os nomes exatos

Clique no título "Class 1" para renomear. Use **Add a class** para as demais:

```
Reciclável
Orgânico
Rejeito
Nada
```

> Os acentos não são problema — o código normaliza os rótulos. Mas mantenha
> esses nomes; qualquer outro exige editar o mapa `ALIASES` em `src/config.ts`.

### 1.3 Coletar as amostras

Em cada classe: **Webcam** → segure **Hold to Record**. Uns 4–6 segundos de
gravação já geram ~100 imagens, que é o suficiente.

O que separa um modelo que funciona de um que não funciona é a **variação**.
Enquanto grava, mexa: gire o objeto, aproxime, afaste, incline. E colete em
mais de uma condição:

| Varie | Como |
| --- | --- |
| Objeto | 3–4 itens diferentes por classe, não só um |
| Ângulo | gire o item durante a gravação |
| Distância | perto da câmera e a um braço de distância |
| Fundo | grave metade na sua mesa, metade em outro lugar |
| Luz | metade com luz do dia, metade com a luz acesa |
| Pessoa | grave com as mãos dos dois integrantes |

Sugestão de itens:

- **Reciclável** — garrafa PET, lata de refrigerante, folha de papel, embalagem plástica
- **Orgânico** — casca de banana, resto de comida no prato, borra de café, casca de ovo
- **Rejeito** — papel higiênico, esponja de louça usada, isopor sujo, guardanapo usado
- **Nada** — cena vazia, só o fundo, sua mão sem nada, você passando na frente

> **A classe `Nada` é a mais importante e a que todo mundo faz mal.** Sem ela, o
> modelo é obrigado a escolher entre as três categorias úteis e vai disparar
> ações com a câmera vazia. Colete tanta amostra de `Nada` quanto das outras.

### 1.4 Treinar

**Train Model**. Não troque de aba durante o treino (o próprio Teachable
Machine avisa) — leva 1–3 min.

### 1.5 Testar ali mesmo

O painel **Preview** já classifica ao vivo. Mostre os objetos e veja se acerta.
Errando muito numa classe? Volte, colete mais amostras **dela** e treine de
novo. É normal precisar de 2–3 rodadas.

### 1.6 Exportar

**Export Model** → aba **Tensorflow.js** → seção **Download** →
**Download my model**. Baixa um `.zip`.

> Não use *Upload (shareable link)* como fonte principal: o enunciado pede o
> modelo versionado no repositório.

---

## ETAPA 2 — Instalar o modelo no projeto (2 min)

O zip cai em `~/Downloads`. Com o projeto em `~/triagem-residuos`:

```bash
cd ~/triagem-residuos
unzip -o ~/Downloads/converted_keras.zip -d /tmp/tm-modelo 2>/dev/null \
  || unzip -o ~/Downloads/*.zip -d /tmp/tm-modelo
cp /tmp/tm-modelo/model.json /tmp/tm-modelo/metadata.json /tmp/tm-modelo/weights.bin public/model/
ls -la public/model/
```

Tem que aparecer exatamente isto:

```
public/model/
├── metadata.json
├── model.json
├── README.md
└── weights.bin
```

Se faltar `weights.bin`, você exportou no formato errado (Keras ou TFLite em vez
de TensorFlow.js). Volte e escolha a aba **Tensorflow.js**.

---

## ETAPA 3 — Testar e calibrar (10 min)

```bash
npm run dev
```

Abra `http://localhost:5173` (**sem** `?demo=1` agora). Mostre um objeto e
observe:

1. As barras de **confiança por classe** reagindo.
2. O contador de **estabilidade** subindo (`n/8 quadros`).
3. Ao chegar em 8, a lixeira certa abre, o sistema fala e o contador do
   dashboard sobe.
4. Afaste o objeto — a etiqueta muda para *"aguardando cena vazia"* e depois
   volta para *"pronto"*.

Abra o console (`F12`) para ver as linhas `[acao] Reciclável -> Lixeira AZUL`.

### Se o comportamento estiver ruim

| Sintoma | O que fazer |
| --- | --- |
| Nunca dispara | baixe o slider de limiar para 70–75%. Se só assim funciona, o modelo está fraco: colete mais amostras |
| Dispara com a cena vazia | faltam amostras em `Nada`. Treine de novo com mais |
| Confunde duas classes | colete mais amostras **das duas**, em fundos diferentes |
| Demora demais para reagir | reduza `stableFrames` de `8` para `5` em `src/config.ts` |
| Conta o mesmo objeto 2× | aumente `cooldownMs` de `2000` para `3000` em `src/config.ts` |

Não tenha medo de ajustar `src/config.ts` — está tudo num só lugar e comentado.

---

## ETAPA 4 — Gravar o GIF da demonstração (10 min)

Essa é a única prova de que o projeto rodou. **Precisa deixar óbvio que
ninguém clicou em nada.**

Roteiro de ~12 segundos:
1. Comece com a câmera vazia (classe `Nada` ganhando).
2. Traga um **reciclável** — mostre a barra subindo e a lixeira azul abrindo.
3. Afaste, traga um **orgânico** — lixeira marrom.
4. Termine com o dashboard mostrando os contadores em 2 ou 3.

Mantenha a janela do navegador visível inteira: câmera, barras de confiança e
dashboard nas três colunas.

**Gravando no Ubuntu** (gravador nativo do GNOME):

```
Ctrl + Alt + Shift + R    → começa a gravar
Ctrl + Alt + Shift + R    → para
```

O arquivo `.webm` vai para `~/Vídeos/Capturas de tela/`. Converta para GIF:

```bash
cd ~/triagem-residuos
ffmpeg -i ~/Vídeos/Capturas\ de\ tela/*.webm \
  -vf "fps=10,scale=1000:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  -loop 0 docs/demo.gif
du -h docs/demo.gif   # mire abaixo de ~8 MB
```

Ficou grande? Troque `scale=1000` por `scale=800` e `fps=10` por `fps=8`.

Depois **descomente** no `README.md` a linha:

```markdown
![Demonstração](docs/demo.gif)
```

E tire uma foto estática também, se quiser: `docs/print.png`.

---

## ETAPA 5 — Preencher o README (5 min)

Abra `README.md` e ajuste as duas marcações `TODO`:

1. Linha **Dupla:** — nomes e RAs dos dois.
2. No comando `git clone`, troque `USUARIO` pelo seu usuário do GitHub
   (`Arthorioscal`).

Confira também se a tabela de classes bate com os objetos que vocês realmente
treinaram — se usaram itens diferentes dos que estão lá, atualize.

---

## ETAPA 6 — Publicar no GitHub com commits dos DOIS (15 min)

### 6.1 Confira a identidade do Git

O e-mail **precisa** estar cadastrado na sua conta do GitHub, senão o commit
aparece como autor desconhecido e não conta no histórico.

```bash
git config --global user.name    # Arthur Scortegagna
git config --global user.email   # arthurscortegagna@gmail.com
```

Verifique em <https://github.com/settings/emails> se esse e-mail está lá.
Se não estiver, adicione — ou aponte o repositório para o e-mail certo:

```bash
cd ~/triagem-residuos
git config user.email "o-email-cadastrado@exemplo.com"
```

### 6.2 Primeiro commit e criação do repositório

```bash
cd ~/triagem-residuos
git init -b main
git add .
git status              # confira: node_modules NÃO deve aparecer
git commit -m "feat: classificador de residuos com Teachable Machine e acao automatizada"
```

Com o `gh` (já autenticado como `Arthorioscal`):

```bash
gh repo create triagem-residuos --public --source=. --remote=origin --push
```

Ou pelo site: crie o repositório **público** `triagem-residuos`, **sem** README,
e então:

```bash
git remote add origin https://github.com/Arthorioscal/triagem-residuos.git
git push -u origin main
```

### 6.3 Garantir commits do outro integrante

O critério *"trabalho em dupla"* olha `git log`. Duas formas válidas:

**A) A outra pessoa comita da máquina dela** (melhor opção)

Ela roda:

```bash
git clone https://github.com/Arthorioscal/triagem-residuos.git
cd triagem-residuos
git config user.name "Nome Dela"
git config user.email "email-do-github-dela@exemplo.com"
# faz um ajuste real: revisa o README, muda um limiar, melhora um comentário
git add -A
git commit -m "docs: revisa instrucoes de execucao e ajusta limiar"
git push
```

Peça acesso de escrita para ela: **Settings → Collaborators → Add people**.

**B) Commit conjunto, na mesma máquina**

```bash
git commit -m "feat: calibra limiar de confianca apos os testes

Co-authored-by: Nome Dela <email-do-github-dela@exemplo.com>"
```

O GitHub mostra os dois como autores. Funciona, mas fica mais convincente se
houver commits separados de verdade.

**Sugestão de divisão**, se quiserem refazer o histórico com mais commits —
cada pessoa comitando a sua parte:

| Quem | Arquivos | Mensagem |
| --- | --- | --- |
| A | `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` | `chore: estrutura do projeto (Vite + TypeScript)` |
| B | `src/model/`, `public/model/` | `feat: carrega modelo do Teachable Machine e webcam` |
| A | `src/core/` | `feat: gatilho por estabilidade e acao automatizada` |
| B | `src/ui/`, `src/styles.css` | `feat: dashboard, barras de confianca e feedback sonoro` |
| A | `README.md`, `docs/` | `docs: instrucoes de execucao e demonstracao` |

Confira no fim:

```bash
git log --pretty='%an <%ae> — %s'
```

---

## ETAPA 7 — Conferência final antes de enviar o link

O professor vai clonar num diretório limpo. **Faça esse teste você primeiro:**

```bash
cd /tmp && rm -rf teste-clone
git clone https://github.com/Arthorioscal/triagem-residuos.git teste-clone
cd teste-clone
npm install
npm run dev
```

Se isso não abrir a aplicação funcionando, algo ficou de fora do repositório
(quase sempre o modelo).

Checklist:

- [ ] Repositório **público** (abra a URL numa janela anônima para confirmar)
- [ ] `public/model/` com `model.json`, `metadata.json` e `weights.bin` versionados
- [ ] `node_modules/` e `dist/` **fora** do repo
- [ ] Clone limpo → `npm install && npm run dev` funciona
- [ ] README com nomes da dupla, GIF visível e passo a passo
- [ ] `git log` com commits dos dois integrantes
- [ ] Link enviado no ambiente da disciplina

---

## Como cada critério da nota está coberto

| Critério | Pontos | Onde está |
| --- | --- | --- |
| Modelo classificando | 1,0 | `src/model/classifier.ts`; confiança de todas as classes na tela |
| Ação a partir da classificação | 1,5 | `src/core/actions.ts`, chamado só por `src/core/stabilizer.ts` — nenhum botão o invoca |
| Aplicação real e relevância | 1,0 | totem de apoio ao descarte: lixeiras CONAMA, instrução falada, dashboard de triagem |
| Publicação e execução local | 1,0 | ETAPA 6 e 7 |
| Organização e trabalho em dupla | 0,5 | separação modelo/lógica/UI + divisão de commits da ETAPA 6.3 |
