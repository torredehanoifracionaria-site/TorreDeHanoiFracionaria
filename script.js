function closeWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcomeScreen');
  welcomeScreen.style.opacity = '0';
  setTimeout(() => {
    welcomeScreen.style.display = 'none';
  }, 400); 
}

const infoData = {
  config: { title: "1. Configuração da Sala", text: "Defina as regras estruturais da sua aula: escolha o denominador fracionário (3, 6 ou 9), se a atividade será feita em Grupo ou por Aluno, e os limites de peças. A ferramenta travará opções impossíveis automaticamente. (Atenção: alterar dados aqui resetará o tabuleiro visual)." },
  prep: { title: "2. Preparação da Rodada", text: "Embaralhe as peças na mesa virtual para criar a 'bagunça' (desafio inicial) idêntica à que os alunos terão na mesa física. O sistema criará a meta de frações com base nisso." },
  gabarito: { 
    title: "Gabarito & Processo Cognitivo", 
    text: "A Inteligência Artificial calcula a solução mais curta matematicamente, mas como uma pessoa resolveria isso na prática?<br><br><strong>Pilares do Pensamento Computacional:</strong> O processo cognitivo humano para resolver a Torre mobiliza diretamente os quatro pilares:<br>• <strong>Decomposição:</strong> Dividir o problema maior em metas menores, organizando uma haste por vez.<br>• <strong>Reconhecimento de Padrões:</strong> Perceber que os ciclos lógicos de movimentação das peças (n-1) se repetem consecutivamente.<br>• <strong>Abstração:</strong> Focar na representação fracionária e nas regras estruturais, ignorando detalhes físicos que não interferem no jogo (como a cor exata sem contexto ou a textura do material).<br>• <strong>Algoritmo:</strong> A criação passo a passo, estruturada e sequencial da solução matemática que os alunos anotam no papel.<br><br><strong>Estruturas de Dados Relacionadas:</strong><br>• <strong>Pilha (LIFO - Last In, First Out):</strong> É a mecânica estrutural das hastes durante a jogabilidade. A peça que entra no topo (última a ser colocada) é obrigatoriamente a primeira peça que o aluno terá que retirar na próxima jogada.<br>• <strong>Fila (FIFO / Sequenciamento Ordenado):</strong> É observada conceitualmente no objetivo de organização imposto pelas marcações na frente das hastes (ex: a representação de 1/3, 2/3 e 3/3 dispostas em ordem crescente). Esse marcador dita a sequência linear de metas que precisam ser satisfeitas sucessivamente para construir o número inteiro." 
  },
  transcricao: { title: "3. Transcrição dos Algoritmos", text: "Insira as anotações feitas pelas crianças nas caixas de texto (Ex: AB BC CA). Clique diretamente no nome no cabeçalho do cartão para renomear com o nome real do grupo/aluno. NOTA: Só pode transcrever movimentos se a Preparação da Rodada estiver concluída!" },
  simulacao: { title: "4. Simulação Visual", text: "Aperte 'Play' para animar as torres e validar se o algoritmo anotado funciona perfeitamente de acordo com as regras estabelecidas." }
};

function openMaterialsModal() { document.getElementById('materialsModal').style.display = 'flex'; }
function closeMaterialsModal() { document.getElementById('materialsModal').style.display = 'none'; }

function showInfoModal(key) {
  document.getElementById('infoTitle').innerHTML = infoData[key].title;
  document.getElementById('infoText').innerHTML = infoData[key].text;
  document.getElementById('infoModal').style.display = 'flex';
}
function closeInfoModal() { document.getElementById('infoModal').style.display = 'none'; }

let confirmCallback = null;
function showConfirm(title, text, callback) {
  document.getElementById('confirmTitle').innerText = title;
  document.getElementById('confirmText').innerText = text;
  confirmCallback = callback;
  document.getElementById('confirmModal').style.display = 'flex';
}
function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
  confirmCallback = null;
}
document.getElementById('btnConfirmAction').onclick = () => {
  if (confirmCallback) confirmCallback();
  closeConfirm();
};

window.onclick = function(event) {
  const modalMat = document.getElementById('materialsModal');
  const modalInfo = document.getElementById('infoModal');
  const modalConf = document.getElementById('confirmModal');
  if (event.target == modalMat) closeMaterialsModal();
  if (event.target == modalInfo) closeInfoModal();
  if (event.target == modalConf) closeConfirm();
}

