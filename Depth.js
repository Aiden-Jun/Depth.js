const colors = {
    white: 0,
    black: 1
}

const pieces = {
    e: 0,
    wp: 1,
    wn: 2,
    wb: 3,
    wr: 4,
    wq: 5,
    wk: 6,
    bp: 7,
    bn: 8,
    bb: 9,
    br: 10,
    bq: 11,
    bk: 12
}

const pvm = {
    [pieces.wp]: 100,
    [pieces.wn]: 300,
    [pieces.wb]: 320,
    [pieces.wr]: 500,
    [pieces.wq]: 900,
    [pieces.bp]: -100,
    [pieces.bn]: -300,
    [pieces.bb]: -320,
    [pieces.br]: -500,
    [pieces.bq]: -900
}

const pieceToPST = {
    1: "p",
    7: "p",
    2: "n",
    8: "n",
    3: "b",
    9: "b",
    4: "r",
    10: "r",
    5: "q",
    11: "q",
    6: "k",
    12: "k"
}

const pstWhite = {
    p: [
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, -20, -20, 10, 10, 5,
        5, -5, -10, 0, 0, -10, -5, 5,
        0, 0, 0, 20, 20, 0, 0, 0,
        5, 5, 10, 25, 25, 10, 5, 5,
        10, 10, 20, 30, 30, 20, 10, 10,
        50, 50, 50, 50, 50, 50, 50, 50,
        0, 0, 0, 0, 0, 0, 0, 0
    ],
    n: [
        -50, -40, -30, -30, -30, -30, -40, -50,
        -40, -20, 0, 0, 0, 0, -20, -40,
        -30, 0, 10, 15, 15, 10, 0, -30,
        -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30,
        -30, 5, 10, 15, 15, 10, 5, -30,
        -40, -20, 0, 5, 5, 0, -20, -40,
        -50, -40, -30, -30, -30, -30, -40, -50
    ],
    b: [
        -20, -10, -10, -10, -10, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 10, 10, 5, 0, -10,
        -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10,
        -10, 10, 10, 10, 10, 10, 10, -10,
        -10, 5, 0, 0, 0, 0, 5, -10,
        -20, -10, -10, -10, -10, -10, -10, -20
    ],
    r: [
        0, 0, 0, 0, 0, 0, 0, 0,
        5, 10, 10, 10, 10, 10, 10, 5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5,
        0, 0, 0, 5, 5, 0, 0, 0
    ],
    q: [
        -20, -10, -10, -5, -5, -10, -10, -20,
        -10, 0, 0, 0, 0, 0, 0, -10,
        -10, 0, 5, 5, 5, 5, 0, -10,
        -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5,
        -10, 5, 5, 5, 5, 5, 0, -10,
        -10, 0, 5, 0, 0, 0, 0, -10,
        -20, -10, -10, -5, -5, -10, -10, -20
    ],
    k: [
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -30, -40, -40, -50, -50, -40, -40, -30,
        -20, -30, -30, -40, -40, -30, -30, -20,
        -10, -20, -20, -20, -20, -20, -20, -10,
        20, 20, 0, 0, 0, 0, 20, 20,
        20, 30, 10, 0, 0, 10, 30, 20
    ]
}

const pstBlack = {}
for (const piece in pstWhite) {
    const table = pstWhite[piece]
    const flipped = new Array(64)
    for (let i = 0; i < 64; i++) {
        const r = Math.floor(i / 8)
        const f = i % 8
        const mirror_i = (7 - r) * 8 + f
        flipped[mirror_i] = -table[i]
    }
    pstBlack[piece] = flipped
}

const fs = require('fs');
let openingBook = {}

try {
    openingBook = JSON.parse(fs.readFileSync('openings.json', 'utf8'))
} catch (err) {
    console.error("Failed to load opening book - ", err)
}

function getBookMove(board) {
    const fen = board.getFen();
    const moves = openingBook[fen];
    if (!moves || moves.length === 0) return null

    const moveUCI = moves[Math.floor(Math.random() * moves.length)];
    return uciToMove(moveUCI, board)
}

