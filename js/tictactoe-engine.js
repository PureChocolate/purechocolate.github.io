window.TTTEngine = (function () {

  const WIN_LINES = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  function checkWin(board) {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        return { winner: board[a], line: line };
      }
    }
    return null;
  }

  function getAvailableMoves(board) {
    return board.reduce((acc, curr, i) => {
      if (!curr) acc.push(i);
      return acc;
    }, []);
  }

  function createGame() {
    return {
      board: ['','','','','','','','',''],
      turn: 'X',
      winner: null,
      winningLine: null,
      isDraw: false
    };
  }

  function makeMove(state, index) {
    if (state.winner || state.isDraw) return state;
    if (state.board[index] !== '') return state;

    const newBoard = [...state.board];
    newBoard[index] = state.turn;

    const winResult = checkWin(newBoard);
    if (winResult != null) {
      return { ...state, board: newBoard, winner: winResult.winner, winningLine: winResult.line };
    }
    if (getAvailableMoves(newBoard).length === 0) {
      return { ...state, board: newBoard, isDraw: true };
    }

    const nextTurn = state.turn === 'X' ? 'O' : 'X';
    return { ...state, board: newBoard, turn: nextTurn };
  }

  function getBestMove(board, aiMark, difficulty) {
    const moves = getAvailableMoves(board);

    if (difficulty === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (difficulty === 'hard') {
      const humanMark = aiMark === 'X' ? 'O' : 'X';
      let bestScore = -Infinity;
      let bestIndex = -1;

      for (const cell of moves) {
        board[cell] = aiMark;
        const score = minimax(board, false, aiMark, humanMark);
        board[cell] = '';
        if (score > bestScore) {
          bestScore = score;
          bestIndex = cell;
        }
      }
      return bestIndex;
    }
  }

  function minimax(board, isMaximizing, aiMark, humanMark) {
    const win = checkWin(board);
    if (win) {
      if (win.winner === aiMark) return 10;
      if (win.winner === humanMark) return -10;
    }

    const moves = getAvailableMoves(board);
    if (moves.length === 0) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (const cell of moves) {
        board[cell] = aiMark;
        const score = minimax(board, false, aiMark, humanMark);
        board[cell] = '';
        best = Math.max(best, score);
      }
      return best;
    } else {
      let best = Infinity;
      for (const cell of moves) {
        board[cell] = humanMark;
        const score = minimax(board, true, aiMark, humanMark);
        board[cell] = '';
        best = Math.min(best, score);
      }
      return best;
    }
  }

  return { createGame, makeMove, getBestMove };

})();