const workerLogic = `
  function getSettledCounts(state) {
    let settled = [0, 0, 0];
    for(let p=0; p<3; p++) {
      for(let i=0; i<state[p].length; i++) {
        if(state[p][i] === p) settled[p]++;
        else break;
      }
    }
    return settled;
  }

  function findPathToNextPerfectMove(startState, settled) {
    let queue = [{ state: startState, path: [] }];
    let visited = new Set();
    visited.add(startState.map(t => t.join('')).join('|'));
    let head = 0;

    while (head < queue.length) {
      if (head > 15000) {
        let bestFrom = -1;
        let maxUnset = -1;
        for (let i=0; i<3; i++) {
          let unset = startState[i].length - settled[i];
          if (unset > maxUnset) { maxUnset = unset; bestFrom = i; }
        }
        if (bestFrom !== -1 && startState[bestFrom].length > 0) {
          let color = startState[bestFrom][startState[bestFrom].length - 1];
          let to = (bestFrom + 1) % 3;
          if (to === color || (startState[to].length > 0 && startState[to][startState[to].length - 1] === color)) {
             to = (bestFrom + 2) % 3;
          }
          return [{from: bestFrom, to, color}];
        }
      }

      let curr = queue[head++];
      let currSettled = getSettledCounts(curr.state);

      for (let from = 0; from < 3; from++) {
        if (curr.state[from].length === currSettled[from]) continue;
        let color = curr.state[from][curr.state[from].length - 1];

        for (let to = 0; to < 3; to++) {
          if (from === to) continue;
          if (curr.path.length > 0) {
            let last = curr.path[curr.path.length - 1];
            if (last.from === to && last.to === from) continue; 
          }

          if (to === color && curr.state[to].length === currSettled[to]) {
            return [...curr.path, {from, to, color}];
          }

          let newState = [curr.state[0].slice(), curr.state[1].slice(), curr.state[2].slice()];
          newState[from].pop();
          newState[to].push(color);
          
          let stateStr = newState.map(t => t.join('')).join('|');
          if (!visited.has(stateStr)) {
            visited.add(stateStr);
            queue.push({ state: newState, path: [...curr.path, {from, to, color}] });
          }
        }
      }
    }
    return [];
  }

  self.onmessage = function(e) {
    const { towers, targetStateStr } = e.data;
    let masterPath = [];
    let currState = [towers[0].slice(), towers[1].slice(), towers[2].slice()];
    let iter = 0;

    while (true) {
      iter++;
      if (iter > 800) {
        self.postMessage({ status: 'error', data: "Alivie a mistura das peças." });
        return;
      }
      
      if (iter % 15 === 0) {
        self.postMessage({ status: 'progress', data: \`Resolvendo rodada avançada... (\${masterPath.length} passos mapeados)\` });
      }

      let stateStr = currState.map(t => t.join('')).join('|');
      if (stateStr === targetStateStr) {
        self.postMessage({ status: 'success', data: masterPath });
        return;
      }

      let settled = getSettledCounts(currState);
      
      let perfectMove = null;
      for (let from = 0; from < 3; from++) {
        if (currState[from].length === settled[from]) continue;
        let color = currState[from][currState[from].length - 1];
        if (currState[color].length === settled[color]) {
          perfectMove = { from, to: color, color };
          break;
        }
      }

      if (perfectMove) {
        currState[perfectMove.from].pop();
        currState[perfectMove.to].push(perfectMove.color);
        masterPath.push(perfectMove);
        continue; 
      }

      let bfsPath = findPathToNextPerfectMove(currState, settled);
      if (!bfsPath || bfsPath.length === 0) {
        self.postMessage({ status: 'error', data: "Erro de bloqueio estrutural interno." });
        return;
      }
      
      for (let move of bfsPath) {
        currState[move.from].pop();
        currState[move.to].push(move.color);
        masterPath.push(move);
      }
    }
  };
`;

const H_COLORS = ['#4361ee', '#06d6a0', '#ffd166']; 
const H_NAMES = ['A', 'B', 'C'];
const D_COLORS = ['#4361ee', '#06d6a0', '#ffd166']; 
const TEXT_COLORS = ['#4361ee', '#06d6a0', '#d4a300']; 

let state = {
  inteiro: 9,
  modo: 'grupo',
  numTorres: 3, 
  numAlunos: 1,
  numEntities: 3, 
  discosPorMarca: 4, 
  groupNames: ['Grupo 1', 'Grupo 2', 'Grupo 3'],
  currentRound: 1,
  initialTowers: {},
  moves: {}
};

let isAnimating = false;
let simTowers = []; 
let windowGabaritoPath = [];
let isGabaritoAnimating = false;
let gabaritoSimTowers = [];
let currentAnimId = 0;
let solverWorker = null; 
let workerUrl = null; 

function getTargetsForRound(r) {
  let targets = [0, 0, 0];
  for(let p=0; p<3; p++) {
    let targetNum = (r - 1) * 3 + (p + 1);
    if (targetNum > state.inteiro) targetNum = state.inteiro;
    targets[p] = targetNum * state.discosPorMarca;
  }
  return targets;
}

function isPreparationComplete() {
  if (!state.initialTowers[state.currentRound]) return false;
  const r = state.currentRound;
  const towers = state.initialTowers[r];
  const targets = getTargetsForRound(r);
  
  let currentCounts = [0, 0, 0];
  towers.forEach(t => t.forEach(d => currentCounts[d]++));
  
  return currentCounts[0] === targets[0] &&
         currentCounts[1] === targets[1] &&
         currentCounts[2] === targets[2];
}