const ob = []
for (let i = 0; i < 120; i++) {
    const file = i % 10
    const rank = Math.floor(i / 10)
    if (file < 2 || file > 9 || rank < 2 || rank > 9) {
        ob.push(i)
    }
}

function gpc(piece) {
    return piece === pieces["e"] ? null : (piece <= 6 ? 0 : 1)
}

function goc(color) {
    return 1 - color
}

const rank_map = {
    2: "a",
    3: "b",
    4: "c",
    5: "d",
    6: "e",
    7: "f",
    8: "g",
    9: "h"
}

const file_map = {
    2: "8",
    3: "7",
    4: "6",
    5: "5",
    6: "4",
    7: "3",
    8: "2",
    9: "1"
}

function idxPos(idx120) {
    return rank_map[parseInt(String(idx120)[1])] + file_map[parseInt(String(idx120)[0])]
}

function cutBoardArray(boardArray) {
    return Array.from(boardArray.keys())
        .filter(i => !ob.includes(i))
        .map(i => boardArray[i])
}

function uciToMove(uci, board) {
    if (uci.length < 4) throw new Error("Invalid UCI move");

    const fileMapRev = {
        "a": 2, "b": 3, "c": 4, "d": 5,
        "e": 6, "f": 7, "g": 8, "h": 9
    };

    const rankMapRev = {
        "8": 2, "7": 3, "6": 4, "5": 5,
        "4": 6, "3": 7, "2": 8, "1": 9
    };

    const spFile = fileMapRev[uci[0]];
    const spRank = rankMapRev[uci[1]];
    const dpFile = fileMapRev[uci[2]];
    const dpRank = rankMapRev[uci[3]];

    const sp = spRank * 10 + spFile;
    const dp = dpRank * 10 + dpFile;

    let promo = null;
    if (uci.length === 5) {
        const promoChar = uci[4].toLowerCase();
        const currentColor = board.currentColor;
        if (currentColor === colors.white) {
            if (promoChar === "q") promo = pieces.wq;
            else if (promoChar === "r") promo = pieces.wr;
            else if (promoChar === "b") promo = pieces.wb;
            else if (promoChar === "n") promo = pieces.wn;
        } else {
            if (promoChar === "q") promo = pieces.bq;
            else if (promoChar === "r") promo = pieces.br;
            else if (promoChar === "b") promo = pieces.bb;
            else if (promoChar === "n") promo = pieces.bn;
        }
    }

    const isCapture = board.boardArray[dp] !== pieces.e || 
        ((board.boardArray[sp] === pieces.wp || board.boardArray[sp] === pieces.bp) && dp === board.enPasT);

    return new Move(sp, dp, promo, isCapture);
}

class Move {
    constructor(sp, dp, promo, isCapture) {
        this.sp = sp
        this.dp = dp
        this.promo = promo
        this.isCapture = isCapture
    }

    getUCI() {
        const promoMap = {
            [pieces.wq]: "q",
            [pieces.wr]: "r",
            [pieces.wb]: "b",
            [pieces.wn]: "n",
            [pieces.bq]: "q",
            [pieces.br]: "r",
            [pieces.bb]: "b",
            [pieces.bn]: "n"
        }
        const promo = this.promo ? promoMap[this.promo] || "" : ""
        return idxPos(this.sp) + idxPos(this.dp) + promo
    }
}

class BoardState {
    constructor(boardArray, currentColor, castlingRights, enPasT, isCapture) {
        this.boardArray = boardArray
        this.currentColor = currentColor
        this.enPasT = enPasT
        this.isCapture = isCapture

        this.castlingRights = castlingRights ?? {
            wks: false,
            wqs: false,
            bks: false,
            bqs: false
        }
    }

