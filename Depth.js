const colors = { white: 0, black: 1 };

const pieces = {
    e: 0,
    wp: 1, wn: 2, wb: 3, wr: 4, wq: 5, wk: 6,
    bp: 7, bn: 8, bb: 9, br: 10, bq: 11, bk: 12
};

class Helpers {
    static fenPieceMap = {
        'P': pieces.wp, 'N': pieces.wn, 'B': pieces.wb, 'R': pieces.wr, 'Q': pieces.wq, 'K': pieces.wk,
        'p': pieces.bp, 'n': pieces.bn, 'b': pieces.bb, 'r': pieces.br, 'q': pieces.bq, 'k': pieces.bk
    };

    static ob = (() => {
        const arr = [];
        for (let i = 0; i < 120; i++) {
            const file = i % 10;
            const rank = Math.floor(i / 10);
            if (file < 2 || file > 9 || rank < 2 || rank > 9) arr.push(i);
        }
        return arr;
    })();

    static rankMap = { 2: "a", 3: "b", 4: "c", 5: "d", 6: "e", 7: "f", 8: "g", 9: "h" };
    static fileMap = { 2: "8", 3: "7", 4: "6", 5: "5", 6: "4", 7: "3", 8: "2", 9: "1" };
}

class Move {
    constructor(sp, dp, promo = null, isCapture = false) {
        this.sp = sp;
        this.dp = dp;
        this.promo = promo;
        this.isCapture = isCapture;
        this.promoMap = {
            [pieces.wq]: "q", [pieces.wr]: "r", [pieces.wb]: "b", [pieces.wn]: "n",
            [pieces.bq]: "q", [pieces.br]: "r", [pieces.bb]: "b", [pieces.bn]: "n"
        };
    }

    getUCI() {
        const promo = this.promo ? this.promoMap[this.promo] || "" : "";
        const r1 = Helpers.rankMap[parseInt(String(this.sp)[1])];
        const f1 = Helpers.fileMap[parseInt(String(this.sp)[0])];
        const r2 = Helpers.rankMap[parseInt(String(this.dp)[1])];
        const f2 = Helpers.fileMap[parseInt(String(this.dp)[0])];
        return r1 + f1 + r2 + f2 + promo;
    }
}

class Board {
    constructor(boardArray, currentColor, castlingRights = null, enPasT = null) {
        this.boardArray = boardArray;
        this.currentColor = currentColor;
        this.enPasT = enPasT;
        this.castlingRights = castlingRights ?? { wks: false, wqs: false, bks: false, bqs: false };
    }