function updateGlobal() {
  let i = parseInt(document.getElementById('inteiro').value) || 9;
  if(![3, 6, 9].includes(i)) { i = 9; document.getElementById('inteiro').value = '9'; }
  state.inteiro = i;
  
  const modoSel = document.getElementById('modoAplicacao');
  if (i === 9) {
    modoSel.value = 'grupo';
    modoSel.disabled = true;
  } else {
    modoSel.disabled = false;
  }
  
  let currentModo = modoSel.value;
  let modoChanged = (state.modo !== currentModo);
  state.modo = currentModo;
  
  const boxAlunos = document.getElementById('boxAlunos');
  if (state.modo === 'aluno') boxAlunos.style.display = 'block';
  else boxAlunos.style.display = 'none';

  document.getElementById('lblPlayBtn').innerText = state.modo === 'aluno' ? 'Reproduzir Soluções dos Alunos' : 'Reproduzir Soluções dos Grupos';
  
  const numTorresInput = document.getElementById('numTorres');
  let minT = 1;
  let maxT = 3;

  if (state.modo === 'aluno') {
    if (i === 3) maxT = 2;
    else if (i === 6) maxT = 3;
  } else {
    maxT = 3;
  }
  
  numTorresInput.min = minT;
  numTorresInput.max = maxT;

  let t = parseInt(numTorresInput.value) || minT;
  if(t < minT) { t = minT; numTorresInput.value = minT; showToast(`Mínimo de ${minT} torres físicas!`); }
  if(t > maxT) { t = maxT; numTorresInput.value = maxT; showToast(`Máximo de ${maxT} torres para esta configuração!`); }
  state.numTorres = t;
  
  let a = parseInt(document.getElementById('numAlunos').value) || 1;
  if(a < 1) { a = 1; document.getElementById('numAlunos').value = 1; }
  if(a > 50) { a = 50; document.getElementById('numAlunos').value = 50; }
  state.numAlunos = a;

  let d = parseInt(document.getElementById('discosPorMarca').value) || 4;
  if(d < 1) { d = 1; document.getElementById('discosPorMarca').value = 1; }
  if(d > 4) { d = 4; document.getElementById('discosPorMarca').value = 4; showToast('Máximo de 4 discos por fatia!'); }
  state.discosPorMarca = d;

  const gabaritoPanel = document.getElementById('gabaritoPanel');
  if (state.discosPorMarca === 1) {
    gabaritoPanel.style.display = 'block';
  } else {
    gabaritoPanel.style.display = 'none';
    cancelGabarito(true);
  }
  
  let entities = state.modo === 'aluno' ? state.numAlunos : state.numTorres;
  let prefix = state.modo === 'aluno' ? 'Aluno' : 'Grupo';
  
  if (entities !== state.numEntities || modoChanged) {
    state.numEntities = entities;
    if (modoChanged) state.groupNames = []; 
    while(state.groupNames.length < entities) state.groupNames.push(`${prefix} ${state.groupNames.length + 1}`);
    while(state.groupNames.length > entities) state.groupNames.pop();
  }
  
  currentAnimId++; 
  isAnimating = false;
  isGabaritoAnimating = false;
  
  state.initialTowers = {};
  state.moves = {};
  state.currentRound = 1;
  
  initRoundData(state.currentRound);
  
  simTowers = [];
  renderMaterialsList(); 
  renderAll();
}

function updateGroupName(index, inputEl) {
  let prefix = state.modo === 'aluno' ? 'Aluno' : 'Grupo';
  let val = inputEl.value.trim();
  
  if (!val) {
    val = `${prefix} ${index+1}`;
    inputEl.value = val;
  }
  
  state.groupNames[index] = val;
  renderVisual(); 
}