    getFen() {
        const A = this.boardArray;
        let fen = "";

        for (let rank = 2; rank <= 9; rank++) {
            let emptyCount = 0;
            for (let file = 2; file <= 9; file++) {
                const idx = rank * 10 + file;
                const piece = A[idx];

                if (piece === pieces.e) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }

                    const pieceChar = Object.keys(fenPieceMap).find(key => fenPieceMap[key] === piece);
                    fen += pieceChar;
                }
            }
            if (emptyCount > 0) fen += emptyCount;
            if (rank !== 9) fen += "/";
        }

        fen += this.currentColor === colors.white ? " w " : " b ";

        const cr = this.castlingRights;
        let crStr = "";
        if (cr.wks) crStr += "K";
        if (cr.wqs) crStr += "Q";
        if (cr.bks) crStr += "k";
        if (cr.bqs) crStr += "q";
        fen += crStr === "" ? "-" : crStr;
        fen += " ";

        fen += this.enPasT != null ? idxPos(this.enPasT) : "-";
        fen += " 0 1";

        return fen;
    }
}

function makeMove(board, move) {
    const boardArray = board.boardArray
    const newBoardArray = boardArray.slice()

    const {
        sp,
        dp,
        promo
    } = move
    const movingPiece = newBoardArray[sp]
    const movingColor = gpc(movingPiece)

    if ((movingPiece === pieces.wp || movingPiece === pieces.bp) && dp === board.enPasT && newBoardArray[dp] === pieces.e) {
        const capturedSq = dp + (movingColor === colors.white ? 10 : -10)
        newBoardArray[capturedSq] = pieces.e
    }

    newBoardArray[dp] = movingPiece
    newBoardArray[sp] = pieces.e

    if (promo !== null && promo !== undefined) newBoardArray[dp] = promo

    if ((movingPiece === pieces.wk || movingPiece === pieces.bk) && Math.abs(sp - dp) === 2) {
        const [rookSp, rookDp] = dp > sp ? [sp + 3, sp + 1] : [sp - 4, sp - 1]
        newBoardArray[rookDp] = newBoardArray[rookSp]
        newBoardArray[rookSp] = pieces.e
    }

    const castlingRights = {
        ...board.castlingRights
    }

    if (movingPiece === pieces.wk) {
        castlingRights.wks = false
        castlingRights.wqs = false
    }

    if (movingPiece === pieces.bk) {
        castlingRights.bks = false
        castlingRights.bqs = false
    }

    if (sp === 99) castlingRights.wks = false
    if (sp === 92) castlingRights.wqs = false
    if (sp === 29) castlingRights.bks = false
    if (sp === 22) castlingRights.bqs = false

    const capturedPiece = boardArray[dp]
    if (capturedPiece === pieces.wr) {
        if (dp === 99) castlingRights.wks = false
        if (dp === 92) castlingRights.wqs = false
    } else if (capturedPiece === pieces.br) {
        if (dp === 29) castlingRights.bks = false
        if (dp === 22) castlingRights.bqs = false
    }

    let enPasT = null
    if ((movingPiece === pieces.wp || movingPiece === pieces.bp) && Math.abs(dp - sp) === 20) {
        enPasT = Math.floor((sp + dp) / 2)
    }

    const newBoardColor = goc(board.currentColor)

    return new BoardState(newBoardArray, newBoardColor, castlingRights, enPasT)
}

function defaultBoard() {
    const boardArray = Array(120).fill(pieces.e)

    boardArray[92] = pieces.wr
    boardArray[93] = pieces.wn
    boardArray[94] = pieces.wb
    boardArray[95] = pieces.wq
    boardArray[96] = pieces.wk
    boardArray[97] = pieces.wb
    boardArray[98] = pieces.wn
    boardArray[99] = pieces.wr

    for (let file = 2; file < 10; file++) {
        boardArray[82 + file - 2] = pieces.wp
    }

    boardArray[22] = pieces.br
    boardArray[23] = pieces.bn
    boardArray[24] = pieces.bb
    boardArray[25] = pieces.bq
    boardArray[26] = pieces.bk
    boardArray[27] = pieces.bb
    boardArray[28] = pieces.bn
    boardArray[29] = pieces.br

    for (let file = 2; file < 10; file++) {
        boardArray[32 + file - 2] = pieces.bp
    }

    return new BoardState(boardArray, colors.white, {
        wks: true,
        wqs: true,
        bks: true,
        bqs: true
    }, null)
}

