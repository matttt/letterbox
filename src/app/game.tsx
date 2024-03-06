import { useWindowSize } from "@uidotdev/usehooks";
import { useKeyPress } from 'ahooks';
import { useState, useEffect } from 'react'
import Snackbar from '@mui/material/Snackbar';
import { isMobile } from 'react-device-detect';
import { CEL } from './cel'
import Confetti from 'react-confetti'

const PINK = "rgb(250, 166, 164)"

enum Side {
    left = 'left',
    right = 'right',
    top = 'top',
    bottom = 'bottom'
}

interface GameBoard {
    top: [string, string, string],
    left: [string, string, string],
    right: [string, string, string],
    bottom: [string, string, string],
}

interface DotProps {
    x: number,
    y: number,
    side: Side,
    letter: string,
    squareSize: number
    onClick: () => void
    partOfWord: boolean
    currentlySelectedLetter: boolean
    hasBeenSelected: boolean,
    canBeSelected: boolean
}

function Dot({ x, y, side, letter, squareSize, onClick, partOfWord, currentlySelectedLetter, hasBeenSelected, canBeSelected }: DotProps) {
    const offsets = {
        [Side.top]: [0, -.9],
        [Side.bottom]: [0, 1.2],
        [Side.left]: [-1, .08],
        [Side.right]: [1, .08],
    }

    const [dx, dy] = offsets[side].map(o => o * squareSize / 10)

    return <g>
        <circle
            cx={x}
            cy={y}
            strokeWidth="3"
            stroke={partOfWord ? PINK : "#000"}
            fill={currentlySelectedLetter ? "#000" : "#FFF"}
            cursor={canBeSelected ? "pointer" : ""} // Add cursor property to make mouse icon a hand
            r={isMobile ? squareSize / 30 : squareSize / 40}
            onClick={() => onClick()} />
        <text
            x={x + dx}
            y={y + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={squareSize / 10}
            fontWeight="500"
            fill={(partOfWord || hasBeenSelected) ? "#000" : "#FFF"}
            cursor={canBeSelected ? "pointer" : ""} // Add cursor property to make mouse icon a hand
            onClick={() => onClick()}>
            {letter}
        </text>
    </g>

}

interface LetterStep {
    side: Side,
    idx: number
}

interface PillButtonProps {
    onClick: () => void
    text: string
}

function PillButton({ onClick, text }: PillButtonProps) {
    return <button onClick={onClick} className="text-xl rounded-full border py-4 px-6 text-[#363636] border-[#363636]">{text}</button>
}

export function Game() {
    const [isClient, setIsClient] = useState<boolean>(false)
    const [prevWords, setPrevWords] = useState<LetterStep[][]>([])
    const [letterSteps, setLetterSteps] = useState<LetterStep[]>([])
    const [snackOpen, setSnackOpen] = useState(false)

    const handleSnackClose = () => {
        setSnackOpen(false)
    }

    useEffect(() => {
        setIsClient(true)
    }, [])

    const boardData: GameBoard = {
        top: ['G', 'I', 'A'],
        left: ['W', 'H', 'O'],
        right: ['L', 'S', 'E'],
        bottom: ['R', 'V', 'T']
    }

    const usedLetterSteps = prevWords.reduce((acc, val) => acc.concat(val), [])
    const isWin = new Set(usedLetterSteps.map(ls => boardData[ls.side][ls.idx])).size === 12

    useKeyPress(['Backspace'], (event) => {
        deleteLetter();
    });

    useKeyPress(['Enter'], (event) => {
        submitWord();
    });

    const { width, height } = useWindowSize();

    const svgSizeFactor = isMobile ? 0.8 : 0.6

    const svgSize = Math.min(width || 0, height || 0) * svgSizeFactor;

    const squareSize = svgSize * .7
    const margin = (svgSize - squareSize) / 2

    const outerDotProportion = .16
    const letterDotProportions = [
        outerDotProportion,
        .5,
        1 - outerDotProportion
    ]

    const getLastLetter = (): LetterStep | null => {
        return prevWords.at(-1)?.at(-1) || null
    }

    const canClickLetter = ({ side, idx }: LetterStep) => {
        const letter = boardData[side][idx];

        if (side === letterSteps?.at(-1)?.side) {
            return false
        }

        return true
    }

    const letterDotPositions = letterDotProportions.map(p => p * squareSize)

    const currentlyAssembledWord = letterSteps.map(step => boardData[step.side][step.idx]).join('')

    const hasLetterBeenVisited = ({ side, idx }: LetterStep) => {

        const allPrevs = prevWords.reduce((acc, val) => acc.concat(val), [])
        const allSteps = [...letterSteps, ...allPrevs]

        const exists = !!allSteps.find((ls) => ls.side === side && ls.idx === idx)

        return exists
    }

    const deleteLetter = () => {
        if (prevWords.length > 0 && letterSteps.length === 1) {
            setPrevWords(prevWords.slice(0, -1))
            setLetterSteps(prevWords.at(-1) || [])
        } else {
            // else just delete one letter at the end of letterSteps
            setLetterSteps(letterSteps.slice(0, -1))
        }
    }

    const restartPuzzle = () => {
        setLetterSteps([])
        setPrevWords([])
    }

    const submitWord = () => {
        const word = currentlyAssembledWord.toLowerCase()
        const valid = !!CEL.find(c => c === word)

        if (valid) {
            setPrevWords([...prevWords, letterSteps])
            const lastLetter = letterSteps.at(-1);
            lastLetter && setLetterSteps([lastLetter])
        } else {
            setSnackOpen(true)
        }
    }

    const handleLetterClick = (letterStep: LetterStep) => {
        if (canClickLetter(letterStep)) {
            setLetterSteps([...letterSteps, letterStep])
        }
    }

    const letterStepToPosition = (letterStep: LetterStep) => {
        const ldp = letterDotPositions[letterStep.idx]

        switch (letterStep.side) {
            case Side.top:
                return [ldp, 0]
            case Side.bottom:
                return [ldp, squareSize]
            case Side.left:
                return [0, ldp]
            case Side.right:
                return [squareSize, ldp]
        }
    }

    const createDot = (side: Side, idx: number) => {
        const [x, y] = letterStepToPosition({ side, idx })

        const letter = boardData[side][idx]

        const props = {
            x,
            y,
            side,
            letter,
            squareSize,
            partOfWord: letterSteps.some(step => step.side === side && step.idx === idx),
            currentlySelectedLetter: letterSteps.at(-1)?.side === side && letterSteps.at(-1)?.idx === idx,
            hasBeenSelected: hasLetterBeenVisited({ side, idx }),
            onClick: () => handleLetterClick({ idx, side }),
            canBeSelected: canClickLetter({ side, idx })
        }

        return <Dot key={idx} {...props} />
    }

    const createDots = (side: Side) => {
        const dots = []
        for (let i = 0; i < 3; i++) {
            dots.push(createDot(side, i))
        }
        return dots
    }

    const lines = letterSteps.map((step, idx) => {
        const [x, y] = letterStepToPosition(step)
        const [x2, y2] = letterStepToPosition(letterSteps[idx + 1] || step)

        return <line
            key={`dottedLine-${idx}`}
            x1={x}
            y1={y}
            x2={x2}
            y2={y2}
            stroke={PINK}
            strokeWidth="5"
            strokeDasharray={'10,10'}
        />
    });

    const prevLines = prevWords.map((word: LetterStep[], wordIdx) => word.map((step, idx) => {
        const [x, y] = letterStepToPosition(step)
        const [x2, y2] = letterStepToPosition(word[idx + 1] || step)

        return <line
            key={`prevLine-${idx}-${wordIdx}`}
            x1={x}
            y1={y}
            x2={x2}
            y2={y2}
            stroke={PINK}
            strokeWidth="5"
            opacity={0.3}
        />
    })).reduce((acc, val) => acc.concat(val), []);

    let progressWords = [<span key="blah">Try to solve in 4 words</span>]

    if (prevWords.length > 0) {
        const wordStrings = prevWords.map(pw => pw.map(ls => boardData[ls.side][ls.idx]).join(''))

        const seenLetterSet = new Set()

        const wordEls = []
        let i = 0

        for (const [idx, word] of Object.entries(wordStrings)) {
            const elements = [];
            for (const letter of word) {
                elements.push(<span key={`${idx}-${i++}`} style={{ color: (seenLetterSet.has(letter)) ? '#5F4442' : 'black' }}>{letter}</span>)

                seenLetterSet.add(letter)
            }
            wordEls.push(...elements)
            if (Number(idx) + 1 < wordStrings.length) {
                wordEls.push(<span key={`${idx}-${i++}`} style={{ color: 'white' }}> - </span>)
            }
        }
        progressWords = wordEls
    }

    return <div className="flex flex-col md:flex-row">
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={snackOpen}
            onClose={handleSnackClose}
            message="Not a word"
            autoHideDuration={2500}
            // key={vertical + horizontal}
        />
        {(isClient && isWin) && <Confetti recycle={false} />}
        <div className="grow"></div>
        <div className="w-full flex flex-col md:w-96">
            <div className="grow"></div>
            <div className="flex justify-center">
                <div className="flex flex-col w-full">
                    <h1 className="text-4xl font-bold text-center h-10">{currentlyAssembledWord}</h1>
                    <div className="h-3"></div>
                    <div className="w-full border border-black border-[3px] md:w-50"></div>
                    <div className="h-3"></div>
                    <div className="text-xl font-bold text-center">{progressWords}</div>
                    <div className="h-5"></div>
                    <div className="hidden md:flex">
                        <div className="grow"></div>
                        <PillButton text="Restart" onClick={restartPuzzle} />
                        <div className="w-2"></div>
                        <PillButton text="Delete" onClick={deleteLetter} />
                        <div className="w-2"></div>
                        <PillButton text="Enter" onClick={submitWord} />
                        <div className="grow"></div>
                    </div>
                </div>
            </div>
            <div className="grow"></div>
        </div>

        <div className="w-12"></div>
        <div className="flex">
            <div className="grow"></div>
            <svg width={svgSize} height={svgSize}>
                <g transform={`translate(${margin}, ${margin})`}>
                    <rect width={squareSize} height={squareSize} stroke="black" strokeWidth="3" fill="#FFF" />
                    {prevLines}
                    {lines}
                    {/* top dots */}
                    {createDots(Side.top)}
                    {/* bottom dots */}
                    {createDots(Side.bottom)}
                    {/* left dots */}
                    {createDots(Side.left)}
                    {/* right dots */}
                    {createDots(Side.right)}
                </g>
            </svg>
            <div className="grow"></div>
        </div>
        {(isMobile && isClient) && <div className="h-20" />}
        <div className="flex md:hidden">
            <div className="grow"></div>
            <PillButton text="Restart" onClick={restartPuzzle} />
            <div className="w-2"></div>
            <PillButton text="Delete" onClick={deleteLetter} />
            <div className="w-2"></div>
            <PillButton text="Enter" onClick={submitWord} />
            <div className="grow"></div>
        </div>
        <div className="grow"></div>
    </div >
}