function renderMaterialsList() {
  const totalRounds = Math.ceil(state.inteiro / 3);
  let maxA = Math.min((totalRounds - 1) * 3 + 1, state.inteiro);
  let maxB = Math.min((totalRounds - 1) * 3 + 2, state.inteiro);
  let maxC = Math.min((totalRounds - 1) * 3 + 3, state.inteiro);

  let multiplier = state.numTorres; 

  let totalAzuis = maxA * state.discosPorMarca * multiplier;
  let totalVerdes = maxB * state.discosPorMarca * multiplier;
  let totalAmarelos = maxC * state.discosPorMarca * multiplier;

  let hasteAdicional = state.discosPorMarca > 1
    ? "<br><br><span style='color: #e63946; font-weight: bold;'>Atenção:</span> A haste foi dividida de acordo com o denominador, utilizando a fita adesiva na cor vermelha."
    : "";

  let pdfSection = "";
  if (state.discosPorMarca === 1) {
    let tipoCopias = state.modo === 'aluno' ? 'alunos' : 'grupos';
    pdfSection = `
      <div style="margin-top: 24px; padding: 20px; background: #fff3cd; border: 2px dashed #ffc107; border-radius: 12px; text-align: center;">
        <h4 style="color: #856404; margin-top: 0; margin-bottom: 12px; font-size: 1.1rem;">Documento do Algoritmo</h4>
        <p style="font-size: 0.95rem; color: #664d03; margin-bottom: 16px;">
          Imprima e leve para a sala o documento de anotações. Você precisará de <strong>${state.numEntities} cópias</strong> (uma para cada ${state.modo === 'aluno' ? 'aluno' : 'grupo'}).
        </p>
        <a href="Documento do Algoritmo.jpg" download="Documento do Algoritmo.jpg" class="btn btn-primary" style="background: #ffc107; color: #000; font-weight: 900; border: none;">
          Baixar Arquivo
        </a>
      </div>
    `;
  }

  let fracoesArray = [];
  for(let i = 1; i <= state.inteiro; i++) {
    fracoesArray.push(`${i}/${state.inteiro}`);
  }
  let fracoesExemplo = fracoesArray.join(", ");

  document.getElementById('materialsPanel').innerHTML = `
    <h3 style="margin-bottom: 20px; color: var(--primary); text-align: center; font-size: 1.3rem;">Guia de Construção</h3>

    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <div class="mat-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.8rem;">🏗️</span>
          <div>
            <strong style="font-size: 1.1rem; color: var(--text);">1° Bases</strong><br>
            <span style="color:var(--primary); font-size:0.95rem; font-weight: 800;">Quantidade: ${multiplier} unidades</span>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary); margin-top: 8px;">
          <strong>Como construir:</strong> Corte papelão na medida de 30cm x 12cm, cole 3 unidades para formar uma base. Revista com EVA de uma cor diferente.
        </div>
      </div>

      <div class="mat-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.8rem;">🥢</span>
          <div>
            <strong style="font-size: 1.1rem; color: var(--text);">2° Hastes</strong><br>
            <span style="color:var(--muted); font-size:0.95rem; font-weight: 800;">${multiplier} Azuis, ${multiplier} Verdes, ${multiplier} Amarelas</span>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid var(--muted); margin-top: 8px;">
          <strong>Como construir:</strong> Una 3 palitos de churrasco de 22cm, com fita crepe para formar uma haste.${hasteAdicional}
        </div>
      </div>

      <div class="mat-item">
        <strong style="font-size: 1.1rem; color: var(--text); margin-bottom: 8px;">3° Discos</strong>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px; align-items: center; background: #e8edff; padding: 6px 12px; border-radius: 20px;">
            <span style="font-size: 1.2rem; color:${H_COLORS[0]}">🔵</span>
            <span style="color:${H_COLORS[0]}; font-weight:800;">${totalAzuis} Azuis</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; background: #e6f9f4; padding: 6px 12px; border-radius: 20px;">
            <span style="font-size: 1.2rem; color:${H_COLORS[1]}">🟢</span>
            <span style="color:${H_COLORS[1]}; font-weight:800;">${totalVerdes} Verdes</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; background: #fff8e6; padding: 6px 12px; border-radius: 20px;">
            <span style="font-size: 1.2rem; color:${H_COLORS[2]}">🟡</span>
            <span style="color:${TEXT_COLORS[2]}; font-weight:800;">${totalAmarelos} Amarelos</span>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #f72585; margin-top: 12px;">
          <strong>Como construir:</strong> Corte os papelões com o diâmetro de 7,5cm e circunferência de 23.55 cm, considerando o valor de π (Pi) sendo 3,14.<br><br>
          <span style="color: #666; font-size: 0.9rem;"><strong>Obs:</strong> Caso a espessura não seja a ideal, cole duas unidades para formar um disco.</span>
        </div>
      </div>

      <div class="mat-item">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 1.8rem;">🏷️</span>
          <strong style="font-size: 1.1rem; color: var(--text);">4° Fração</strong>
        </div>
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #7209b7; margin-top: 8px;">
          <strong>Como construir:</strong> Cole um pedaço de velcro na frente de cada haste, com um pedaço de EVA (com velcro) escreva as representações das frações com o denominador escolhido <strong>(Ex: ${fracoesExemplo})</strong>, escolha uma cor diferente do EVA da base.
        </div>
      </div>

    </div>

    <div style="margin-top: 24px; padding: 16px; background: #fff; border: 1px solid var(--border); border-radius: 12px;">
      <h4 style="color: var(--primary); margin-top: 0; margin-bottom: 12px; font-size: 1.05rem;">Materiais utilizados na construção:</h4>
      <p style="font-size: 0.95rem; color: var(--text); line-height: 1.6; margin: 0;">
        Papelão; Palitos de churrasco; Cola; Fita crepe; Tinta guache: amarelo, verde e azul; Pincéis; Tesouras; Fita adesiva: azul, verde, amarelo e vermelho; Velcro; Estilete; EVA.
      </p>
    </div>

    ${pdfSection}

  `;
}

function initRoundData(r) {
  if(!state.initialTowers[r]) state.initialTowers[r] = [[], [], []];
  if(!state.moves[r]) {
    state.moves[r] = {};
    for(let g=0; g<50; g++) state.moves[r][g] = [];
  }
}

function changeRound(r) {
  if(isAnimating || isGabaritoAnimating) return;
  cancelGabarito(true);
  state.currentRound = r;
  initRoundData(r);
  
  simTowers = [];
  renderAll();
}

function renderRounds() {
  const cont = document.getElementById('roundTabs');
  cont.innerHTML = '';
  const totalRounds = Math.ceil(state.inteiro / 3); 
  for(let r=1; r<=totalRounds; r++) {
    const btn = document.createElement('button');
    btn.className = 'tab' + (r === state.currentRound ? ' active' : '');
    btn.textContent = `Rodada ${r}`;
    btn.onclick = () => changeRound(r);
    cont.appendChild(btn);
  }
}