const fenPieceMap = {
    'P': pieces.wp,
    'N': pieces.wn,
    'B': pieces.wb,
    'R': pieces.wr,
    'Q': pieces.wq,
    'K': pieces.wk,
    'p': pieces.bp,
    'n': pieces.bn,
    'b': pieces.bb,
    'r': pieces.br,
    'q': pieces.bq,
    'k': pieces.bk
}

function fenStringToBoard(fen) {
    const boardArray = Array(120).fill(pieces["e"])
    const parts = fen.split(" ")
    const boardPart = parts[0]
    const turnPart = parts[1]
    const castlingPart = parts[2]
    const enPassantPart = parts[3]

    const ranks = boardPart.split("/")
    if (ranks.length !== 8) throw new Error("Invalid FEN")

    ranks.forEach((rank, r) => {
        let file = 0
        for (const c of rank) {
            if (!isNaN(c)) {
                file += parseInt(c)
            } else {
                const index = (2 + r) * 10 + (2 + file)
                boardArray[index] = fenPieceMap[c]
                file += 1
            }
        }
    })

    const currentColor = turnPart === "w" ? colors["white"] : colors["black"]

    const castlingRights = {
        wks: false,
        wqs: false,
        bks: false,
        bqs: false
    }
    if (castlingPart.includes("K")) castlingRights.wks = true
    if (castlingPart.includes("Q")) castlingRights.wqs = true
    if (castlingPart.includes("k")) castlingRights.bks = true
    if (castlingPart.includes("q")) castlingRights.bqs = true

    let enPasT = null
    if (enPassantPart !== "-") {
        const file = enPassantPart.charCodeAt(0) - "a".charCodeAt(0) + 2
        const rank = 10 - parseInt(enPassantPart[1])
        enPasT = rank * 10 + file
    }

    return new BoardState(boardArray, currentColor, castlingRights, enPasT)
}

class Logics {
    pawnMoves(color, board, index, onlyCapture = false) {
        const moves = []
        const A = board.boardArray
        if (color !== gpc(A[index])) return moves

        let single, doubleP, cl, cr, startRank, endRank, promos
        if (color === colors.white) {
            [single, doubleP, cl, cr, startRank, endRank] = [-10, -20, -11, -9, 8, 2]
            promos = [pieces.wq, pieces.wr, pieces.wb, pieces.wn]
        } else {
            [single, doubleP, cl, cr, startRank, endRank] = [10, 20, 9, 11, 3, 9]
            promos = [pieces.bq, pieces.br, pieces.bb, pieces.bn]
        }

        for (const off of [cl, cr]) {
            const to = index + off
            if (!ob.includes(to) && A[to] !== pieces.e && gpc(A[to]) === goc(color)) {
                if (Math.floor(to / 10) === endRank) promos.forEach(p => moves.push(new Move(index, to, p, true)))
                else moves.push(new Move(index, to, null, true))
            }
        }

        if (board.enPasT != null) {
            for (const off of [cl, cr]) {
                const to = index + off
                if (!ob.includes(to) && to === board.enPasT) moves.push(new Move(index, to, null, true))
            }
        }

        if (!onlyCapture) {
            let to = index + single
            if (!ob.includes(to) && A[to] === pieces.e) {
                if (Math.floor(to / 10) === endRank) promos.forEach(p => moves.push(new Move(index, to, p, false)))
                else moves.push(new Move(index, to, null, false))
                let to2 = index + doubleP
                if (Math.floor(index / 10) === startRank && A[to2] === pieces.e) moves.push(new Move(index, to2, null, false))
            }
        }

        return moves
    }

    knightMoves(color, board, index) {
        const moves = []
        const A = board.boardArray
        if (color !== gpc(A[index])) return moves
        const offsets = [-21, -19, -12, -8, 8, 12, 19, 21]
        offsets.forEach(off => {
            const to = index + off
            if (!ob.includes(to) && (A[to] === pieces.e || gpc(A[to]) === goc(color))) {
                moves.push(new Move(index, to, null, A[to] !== pieces.e))
            }
        })
        return moves
    }