    getFen() {
        let fen = "";
        for (let rank = 2; rank <= 9; rank++) {
            let emptyCount = 0;
            for (let file = 2; file <= 9; file++) {
                const idx = rank * 10 + file;
                const piece = this.boardArray[idx];
                if (piece === pieces.e) emptyCount++;
                else {
                    if (emptyCount > 0) { fen += emptyCount; emptyCount = 0; }
                    const pieceChar = Object.keys(Helpers.fenPieceMap).find(k => Helpers.fenPieceMap[k] === piece);
                    fen += pieceChar;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (rank !== 9) fen += "/";
        }
        fen += this.currentColor === colors.white ? " w " : " b ";
        const cr = this.castlingRights;
        let crStr = "";
        if (cr.wks) crStr += "K"; if (cr.wqs) crStr += "Q"; if (cr.bks) crStr += "k"; if (cr.bqs) crStr += "q";
        fen += crStr === "" ? "-" : crStr;
        fen += " ";
        fen += this.enPasT != null ? Helpers.rankMap[parseInt(String(this.enPasT)[1])] + Helpers.fileMap[parseInt(String(this.enPasT)[0])] : "-";
        fen += " 0 1";
        return fen;
    }
}

class Logics {
    constructor() { }

    gpc(piece) { return piece === pieces.e ? null : (piece <= 6 ? 0 : 1); }
    goc(color) { return 1 - color; }
    cutBoardArray(boardArray) { return Array.from(boardArray.keys()).filter(i => !Helpers.ob.includes(i)).map(i => boardArray[i]); }

    defaultBoard() {
        const boardArray = Array(120).fill(pieces.e);
        const backRank = [pieces.wr, pieces.wn, pieces.wb, pieces.wq, pieces.wk, pieces.wb, pieces.wn, pieces.wr];
        const blackBack = [pieces.br, pieces.bn, pieces.bb, pieces.bq, pieces.bk, pieces.bb, pieces.bn, pieces.br];
        for (let i = 0; i < 8; i++) { boardArray[92 + i] = backRank[i]; boardArray[22 + i] = blackBack[i]; }
        for (let i = 0; i < 8; i++) { boardArray[82 + i] = pieces.wp; boardArray[32 + i] = pieces.bp; }
        return new Board(boardArray, colors.white, { wks: true, wqs: true, bks: true, bqs: true }, null);
    }

    makeMove(board, move) {
        const newBoardArray = board.boardArray.slice();
        const { sp, dp, promo } = move;
        const movingPiece = newBoardArray[sp];
        const movingColor = this.gpc(movingPiece);

        if ((movingPiece === pieces.wp || movingPiece === pieces.bp) && dp === board.enPasT && newBoardArray[dp] === pieces.e) {
            const capturedSq = dp + (movingColor === colors.white ? 10 : -10);
            newBoardArray[capturedSq] = pieces.e;
        }

        newBoardArray[dp] = movingPiece;
        newBoardArray[sp] = pieces.e;
        if (promo != null) newBoardArray[dp] = promo;

        if ((movingPiece === pieces.wk || movingPiece === pieces.bk) && Math.abs(sp - dp) === 2) {
            const [rookSp, rookDp] = dp > sp ? [sp + 3, sp + 1] : [sp - 4, sp - 1];
            newBoardArray[rookDp] = newBoardArray[rookSp]; newBoardArray[rookSp] = pieces.e;
        }

        const castlingRights = { ...board.castlingRights };
        if (movingPiece === pieces.wk) castlingRights.wks = castlingRights.wqs = false;
        if (movingPiece === pieces.bk) castlingRights.bks = castlingRights.bqs = false;

        if (sp === 99) castlingRights.wks = false; if (sp === 92) castlingRights.wqs = false;
        if (sp === 29) castlingRights.bks = false; if (sp === 22) castlingRights.bqs = false;

        const capturedPiece = board.boardArray[dp];
        if (capturedPiece === pieces.wr) { if (dp === 99) castlingRights.wks = false; if (dp === 92) castlingRights.wqs = false; }
        if (capturedPiece === pieces.br) { if (dp === 29) castlingRights.bks = false; if (dp === 22) castlingRights.bqs = false; }

        let enPasT = null;
        if ((movingPiece === pieces.wp || movingPiece === pieces.bp) && Math.abs(dp - sp) === 20) enPasT = Math.floor((sp + dp) / 2);

        return new Board(newBoardArray, this.goc(board.currentColor), castlingRights, enPasT);
    }

    isIndexAttacked(sq, board, byColor) {
        const b = board.boardArray;
        const directions = {
            n: [-11, -9, 9, 11],
            b: [-11, -9, 9, 11],
            r: [-10, -1, 1, 10],
            q: [-11, -10, -9, -1, 1, 9, 10, 11],
            k: [-11, -10, -9, -1, 1, 9, 10, 11]
        };

        const knightMoves = [-21, -19, -12, -8, 8, 12, 19, 21];

        // Pawn attacks
        const pawnDir = byColor === colors.white ? [-11, -9] : [9, 11];
        for (let d of pawnDir) if (b[sq + d] === (byColor === colors.white ? pieces.wp : pieces.bp)) return true;

        // Knight
        for (let d of knightMoves) if (b[sq + d] === (byColor === colors.white ? pieces.wn : pieces.bn)) return true;

        // Sliding pieces
        for (let d of directions.q) {
            let t = sq + d;
            while (!Helpers.ob.includes(t)) {
                const p = b[t];
                if (p !== pieces.e) {
                    if (this.gpc(p) === byColor) {
                        const type = p % 6;
                        if (([pieces.wq, pieces.bq].includes(p) || ([pieces.wb, pieces.bb].includes(p) && [ -11, -9, 9, 11].includes(d)) || ([pieces.wr, pieces.br].includes(p) && [ -10, -1, 1, 10].includes(d)) || ([pieces.wk, pieces.bk].includes(p) && Math.abs(d) <= 11))) return true;
                    }
                    break;
                }
                t += d;
            }
        }

        // King
        for (let d of directions.k) if (b[sq + d] === (byColor === colors.white ? pieces.wk : pieces.bk)) return true;

        return false;
    }

    legalMoves(board) {
        const moves = [];
        const b = board.boardArray;
        const color = board.currentColor;
        for (let sq = 0; sq < b.length; sq++) {
            if (this.gpc(b[sq]) !== color) continue;
            const piece = b[sq];
            if (piece === pieces.wp || piece === pieces.bp) {
                const dir = color === colors.white ? -10 : 10;
                const startRank = color === colors.white ? 8 : 3;
                const nextSq = sq + dir;
                if (b[nextSq] === pieces.e) {
                    if (Math.floor(nextSq / 10) === 1 || Math.floor(nextSq / 10) === 8) {
                        [pieces.wq, pieces.wr, pieces.wb, pieces.wn].forEach(promo => moves.push(new Move(sq, nextSq, promo)));
                    } else moves.push(new Move(sq, nextSq));
                    if (Math.floor(sq / 10) === startRank && b[sq + dir * 2] === pieces.e) moves.push(new Move(sq, sq + dir * 2));
                }
                [-1, 1].forEach(dx => {
                    const capSq = sq + dir + dx;
                    if (!Helpers.ob.includes(capSq) && b[capSq] !== pieces.e && this.gpc(b[capSq]) !== color) moves.push(new Move(sq, capSq));
                    if (!Helpers.ob.includes(capSq) && capSq === board.enPasT) moves.push(new Move(sq, capSq));
                });
            }

            const knightDirs = [-21, -19, -12, -8, 8, 12, 19, 21];
            if (piece === pieces.wn || piece === pieces.bn) {
                for (let d of knightDirs) {
                    const target = sq + d;
                    if (!Helpers.ob.includes(target) && this.gpc(b[target]) !== color) moves.push(new Move(sq, target));
                }
            }

            const slidingPieces = {
                [pieces.wb]: [-11, -9, 9, 11], [pieces.bb]: [-11, -9, 9, 11],
                [pieces.wr]: [-10, -1, 1, 10], [pieces.br]: [-10, -1, 1, 10],
                [pieces.wq]: [-11, -10, -9, -1, 1, 9, 10, 11], [pieces.bq]: [-11, -10, -9, -1, 1, 9, 10, 11]
            };
            if (slidingPieces[piece]) {
                for (let d of slidingPieces[piece]) {
                    let t = sq + d;
                    while (!Helpers.ob.includes(t)) {
                        if (b[t] === pieces.e) moves.push(new Move(sq, t));
                        else { if (this.gpc(b[t]) !== color) moves.push(new Move(sq, t)); break; }
                        t += d;
                    }
                }
            }

            const kingDirs = [-11, -10, -9, -1, 1, 9, 10, 11];
            if (piece === pieces.wk || piece === pieces.bk) {
                for (let d of kingDirs) {
                    const target = sq + d;
                    if (!Helpers.ob.includes(target) && this.gpc(b[target]) !== color) moves.push(new Move(sq, target));
                }
                if (piece === pieces.wk && board.castlingRights.wks && b[96] === pieces.e && b[97] === pieces.e && !this.isIndexAttacked(98, board, this.goc(color)) && !this.isIndexAttacked(97, board, this.goc(color))) moves.push(new Move(98, 96));
                if (piece === pieces.wk && board.castlingRights.wqs && b[94] === pieces.e && b[95] === pieces.e && !this.isIndexAttacked(92, board, this.goc(color)) && !this.isIndexAttacked(95, board, this.goc(color))) moves.push(new Move(98, 94));
                if (piece === pieces.bk && board.castlingRights.bks && b[26] === pieces.e && b[27] === pieces.e && !this.isIndexAttacked(28, board, this.goc(color)) && !this.isIndexAttacked(27, board, this.goc(color))) moves.push(new Move(28, 26));
                if (piece === pieces.bk && board.castlingRights.bqs && b[24] === pieces.e && b[25] === pieces.e && !this.isIndexAttacked(22, board, this.goc(color)) && !this.isIndexAttacked(25, board, this.goc(color))) moves.push(new Move(28, 24));
            }
        }
        return moves;
    }
}

class Evaluation {
    constructor() {
        this.logics = new Logics();
        this.pvm = {
            [pieces.wp]: 100, [pieces.wn]: 300, [pieces.wb]: 320, [pieces.wr]: 500, [pieces.wq]: 900,
            [pieces.bp]: -100, [pieces.bn]: -300, [pieces.bb]: -320, [pieces.br]: -500, [pieces.bq]: -900
        };
    }

    evalBoard(board) {
        let score = 0;
        const board64 = this.logics.cutBoardArray(board.boardArray);
        for (let sq64 = 0; sq64 < 64; sq64++) {
            const piece = board64[sq64]; if (piece === pieces.e) continue;
            if (![pieces.wk, pieces.bk].includes(piece)) score += this.pvm[piece];
        }
        return score;
    }
}

class Search {
    constructor() { this.evaluation = new Evaluation(); }

    isInCheck(board, color) { return this.evaluation.logics.isIndexAttacked(board.boardArray.findIndex(p => (color === colors.white ? p === pieces.wk : p === pieces.bk)), board, this.evaluation.logics.goc(color)); }

    isCheckmate(board) { return this.evaluation.logics.legalMoves(board).length === 0 && this.isInCheck(board, board.currentColor); }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.isCheckmate(board)) return { score: this.evaluation.evalBoard(board), move: null };
        const legalMoves = this.evaluation.logics.legalMoves(board);
        if (!legalMoves.length) return { score: this.evaluation.evalBoard(board), move: null };

        let bestMove = null;
        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of legalMoves) {
                const newBoard = this.evaluation.logics.makeMove(board, move);
                const { score } = this.minimax(newBoard, depth - 1, alpha, beta, false);
                if (score > maxEval) { maxEval = score; bestMove = move; }
                alpha = Math.max(alpha, score); if (beta <= alpha) break;
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of legalMoves) {
                const newBoard = this.evaluation.logics.makeMove(board, move);
                const { score } = this.minimax(newBoard, depth - 1, alpha, beta, true);
                if (score < minEval) { minEval = score; bestMove = move; }
                beta = Math.min(beta, score); if (beta <= alpha) break;
            }
            return { score: minEval, move: bestMove };
        }
    }
}