function renderInitBuilder() {
  const r = state.currentRound;
  const towers = state.initialTowers[r];
  const targets = getTargetsForRound(r);

  document.getElementById('lblReqTitle').innerText = `Peças necessárias para organizar a Rodada ${r}:`;

  let currentCounts = [0, 0, 0];
  towers.forEach(t => t.forEach(d => currentCounts[d]++));

  const reqHtml = `
    <span style="color:${TEXT_COLORS[0]}">Azuis: ${currentCounts[0]} / ${targets[0]}</span>
    <span style="color:${TEXT_COLORS[1]}">Verdes: ${currentCounts[1]} / ${targets[1]}</span>
    <span style="color:${TEXT_COLORS[2]}">Amarelos: ${currentCounts[2]} / ${targets[2]}</span>
  `;
  document.getElementById('reqCounts').innerHTML = reqHtml;

  const cont = document.getElementById('initBuilder');
  cont.innerHTML = '';
  const diskHeightPct = 100 / (state.inteiro * state.discosPorMarca);

  for(let p=0; p<3; p++) {
    const col = document.createElement('div');
    col.className = 'tower-col';
    col.style.background = '#fff';
    col.style.padding = '20px';
    col.style.borderRadius = '16px';
    col.style.border = '2px solid var(--border)';
    col.style.maxWidth = '250px';
    col.style.width = '100%';
    
    let marksHtml = '';
    if(state.discosPorMarca > 1) {
      for(let i=0; i<state.inteiro; i++) marksHtml += `<div class="pole-mark"></div>`;
    }

    let disksHtml = towers[p].map(colorIdx => 
      `<div class="v-disk" style="background:${D_COLORS[colorIdx]}; height:${diskHeightPct}%;"></div>`
    ).join('');

    col.innerHTML = `
      <div class="tower-name" style="color:${H_COLORS[p]}; text-align:center; font-size:1.1rem; margin-bottom:12px;">Haste ${H_NAMES[p]}</div>
      <div class="tower-base" style="height: 180px;">
        <div class="tower-pole-bg" style="border: 2px solid ${H_COLORS[p]}; border-bottom: none;">
          ${marksHtml}
        </div>
        <div class="tower-disks">${disksHtml}</div>
      </div>
      <div class="disk-btn-group" style="display:flex; justify-content:center; gap: 8px; margin-top: 18px;">
        <button class="d-btn" style="background:${D_COLORS[0]}" onclick="addInitDisk(${p}, 0)">+</button>
        <button class="d-btn" style="background:${D_COLORS[1]}" onclick="addInitDisk(${p}, 1)">+</button>
        <button class="d-btn" style="background:${D_COLORS[2]}" onclick="addInitDisk(${p}, 2)">+</button>
      </div>
      <div style="text-align:center; margin-top: 12px;">
        <button class="btn btn-outline" style="padding:6px 12px; font-size:.8rem; border-color:#ffccd5; color:var(--accent);" onclick="removeInitDisk(${p})">✖ Remover Disco do Topo</button>
      </div>
    `;
    cont.appendChild(col);
  }
}

function clearInitBuilder() {
  if(isAnimating || isGabaritoAnimating) return;
  showConfirm(
    "Esvaziar Mesa",
    `Tem certeza que deseja remover todas as peças da mesa na Rodada ${state.currentRound}?`,
    () => {
      cancelGabarito(true);
      state.initialTowers[state.currentRound] = [[], [], []];
      simTowers = [];
      renderAll();
      showToast("Mesa limpa!");
    }
  );
}

function addInitDisk(pole, colorIdx) {
  if(isAnimating || isGabaritoAnimating) return;
  cancelGabarito(true);
  const r = state.currentRound;
  const targets = getTargetsForRound(r);
  
  let currentCounts = [0, 0, 0];
  state.initialTowers[r].forEach(t => t.forEach(d => currentCounts[d]++));

  if (currentCounts[colorIdx] >= targets[colorIdx]) {
    const colorName = colorIdx === 0 ? "Azuis" : colorIdx === 1 ? "Verdes" : "Amarelos";
    showToast(`⚠️ Limite de peças ${colorName} exigido atingido!`);
    return;
  }

  state.initialTowers[r][pole].push(colorIdx);
  simTowers = [];
  renderAll();
}

function removeInitDisk(pole) {
  if(isAnimating || isGabaritoAnimating) return;
  if(state.initialTowers[state.currentRound][pole].length === 0) return;
  cancelGabarito(true);
  state.initialTowers[state.currentRound][pole].pop();
  simTowers = [];
  renderAll();
}

function calculateAndShowGabarito() {
  const r = state.currentRound;
  const towers = state.initialTowers[r];
  const targets = getTargetsForRound(r);
  
  let currentCounts = [0, 0, 0];
  towers.forEach(t => t.forEach(d => currentCounts[d]++));
  
  if (currentCounts[0] !== targets[0] || currentCounts[1] !== targets[1] || currentCounts[2] !== targets[2]) {
      document.getElementById('gabaritoResult').innerHTML = "<span style='color:red; font-weight: 800; font-size: 1.1rem;'>⚠️ Adicione todas as peças da rodada para poder calcular!</span>";
      return;
  }

  const targetStateStr = [
      '0'.repeat(targets[0]),
      '1'.repeat(targets[1]),
      '2'.repeat(targets[2])
  ].join('|');

  let initialStateStr = towers.map(t => t.join('')).join('|');
  if (initialStateStr === targetStateStr) {
      document.getElementById('gabaritoResult').innerHTML = "<span style='color:var(--green); font-weight:900;'>✅ A torre já está na posição correta (0 movimentos).</span>";
      return;
  }

  document.getElementById('btnCalcGabarito').style.display = 'none';
  document.getElementById('gabaritoResult').innerHTML = `
      <div style="display:flex; align-items:center; gap: 12px; margin-bottom:12px;">
        <span style='color:var(--muted); font-weight:800;' id="solverStatusText">⏳ Inicializando IA (Isto não vai travar o navegador)...</span>
        <button class="btn btn-outline" style="padding:4px 10px; font-size:.8rem; border-color:#ff4d4d; color:#ff4d4d;" onclick="cancelGabarito(true)">✖ Cancelar</button>
      </div>
  `;

  cancelGabarito(); 
  const blob = new Blob([workerLogic], { type: 'application/javascript' });
  workerUrl = URL.createObjectURL(blob);
  solverWorker = new Worker(workerUrl);

  solverWorker.onmessage = function(e) {
      const { status, data } = e.data;
      if (status === 'progress') {
          const statusText = document.getElementById('solverStatusText');
          if (statusText) statusText.innerText = data;
      } else if (status === 'success') {
          renderGabaritoSuccess(data);
          cancelGabarito(false); 
      } else if (status === 'error') {
          document.getElementById('gabaritoResult').innerHTML = `<span style='color:red; font-weight:900;'>⚠️ ${data}</span>`;
          cancelGabarito(false);
      }
  };

  solverWorker.postMessage({ towers, targetStateStr });
}