    slidingMoves(color, board, index, offsets) {
        const moves = []
        const A = board.boardArray
        offsets.forEach(offset => {
            let dest = index + offset
            while (!ob.includes(dest)) {
                const piece = A[dest]
                if (piece === pieces.e) moves.push(new Move(index, dest, null, false))
                else {
                    if (gpc(piece) === goc(color)) moves.push(new Move(index, dest, null, true))
                    break
                }
                dest += offset
            }
        })
        return moves
    }

    bishopMoves(c, b, i) {
        return this.slidingMoves(c, b, i, [-11, -9, 9, 11])
    }

    rookMoves(c, b, i) {
        return this.slidingMoves(c, b, i, [-10, 10, -1, 1])
    }

    queenMoves(c, b, i) {
        return [...this.bishopMoves(c, b, i), ...this.rookMoves(c, b, i)]
    }

    isIndexAttacked(index, board, attackerColor) {
        const A = board.boardArray
        for (let sq = 0; sq < A.length; sq++) {
            const piece = A[sq]
            if (ob.includes(sq) || piece === pieces.e || gpc(piece) !== attackerColor) continue
            let moves = []
            if ([pieces.wp, pieces.bp].includes(piece)) moves = this.pawnMoves(attackerColor, board, sq, true)
            else if ([pieces.wn, pieces.bn].includes(piece)) moves = this.knightMoves(attackerColor, board, sq)
            else if ([pieces.wb, pieces.bb].includes(piece)) moves = this.bishopMoves(attackerColor, board, sq)
            else if ([pieces.wr, pieces.br].includes(piece)) moves = this.rookMoves(attackerColor, board, sq)
            else if ([pieces.wq, pieces.bq].includes(piece)) moves = this.queenMoves(attackerColor, board, sq)
            else if ([pieces.wk, pieces.bk].includes(piece)) {
                [-10, -9, -1, 1, 9, 10, 11, -11].forEach(off => {
                    const target = sq + off
                    if (!ob.includes(target)) moves.push(new Move(sq, target, null, false))
                })
            }
            if (moves.some(m => m.dp === index)) return true
        }
        return false
    }

    kingMoves(color, board, index) {
        const moves = []
        const A = board.boardArray
        if (color !== gpc(A[index])) return moves
        const castling = board.castlingRights

        const offsets = [-10, -9, -1, 1, 9, 10, 11, -11]
        for (const off of offsets) {
            const to = index + off
            if (
                !ob.includes(to) &&
                (A[to] === pieces.e || gpc(A[to]) === goc(color)) &&
                !this.isIndexAttacked(to, board, goc(color))
            ) {
                moves.push(new Move(index, to, null, A[to] !== pieces.e))
            }
        }

        const castleOptions = [
            [colors.white, [97, 98], 99, 98],
            [colors.white, [95, 94, 93], 92, 94],
            [colors.black, [27, 28], 29, 28],
            [colors.black, [25, 24, 23], 22, 24]
        ]

        for (const [side, squares, rookSq, targetSq] of castleOptions) {
            if (
                color === side &&
                squares.every(s => A[s] === pieces.e) && [pieces.wr, pieces.br].includes(A[rookSq])
            ) {
                if (![index, ...squares].some(s => this.isIndexAttacked(s, board, goc(color)))) {
                    moves.push(new Move(index, targetSq, null, false))
                }
            }
        }

        return moves
    }

    legalMoves(board) {
        const A = board.boardArray
        const color = board.currentColor
        const kingSq = A.findIndex((p, i) => (color === colors.white && p === pieces.wk) || (color === colors.black && p === pieces.bk))

        let pseudoMoves = []
        A.forEach((p, i) => {
            if (ob.includes(i) || p === pieces.e || gpc(p) !== color) return
            if ([pieces.wp, pieces.bp].includes(p)) pseudoMoves.push(...this.pawnMoves(color, board, i))
            else if ([pieces.wn, pieces.bn].includes(p)) pseudoMoves.push(...this.knightMoves(color, board, i))
            else if ([pieces.wb, pieces.bb].includes(p)) pseudoMoves.push(...this.bishopMoves(color, board, i))
            else if ([pieces.wr, pieces.br].includes(p)) pseudoMoves.push(...this.rookMoves(color, board, i))
            else if ([pieces.wq, pieces.bq].includes(p)) pseudoMoves.push(...this.queenMoves(color, board, i))
            else if ([pieces.wk, pieces.bk].includes(p)) pseudoMoves.push(...this.kingMoves(color, board, i))
        })

        return pseudoMoves.filter(move => {
            const newBoard = makeMove(board, move)
            const newKingSq = move.sp === kingSq ? move.dp : kingSq
            return !this.isIndexAttacked(newKingSq, newBoard, goc(color)) && !ob.includes(move.sp) && !ob.includes(move.dp)
        })
    }
}