class Engine {
    constructor(baseSearchDepth = 2) { this.search = new Search(); this.baseSearchDepth = baseSearchDepth; }

    translateFEN(fen) {
        const boardArray = Array(120).fill(pieces.e);
        const [boardPart, turnPart, castlingPart, enPassantPart] = fen.split(" ");
        const ranks = boardPart.split("/"); if (ranks.length !== 8) throw new Error("Invalid FEN");
        ranks.forEach((rank, r) => {
            let file = 0;
            for (const c of rank) {
                if (!isNaN(c)) { file += parseInt(c); } else { boardArray[(2 + r) * 10 + (2 + file)] = Helpers.fenPieceMap[c]; file += 1; }
            }
        });
        const currentColor = turnPart === "w" ? colors.white : colors.black;
        const castlingRights = { wks: castlingPart.includes("K"), wqs: castlingPart.includes("Q"), bks: castlingPart.includes("k"), bqs: castlingPart.includes("q") };
        let enPasT = null;
        if (enPassantPart !== "-") { const file = enPassantPart.charCodeAt(0) - "a".charCodeAt(0) + 2; const rank = 10 - parseInt(enPassantPart[1]); enPasT = rank * 10 + file; }
        return new Board(boardArray, currentColor, castlingRights, enPasT);
    }

    bestMove(forColor, board) {
        const pieceCount = this.search.evaluation.logics.cutBoardArray(board.boardArray).filter(p => p !== pieces.e).length;
        const depth = pieceCount <= 12 ? this.baseSearchDepth + 1 : this.baseSearchDepth;
        const maximizingPlayer = forColor === colors.white;
        const { move: bestMove } = this.search.minimax(board, depth, -Infinity, Infinity, maximizingPlayer);
        return bestMove;
    }
}