function cancelGabarito(isUserAction = false) {
  if (solverWorker) {
      solverWorker.terminate();
      solverWorker = null;
  }
  if (workerUrl) {
      URL.revokeObjectURL(workerUrl);
      workerUrl = null;
  }
  const btnGab = document.getElementById('btnCalcGabarito');
  if(btnGab) btnGab.style.display = 'inline-flex';
  
  if (isUserAction) {
      const resDiv = document.getElementById('gabaritoResult');
      if (resDiv) resDiv.innerHTML = '';
      
      const gabBox = document.getElementById('gabaritoPlayerBox');
      if (gabBox) gabBox.style.display = 'none';
  }
}

function renderGabaritoSuccess(resultPath) {
  windowGabaritoPath = resultPath; 

  let textPath = resultPath.map(m => H_NAMES[m.from] + H_NAMES[m.to]).join(' ');
  
  let visualHtml = resultPath.map((m, i) => `
    <div class="move-item" style="display:inline-flex; align-items:center; background:#fff; border:1px solid var(--border); padding:6px 12px; margin:4px; border-radius:8px;">
      <span style="background:var(--primary); color:#fff; border-radius:50%; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:900; margin-right:8px">${i+1}</span>
      <div style="width: 14px; height: 14px; background: ${D_COLORS[m.color]}; border: 1.5px solid rgba(0,0,0,0.2); border-radius: 3px; margin-right: 8px;"></div>
      <strong style="color:${H_COLORS[m.from]}">${H_NAMES[m.from]}</strong> 
      <span style="margin: 0 6px; color:#888;">➔</span> 
      <strong style="color:${H_COLORS[m.to]}">${H_NAMES[m.to]}</strong>
    </div>
  `).join('');

  document.getElementById('gabaritoResult').innerHTML = `
    <div style="margin-bottom: 12px; font-size: 1rem; color: var(--text);">
      A solução encontrada pela IA exige <strong>${resultPath.length}</strong> movimentos:
    </div>
    <div style="font-family: 'Courier New', monospace; font-size: 1.25rem; font-weight: 900; letter-spacing: 2px; background: var(--card); padding: 12px 16px; border-radius: 8px; border: 2px dashed #b5c4ff; margin-bottom: 16px; color: var(--primary); text-align: center;">
      ${textPath}
    </div>
    <div style="display: flex; flex-wrap: wrap; background: var(--primary-light); padding: 12px; border-radius: 12px; margin-bottom: 16px;">
      ${visualHtml}
    </div>
    <button class="btn btn-success" id="btnPlayGabarito" onclick="playGabaritoAnimation()" style="font-size: 1.1rem; padding: 10px 20px;">▶️ Assistir à Simulação do Gabarito</button>
    <div id="gabaritoPlayerBox" style="display:none; margin-top: 16px; padding: 16px; border: 2px solid var(--green); border-radius: 12px; background: var(--bg);">
      <h4 style="text-align:center; color: var(--green); margin-bottom: 10px;">Simulação do Algoritmo Perfeito</h4>
      <div class="towers-wrap" id="gabaritoStageView"></div>
    </div>
  `;
}

function renderGabaritoStageView() {
  const r = state.currentRound;
  const cont = document.getElementById('gabaritoStageView');
  cont.innerHTML = '';
  const diskHeightPct = 100 / (state.inteiro * state.discosPorMarca);

  for(let p=0; p<3; p++) {
    let marksHtml = '';
    if(state.discosPorMarca > 1) {
      for(let i=0; i<state.inteiro; i++) marksHtml += `<div class="pole-mark"></div>`;
    }

    let targetNum = (r - 1) * 3 + (p + 1);
    if (targetNum > state.inteiro) targetNum = state.inteiro; 
    const targetFraction = `${targetNum}/${state.inteiro}`;

    let disksHtml = gabaritoSimTowers[p].map(colorIdx => 
      `<div class="v-disk" style="background:${D_COLORS[colorIdx]}; height:${diskHeightPct}%;"></div>`
    ).join('');

    cont.innerHTML += `
      <div class="tower-col" style="max-width: 250px;">
        <div class="tower-name" style="color:${H_COLORS[p]}">Haste ${H_NAMES[p]}</div>
        <div class="tower-base" style="height: 180px;">
          <div class="tower-pole-bg" style="border: 2px solid ${H_COLORS[p]}; border-bottom: none;">${marksHtml}</div>
          <div class="tower-disks">${disksHtml}</div>
        </div>
        <div class="tower-target" style="color:${H_COLORS[p]}; border-color:${H_COLORS[p]}44;">${targetFraction}</div>
      </div>
    `;
  }
}

