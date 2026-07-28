window.TTTWidget = (function () {

  // ── Config ───────────────────────────────────────────────

  const API_BASE = window.TTTConfig?.API_BASE || 'https://ttt.gurkirat.net';

  // ── State ────────────────────────────────────────────────

  let state = null;
  let mode = null;         // 'easy' | 'hard' | 'pvp' | 'online'
  let playerMark = null;   // 'X' | 'O' (for online mode)
  let roomCode = null;     // 4-char room code (for online mode)
  let pollTimer = null;    // setInterval id
  let container = null;
  let statusEl = null;

  // ── Init ─────────────────────────────────────────────────

  function mount(containerId) {
    container = document.getElementById(containerId);
    if (!container) return;
    showModeSelect();
  }

  // ── Mode selection ───────────────────────────────────────

  function showModeSelect() {
    stopPolling();
    container.innerHTML = `
      <div class="ttt-mode-select">
        <p class="ttt-mode-label">Choose mode:</p>
        <div class="ttt-mode-buttons">
          <button class="ttt-mode-btn" data-mode="easy">vs AI (Easy)</button>
          <button class="ttt-mode-btn" data-mode="hard">vs AI (Hard)</button>
          <button class="ttt-mode-btn" data-mode="pvp">vs Friend (local)</button>
          <button class="ttt-mode-btn" data-mode="online">Online PvP</button>
        </div>
      </div>
    `;
    container.querySelectorAll('.ttt-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.mode === 'online') showOnlineMenu();
        else startGame(btn.dataset.mode);
      });
    });
  }

  // ── Online menu ──────────────────────────────────────────

  function showOnlineMenu() {
    if (!API_BASE) {
      container.innerHTML = '<p class="ttt-status">API not configured yet.</p>';
      const backBtn = document.createElement('button');
      backBtn.className = 'ttt-back-btn';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', showModeSelect);
      const wrap = document.createElement('div');
      wrap.className = 'ttt-controls';
      wrap.appendChild(backBtn);
      container.appendChild(wrap);
      return;
    }

    const saved = getSavedRoom();

    container.innerHTML = `
      <div class="ttt-mode-select">
        <p class="ttt-mode-label">Online PvP</p>
        <div class="ttt-mode-buttons">
          ${saved ? `
            <button class="ttt-mode-btn" id="ttt-rejoin">Rejoin Room (${saved.code} as ${saved.mark})</button>
            <button class="ttt-mode-btn" id="ttt-leave-room">Leave Room</button>
          ` : `
            <button class="ttt-mode-btn" id="ttt-create">Create Room</button>
            <div class="ttt-join-row">
              <input type="text" id="ttt-join-input" maxlength="4" placeholder="Room code" class="ttt-join-input">
              <button class="ttt-mode-btn" id="ttt-join">Join</button>
            </div>
          `}
        </div>
        <p id="ttt-menu-msg" class="ttt-status"></p>
        <div class="ttt-controls">
          <button class="ttt-back-btn" id="ttt-online-back">Back</button>
        </div>
      </div>
    `;

    if (saved) {
      document.getElementById('ttt-rejoin').addEventListener('click', rejoinRoom);
      document.getElementById('ttt-leave-room').addEventListener('click', () => {
        clearSavedRoom();
        showOnlineMenu();
      });
    } else {
      document.getElementById('ttt-create').addEventListener('click', createRoom);
      document.getElementById('ttt-join').addEventListener('click', joinRoom);
    }
    document.getElementById('ttt-online-back').addEventListener('click', showModeSelect);
  }

  function getSavedRoom() {
    try {
      const raw = sessionStorage.getItem('ttt-room');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveRoom(code, mark) {
    try {
      sessionStorage.setItem('ttt-room', JSON.stringify({ code: code, mark: mark }));
    } catch (e) { /* ignore */ }
  }

  function clearSavedRoom() {
    try { sessionStorage.removeItem('ttt-room'); } catch (e) { /* ignore */ }
  }

  // ── Online: Create Room ──────────────────────────────────

  async function createRoom() {
    try {
      const res = await fetch(API_BASE + '/room/create', { method: 'POST' });
      const data = await res.json();
      roomCode = data.code;
      playerMark = data.playerMark;
      mode = 'online';
      saveRoom(roomCode, playerMark);

      showRoomWaiting();
      startPolling();
    } catch (e) {
      document.getElementById('ttt-menu-msg').textContent = 'Connection failed.';
    }
  }

  function showRoomWaiting() {
    container.innerHTML = `
      <div class="ttt-online-waiting">
        <p class="ttt-room-label">Room Code</p>
        <p class="ttt-room-code" id="ttt-room-code">${roomCode}</p>
        <button class="ttt-mode-btn ttt-copy-btn" id="ttt-copy">Copy Code</button>
        <p class="ttt-status" id="ttt-wait-msg">Waiting for opponent...</p>
        <div class="ttt-controls">
          <button class="ttt-back-btn" id="ttt-cancel-room">Cancel</button>
        </div>
      </div>
    `;

    document.getElementById('ttt-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(roomCode);
      document.getElementById('ttt-copy').textContent = 'Copied!';
      setTimeout(() => {
        const btn = document.getElementById('ttt-copy');
        if (btn) btn.textContent = 'Copy Code';
      }, 2000);
    });

    document.getElementById('ttt-cancel-room').addEventListener('click', () => {
      stopPolling();
      showOnlineMenu();
    });
  }

  // ── Online: Join Room ────────────────────────────────────

  async function joinRoom() {
    const input = document.getElementById('ttt-join-input');
    const code = input.value.trim().toUpperCase();
    if (code.length !== 4) {
      document.getElementById('ttt-menu-msg').textContent = 'Enter a 4-letter code.';
      return;
    }
    await enterRoom(code, null);
  }

  async function rejoinRoom() {
    const saved = getSavedRoom();
    if (!saved) return;
    await enterRoom(saved.code, saved.mark);
  }

  async function enterRoom(code, savedMark) {
    try {
      const headers = {};
      if (savedMark) headers['X-Player-Mark'] = savedMark;

      const res = await fetch(API_BASE + '/room/join/' + code, { method: 'POST', headers });
      const data = await res.json();
      if (data.error) {
        const msgEl = document.getElementById('ttt-menu-msg');
        if (msgEl) msgEl.textContent = data.error;
        if (data.error.includes('not found')) clearSavedRoom();
        return;
      }
      roomCode = code;
      playerMark = data.playerMark;
      mode = 'online';
      saveRoom(roomCode, playerMark);

      buildUI();
      syncState(data);
      renderBoard();
      updateStatus();
      startPolling();
    } catch (e) {
      const msgEl = document.getElementById('ttt-menu-msg');
      if (msgEl) msgEl.textContent = 'Connection failed.';
    }
  }

  // ── Online: Polling ──────────────────────────────────────

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(pollRoom, 500);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function pollRoom() {
    try {
      const res = await fetch(API_BASE + '/room/' + roomCode);
      const data = await res.json();

      if (data.error) {
        if (data.error.includes('not found')) {
          clearSavedRoom();
          stopPolling();
          state = null;
          showOnlineMenu();
          return;
        }
        return;
      }

      if (state === null && data.playerO && document.getElementById('ttt-wait-msg')) {
        buildUI();
      }

      if (state === null && !data.playerO) return;

      if (state && state.board) {
        const changed = data.board.some((cell, i) => cell !== state.board[i]);
        if (!changed && data.winner === state.winner && data.isDraw === state.isDraw) return;
      }

      syncState(data);
      renderBoard();
      updateStatus();

      if (state.winner || state.isDraw) {
        stopPolling();
      }
    } catch (e) {
      // Network hiccup — ignore, next poll will retry
    }
  }

  function syncState(data) {
    state = {
      board: data.board,
      turn: data.turn,
      winner: data.winner,
      winningLine: data.winningLine,
      isDraw: data.isDraw
    };
  }

  // ── Online: Move ─────────────────────────────────────────

  async function sendMove(index) {
    try {
      const res = await fetch(API_BASE + '/room/' + roomCode + '/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Player-Mark': playerMark },
        body: JSON.stringify({ cell: index })
      });
      const data = await res.json();
      if (!data.error) {
        syncState(data);
        renderBoard();
        updateStatus();
        if (state.winner || state.isDraw) {
          stopPolling();
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // ── Online: Rematch ──────────────────────────────────────

  async function rematchOnline() {
    try {
      const res = await fetch(API_BASE + '/room/' + roomCode + '/rematch', { method: 'POST' });
      const data = await res.json();
      playerMark = playerMark === 'X' ? 'O' : 'X';
      syncState(data);
      renderBoard();
      updateStatus();
      startPolling();
    } catch (e) {
      // ignore
    }
  }

  // ── Local game ───────────────────────────────────────────

  function startGame(selectedMode) {
    stopPolling();
    mode = selectedMode;
    state = TTTEngine.createGame();
    buildUI();
    renderBoard();
    updateStatus();
  }

  function buildUI() {
    const resetLabel = (mode === 'online') ? 'Rematch' : 'New Game';
    container.innerHTML = `
      <div class="ttt-board" id="ttt-board">
        ${[0,1,2,3,4,5,6,7,8].map(i => `<div class="ttt-cell" data-index="${i}"></div>`).join('')}
      </div>
      <p class="ttt-status" id="ttt-status"></p>
      <div class="ttt-controls">
        <button class="ttt-reset-btn" id="ttt-reset">${resetLabel}</button>
        <button class="ttt-back-btn" id="ttt-back">Change Mode</button>
      </div>
    `;

    statusEl = document.getElementById('ttt-status');

    document.querySelectorAll('.ttt-cell').forEach(cell => {
      cell.addEventListener('click', () => handleCellClick(parseInt(cell.dataset.index)));
    });

    document.getElementById('ttt-reset').addEventListener('click', () => {
      if (mode === 'online') {
        rematchOnline();
        return;
      }
      state = TTTEngine.createGame();
      renderBoard();
      updateStatus();
    });

    document.getElementById('ttt-back').addEventListener('click', () => {
      stopPolling();
      showModeSelect();
    });
  }

  // ── Board rendering ──────────────────────────────────────

  function renderBoard() {
    if (!state) return;
    const cells = container.querySelectorAll('.ttt-cell');
    cells.forEach((cell, i) => {
      cell.textContent = state.board[i];
      cell.className = 'ttt-cell';
      if (state.board[i]) {
        cell.classList.add('taken', 'mark-' + state.board[i].toLowerCase());
      }
    });

    if (state.winningLine) {
      state.winningLine.forEach(i => {
        cells[i].classList.add('winner');
      });
    }
  }

  // ── Input handling ───────────────────────────────────────

  function handleCellClick(index) {
    if (!state) return;
    if (state.winner || state.isDraw) return;
    if (state.board[index] !== '') return;

    // Online: only allow during our turn
    if (mode === 'online') {
      if (state.turn !== playerMark) return;
      sendMove(index);
      return;
    }

    // Local: ignore AI's turn
    if (mode !== 'pvp' && state.turn === 'O') return;

    applyMove(index);

    if (mode === 'pvp' || state.winner || state.isDraw) return;
    setTimeout(playAIMove, 300);
  }

  function applyMove(index) {
    state = TTTEngine.makeMove(state, index);
    renderBoard();
    updateStatus();
  }

  function playAIMove() {
    if (state.winner || state.isDraw || state.turn !== 'O') return;
    const aiIndex = TTTEngine.getBestMove(state.board, 'O', mode);
    if (aiIndex >= 0) applyMove(aiIndex);
  }

  // ── Status display ───────────────────────────────────────

  function updateStatus() {
    if (!statusEl || !state) return;

    if (state.winner) {
      const label = (mode === 'online') ? (state.winner === playerMark ? 'You win!' : 'Opponent wins!') : `${state.winner} wins!`;
      statusEl.textContent = label;
      statusEl.className = 'ttt-status ttt-gameover';
    } else if (state.isDraw) {
      statusEl.textContent = "It's a draw.";
      statusEl.className = 'ttt-status ttt-gameover';
    } else if (mode === 'online') {
      statusEl.textContent = state.turn === playerMark ? 'Your turn' : "Opponent's turn...";
      statusEl.className = 'ttt-status';
    } else if (mode !== 'pvp' && state.turn === 'O') {
      statusEl.textContent = 'AI is thinking...';
      statusEl.className = 'ttt-status';
    } else {
      statusEl.textContent = `${state.turn}'s turn`;
      statusEl.className = 'ttt-status';
    }
  }

  return { mount };

})();
