// Cloudflare Worker — Tic-Tac-Toe multiplayer relay
// Uses Workers KV for shared state across all instances
// Deploy with: npx wrangler deploy

const WIN_LINES = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function checkWin(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

function getAvailableMoves(board) {
  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!board[i]) moves.push(i);
  }
  return moves;
}

function makeMove(room, index, playerMark) {
  if (room.winner || room.isDraw) return false;
  if (room.board[index] !== '') return false;
  if (room.turn !== playerMark) return false;

  room.board[index] = playerMark;

  const win = checkWin(room.board);
  if (win) {
    room.winner = win.winner;
    room.winningLine = win.line;
  } else if (getAvailableMoves(room.board).length === 0) {
    room.isDraw = true;
  } else {
    room.turn = room.turn === 'X' ? 'O' : 'X';
  }
  return true;
}

function newRoom() {
  return {
    board: Array(9).fill(''),
    turn: 'X',
    winner: null,
    winningLine: null,
    isDraw: false,
    playerX: true,
    playerO: false
  };
}

function roomState(room) {
  return {
    board: room.board,
    turn: room.turn,
    winner: room.winner,
    winningLine: room.winningLine,
    isDraw: room.isDraw,
    playerX: room.playerX,
    playerO: room.playerO
  };
}

async function getRoom(env, code) {
  const raw = await env.TTT_ROOMS.get(code);
  return raw ? JSON.parse(raw) : null;
}

async function saveRoom(env, code, room) {
  await env.TTT_ROOMS.put(code, JSON.stringify(room), { expirationTtl: 600 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Player-Mark'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // POST /room/create
    if (method === 'POST' && path === '/room/create') {
      let code;
      for (let attempt = 0; attempt < 10; attempt++) {
        code = generateCode();
        const existing = await getRoom(env, code);
        if (!existing) break;
      }
      const room = newRoom();
      await saveRoom(env, code, room);
      return new Response(JSON.stringify({ code, playerMark: 'X' }), { headers });
    }

    // POST /room/join/:code
    const joinMatch = path.match(/^\/room\/join\/([A-Z0-9]{4})$/);
    if (method === 'POST' && joinMatch) {
      const code = joinMatch[1];
      const room = await getRoom(env, code);
      if (!room) return new Response(JSON.stringify({ error: 'Room not found.' }), { status: 404, headers });

      const rejoinMark = request.headers.get('X-Player-Mark');

      // Rejoining — return current state without changing anything
      if (rejoinMark === 'X' && room.playerX) {
        return new Response(JSON.stringify({ playerMark: 'X', ...roomState(room) }), { headers });
      }
      if (rejoinMark === 'O' && room.playerO) {
        return new Response(JSON.stringify({ playerMark: 'O', ...roomState(room) }), { headers });
      }

      // New join as O
      if (!room.playerO) {
        room.playerO = true;
        await saveRoom(env, code, room);
        return new Response(JSON.stringify({ playerMark: 'O', ...roomState(room) }), { headers });
      }

      return new Response(JSON.stringify({ error: 'Room is full.' }), { status: 400, headers });
    }

    // POST /room/:code/move
    const moveMatch = path.match(/^\/room\/([A-Z0-9]{4})\/move$/);
    if (method === 'POST' && moveMatch) {
      const code = moveMatch[1];
      const room = await getRoom(env, code);
      if (!room) return new Response(JSON.stringify({ error: 'Room not found.' }), { status: 404, headers });

      const body = await request.json();
      const playerMark = request.headers.get('X-Player-Mark');
      const success = makeMove(room, body.cell, playerMark);
      if (!success) return new Response(JSON.stringify({ error: 'Invalid move.' }), { status: 400, headers });

      await saveRoom(env, code, room);
      return new Response(JSON.stringify({ board: room.board, turn: room.turn, winner: room.winner, winningLine: room.winningLine, isDraw: room.isDraw }), { headers });
    }

    // GET /room/:code
    const stateMatch = path.match(/^\/room\/([A-Z0-9]{4})$/);
    if (method === 'GET' && stateMatch) {
      const code = stateMatch[1];
      const room = await getRoom(env, code);
      if (!room) return new Response(JSON.stringify({ error: 'Room not found.' }), { status: 404, headers });
      return new Response(JSON.stringify({ board: room.board, turn: room.turn, winner: room.winner, winningLine: room.winningLine, isDraw: room.isDraw, playerX: room.playerX, playerO: room.playerO }), { headers });
    }

    // POST /room/:code/rematch
    const rematchMatch = path.match(/^\/room\/([A-Z0-9]{4})\/rematch$/);
    if (method === 'POST' && rematchMatch) {
      const code = rematchMatch[1];
      const room = await getRoom(env, code);
      if (!room) return new Response(JSON.stringify({ error: 'Room not found.' }), { status: 404, headers });

      room.board = Array(9).fill('');
      room.turn = 'X';
      room.winner = null;
      room.winningLine = null;
      room.isDraw = false;
      await saveRoom(env, code, room);
      return new Response(JSON.stringify({ board: room.board, turn: room.turn, winner: room.winner, winningLine: room.winningLine, isDraw: room.isDraw, playerX: room.playerX, playerO: room.playerO }), { headers });
    }

    return new Response('Not found', { status: 404, headers });
  }
};