async function playGabaritoAnimation() {
  if(isGabaritoAnimating || isAnimating) return;
  isGabaritoAnimating = true;
  let myAnimId = ++currentAnimId;

  const btn = document.getElementById('btnPlayGabarito');
  const box = document.getElementById('gabaritoPlayerBox');
  btn.textContent = "⏳ Simulação em Andamento...";
  btn.style.background = "#ccc";
  box.style.display = "block";

  const r = state.currentRound;
  gabaritoSimTowers = JSON.parse(JSON.stringify(state.initialTowers[r]));
  renderGabaritoStageView();

  await new Promise(res => setTimeout(res, 800));
  if (myAnimId !== currentAnimId) return;

  for(let step=0; step < windowGabaritoPath.length; step++) {
    const move = windowGabaritoPath[step];
    const diskColorIdx = gabaritoSimTowers[move.from].pop();
    gabaritoSimTowers[move.to].push(diskColorIdx);

    renderGabaritoStageView(); 
    await new Promise(res => setTimeout(res, 800)); 
    if (myAnimId !== currentAnimId) return;
  }

  if (myAnimId === currentAnimId) {
    isGabaritoAnimating = false;
    btn.textContent = "▶️ Assistir à Simulação do Gabarito";
    btn.style.background = "#06d6a0";
  }
}

function addBulkMoves(g) {
  if(isAnimating || isGabaritoAnimating) return;
  
  if (!isPreparationComplete()) {
    showToast("⚠️ Adicione todas as peças na 'Preparação da Rodada' antes de transcrever!");
    return;
  }

  const textarea = document.getElementById(`bulk_${g}`);
  const txt = textarea.value.toUpperCase();
  
  const clean = txt.replace(/[^A-C]/g, '');
  let added = 0;
  for(let i=0; i < clean.length - 1; i+=2) {
    const from = clean[i].charCodeAt(0) - 65;
    const to = clean[i+1].charCodeAt(0) - 65;
    if(from !== to) {
      if (!state.moves[state.currentRound][g]) state.moves[state.currentRound][g] = [];
      state.moves[state.currentRound][g].push({from, to});
      added++;
    }
  }
  
  if (added > 0) {
    textarea.value = '';
    showToast(`${added} movimentos registrados!`);
    renderLogger();
  }
}

function clearGroupMoves(g) {
  if(isAnimating || isGabaritoAnimating) return;
  showConfirm(
    "Limpar Algoritmo",
    `Tem certeza que deseja apagar TODOS os movimentos de ${state.groupNames[g]} na Rodada ${state.currentRound}?`,
    () => {
      state.moves[state.currentRound][g] = [];
      renderLogger();
      showToast('Movimentos apagados!');
    }
  );
}

function renderLogger() {
  const r = state.currentRound;
  const cont = document.getElementById('logGrid');
  cont.innerHTML = '';
  
  const prepReady = isPreparationComplete();
  const disabledHTML = prepReady ? "" : "disabled";
  const placeholder = prepReady ? "Ex: AB, BC, CA..." : "Conclua a Preparação da Rodada";
  const opacityStyle = prepReady ? "" : "opacity: 0.6; cursor: not-allowed;";

  for(let g=0; g<state.numEntities; g++) {
    if(!state.moves[r][g]) state.moves[r][g] = [];
    const moves = state.moves[r][g];
    
    const card = document.createElement('div');
    card.className = 'log-card';
    card.innerHTML = `
      <div class="log-header">
        <input type="text" value="${state.groupNames[g]}" onchange="updateGroupName(${g}, this)" style="font-family:'Nunito', sans-serif; border:none; border-bottom:2px dashed var(--border); background:transparent; font-size:1.1rem; font-weight:900; color:var(--text); width:160px; outline:none; padding:2px 4px;" title="Clique para editar o nome">
        <span style="margin-left:auto; font-size:.8rem; color:#888">${moves.length} mov.</span>
      </div>
      
      <div class="bulk-entry">
        <textarea id="bulk_${g}" rows="2" placeholder="${placeholder}" ${disabledHTML}></textarea>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-success" style="flex:1; font-size:.85rem; ${opacityStyle}" onclick="addBulkMoves(${g})" ${disabledHTML}>➕ Inserir</button>
          <button class="btn btn-outline" style="font-size:.85rem; padding: 8px 12px; color: #ff4d4d; border-color: #ff4d4d; ${opacityStyle}" onclick="clearGroupMoves(${g})" title="Limpar todos os movimentos desta equipe/aluno nesta rodada" ${disabledHTML}>🗑️ Limpar</button>
        </div>
      </div>

      <div class="move-list">
        ${moves.length === 0 ? '<span style="color:#aaa; font-size:.8rem; text-align:center;">Nenhum movimento anotado.</span>' : ''}
        ${moves.map((m, i) => `
          <div class="move-item">
            <span style="background:var(--primary); color:#fff; border-radius:50%; width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:.7rem;">${i+1}</span>
            <strong style="color:${H_COLORS[m.from]}">Haste ${H_NAMES[m.from]}</strong> 
            ➔ 
            <strong style="color:${H_COLORS[m.to]}">Haste ${H_NAMES[m.to]}</strong>
            <button class="move-del" onclick="delMove(${g}, ${i})">✖</button>
          </div>
        `).join('')}
      </div>
    `;
    cont.appendChild(card);
  }
}

function delMove(g, i) {
  if(isAnimating || isGabaritoAnimating) return;
  state.moves[state.currentRound][g].splice(i, 1);
  renderLogger();
}