class Evaluation {
    evalBoard(board) {
        let evalScore = 0
        const board64 = cutBoardArray(board.boardArray)

        for (let sq64 = 0; sq64 < 64; sq64++) {
            const piece = board64[sq64]
            if (piece === pieces.e) continue

            if (![pieces.wk, pieces.bk].includes(piece)) {
                evalScore += pvm[piece]
            }

            const pstKey = pieceToPST[piece]
            if (pstKey) {
                const pstTable = piece <= 6 ? pstWhite[pstKey] : pstBlack[pstKey]
                evalScore += pstTable[sq64]
            }
        }

        return evalScore
    }
}

class Search {
    constructor() {
        this.logics = new Logics()
        this.evaluation = new Evaluation()
    }

    isInCheck(board, color) {
        const kingSq = board.boardArray.findIndex(
            (p, i) =>
            (color === colors.white && p === pieces.wk) ||
            (color === colors.black && p === pieces.bk)
        )
        return this.logics.isIndexAttacked(kingSq, board, goc(color))
    }

    isCheckmate(board) {
        if (this.logics.legalMoves(board).length > 0) return false
        return this.isInCheck(board, board.currentColor)
    }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || this.isCheckmate(board)) {
            return {
                score: this.evaluation.evalBoard(board),
                move: null
            }
        }

        const legalMoves = this.logics.legalMoves(board)

        if (!legalMoves.length) return {
            score: this.evaluation.evalBoard(board),
            move: null
        }

        let bestMove = null

        if (maximizingPlayer) {
            let maxEval = -Infinity
            for (const move of legalMoves) {
                const newBoard = makeMove(board, move)
                const {
                    score
                } = this.minimax(newBoard, depth - 1, alpha, beta, false)

                if (score > maxEval) {
                    maxEval = score
                    bestMove = move
                }
                alpha = Math.max(alpha, score)
                if (beta <= alpha) {
                    break
                }
            }
            return {
                score: maxEval,
                move: bestMove
            }
        } else {
            let minEval = Infinity
            for (const move of legalMoves) {
                const newBoard = makeMove(board, move)
                const {
                    score
                } = this.minimax(newBoard, depth - 1, alpha, beta, true)

                if (score < minEval) {
                    minEval = score
                    bestMove = move
                }
                beta = Math.min(beta, score)
                if (beta <= alpha) {
                    break
                }
            }
            return {
                score: minEval,
                move: bestMove
            }
        }
    }
}

class Engine {
    constructor(baseSearchDepth = 3) {
        this.search = new Search()
        this.baseSearchDepth = baseSearchDepth
    }

    analyze(fen) {
        return this.search.evaluation.evalBoard(fenStringToBoard(fen))
    }

    staticSearch(forColor, board, depth = null) {
        if (depth === null) {
            depth = this.baseSearchDepth
        }

        const maximizingPlayer = forColor === colors.white

        const {
            move: bestMove
        } = this.search.minimax(
            board,
            depth,
            -Infinity,
            Infinity,
            maximizingPlayer
        )

        return bestMove
    }

    bestMove(forColor, board) {
        const bookMove = getBookMove(board)
        if (bookMove != null) return bookMove

        let dynamicDepth = this.baseSearchDepth

        const pieceCount = cutBoardArray(board.boardArray).filter(p => p !== pieces.e).length
        if (pieceCount <= 12) dynamicDepth += 1

        return this.staticSearch(forColor, board, dynamicDepth)
    }
}

const engine = new Engine()
const board = defaultBoard()
const bestMove = engine.bestMove(colors.white, board)
console.log(bestMove.getUCI())
console.log(engine.analyze(board.getFen()))