function resetAnimation() {
  currentAnimId++; 
  isAnimating = false;
  isGabaritoAnimating = false;
  
  const btn = document.getElementById('btnPlay');
  if(btn) {
    btn.innerHTML = `▶️ <span id="lblPlayBtn">${state.modo === 'aluno' ? 'Reproduzir Soluções dos Alunos' : 'Reproduzir Soluções dos Grupos'}</span>`;
    btn.style.background = "var(--primary)";
  }
  
  const btnGab = document.getElementById('btnPlayGabarito');
  if(btnGab) {
    if (btnGab.style.background === "rgb(204, 204, 204)" || btnGab.style.background === "#ccc") {
        btnGab.textContent = "▶️ Assistir à Simulação do Gabarito";
        btnGab.style.background = "#06d6a0";
    }
  }

  const r = state.currentRound;
  simTowers = [];
  if (state.initialTowers[r]) {
    for(let g=0; g<state.numEntities; g++) {
      simTowers[g] = JSON.parse(JSON.stringify(state.initialTowers[r]));
    }
  }
  renderVisual();

  if (state.initialTowers[r] && document.getElementById('gabaritoPlayerBox') && document.getElementById('gabaritoPlayerBox').style.display === "block") {
      gabaritoSimTowers = JSON.parse(JSON.stringify(state.initialTowers[r]));
      renderGabaritoStageView();
  }
}

function renderVisual() {
  const r = state.currentRound;
  const cont = document.getElementById('visualGrid');
  cont.innerHTML = '';
  
  const diskHeightPct = 100 / (state.inteiro * state.discosPorMarca);

  for(let g=0; g<state.numEntities; g++) {
    const tGroup = simTowers[g] || [[],[],[]];
    const card = document.createElement('div');
    card.className = 'group-stage';
    
    let towersHtml = '';
    for(let p=0; p<3; p++) {
      
      let marksHtml = '';
      if(state.discosPorMarca > 1) {
        for(let i=0; i<state.inteiro; i++) marksHtml += `<div class="pole-mark"></div>`;
      }

      let targetNum = (r - 1) * 3 + (p + 1);
      if (targetNum > state.inteiro) targetNum = state.inteiro; 
      const targetFraction = `${targetNum}/${state.inteiro}`;

      let disksHtml = tGroup[p].map(colorIdx => 
        `<div class="v-disk" style="background:${D_COLORS[colorIdx]}; height:${diskHeightPct}%;"></div>`
      ).join('');

      towersHtml += `
        <div class="tower-col">
          <div class="tower-name" style="color:${H_COLORS[p]}">Haste ${H_NAMES[p]}</div>
          <div class="tower-base" style="height: 180px;">
            <div class="tower-pole-bg" style="border: 2px solid ${H_COLORS[p]}; border-bottom: none;">
              ${marksHtml}
            </div>
            <div class="tower-disks">${disksHtml}</div>
          </div>
          <div class="tower-target" style="color:${H_COLORS[p]}; border-color:${H_COLORS[p]}44;">
            ${targetFraction}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div style="font-weight:900; font-size:1.1rem; text-align:center; border-bottom:2px dashed var(--border); padding-bottom:10px; color: var(--primary);">
        ${state.groupNames[g]}
      </div>
      <div class="towers-wrap">${towersHtml}</div>
    `;
    cont.appendChild(card);
  }
}

async function playAnimation() {
  if(isAnimating || isGabaritoAnimating) return;

  const r = state.currentRound;
  
  for(let g=0; g<state.numEntities; g++) {
    if(!state.moves[r][g] || state.moves[r][g].length === 0) {
      showToast(`⚠️ Falta a transcrição de: ${state.groupNames[g]}!`);
      return;
    }
  }
  
  const btn = document.getElementById('btnPlay');
  const originalText = document.getElementById('lblPlayBtn').innerText;

  btn.innerHTML = "⏳ Animando...";
  btn.style.background = "#ccc";
  
  isAnimating = true;
  let myAnimId = ++currentAnimId;

  simTowers = [];
  for(let g=0; g<state.numEntities; g++) {
    simTowers[g] = JSON.parse(JSON.stringify(state.initialTowers[r]));
  }
  renderVisual();

  await new Promise(res => setTimeout(res, 800)); 
  if (myAnimId !== currentAnimId) return;
  
  let maxMoves = 0;
  for(let g=0; g<state.numEntities; g++) {
    const len = state.moves[r][g].length;
    if(len > maxMoves) maxMoves = len;
  }

  for(let step=0; step<maxMoves; step++) {
    let movedAny = false;
    
    for(let g=0; g<state.numEntities; g++) {
      const move = state.moves[r][g][step];
      if(move) {
        if(simTowers[g][move.from].length > 0) {
          const diskColorIdx = simTowers[g][move.from].pop();
          simTowers[g][move.to].push(diskColorIdx);
          movedAny = true;
        }
      }
    }

    if(movedAny) {
      renderVisual(); 
      await new Promise(res => setTimeout(res, 800)); 
      if (myAnimId !== currentAnimId) return;
    }
  }

  if (myAnimId === currentAnimId) {
    isAnimating = false;
    btn.innerHTML = `▶️ <span id="lblPlayBtn">${originalText}</span>`;
    btn.style.background = "var(--primary)";
  }
}

function renderAll() {
  renderRounds();
  renderInitBuilder();
  renderLogger();
  if(!isAnimating && !isGabaritoAnimating && simTowers.length === 0) {
    resetAnimation();
  } else if (!isAnimating && !isGabaritoAnimating) {
    renderVisual();
  }
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

updateGlobal();