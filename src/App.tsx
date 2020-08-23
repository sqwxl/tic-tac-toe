import React from 'react';

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from "react-bootstrap/Badge";
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup'
import ToggleButton from 'react-bootstrap/esm/ToggleButton';

import './App.css';



export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
]


enum GameStage {
  Init = 'INIT',
  First = 'FIRST',
  Playing = 'PLAYING',
  Done = 'DONE'
}

enum BoardStatus {
  Undetermined = 'UNDETERMINED',
  Won = 'WON',
  Draw = 'DRAW'
}


interface GameState { status: BoardStatus; winner?: string }
type Board = string[]

interface Moment {
  board: Board;
  turn: 0 | 1;
  gameState: GameState;
}

type Players = [number, number] // [player 1, player 2 (or AI)]
interface State {
  history: Moment[];
  step: number;
  stage: GameStage
  ai: boolean
  players: Players
}


const xoSymbols = ['❌', '⭕']
const xo = ['X', 'O']


function GameSettingsDialog(props: { handleChange: any; players: [number, number]; show: boolean; ai: boolean }) {
  return (
    <Modal show={props.show} backdrop='static' keyboard={false} centered>
      <Modal.Header className="justify-content-center">
        <Modal.Title><h1 className="display-4">TIC-TAC-TOE</h1></Modal.Title>
      </Modal.Header>
      <Modal.Body><h5>Choose game type:</h5>
        <Button disabled variant="primary">Player 1 <Badge variant="light">{xoSymbols[props.players[0]]}</Badge></Button>
        <span> vs. </span>
        <ToggleButtonGroup name="ai-toggle" type="radio" defaultValue={props.ai ? 1 : 0} onChange={(val, e) => props.handleChange({ ai: !!val }, e)}>
          <ToggleButton value={1}>AI</ToggleButton>
          <ToggleButton value={0}>Player 2 <Badge variant="light">{xoSymbols[props.players[1]]}</Badge></ToggleButton>
        </ToggleButtonGroup>
        <br />
        <Button className="mt-1" variant="primary" onClick={e => props.handleChange({ players: [props.players[1], props.players[0]] }, e)}><Badge variant="light">{xoSymbols[props.players[0]]}</Badge> ⇌ <Badge variant="light">{xoSymbols[props.players[1]]}</Badge></Button>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={e => props.handleChange({ stage: GameStage.First }, e)}>Play!</Button>
      </Modal.Footer>
    </Modal >
  )
}

function Square(props: { value: string; onClick: (event: React.MouseEvent<HTMLDivElement>) => void; style?: React.CSSProperties }) {
  let circle = <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" stroke="black"><circle cx="50%" cy="50%" r="49%" /></svg>
  let cross = <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" stroke="black"><line x1="0" y1="0" x2="100%" y2="100%" /><line x1="100%" y1="0" x2="0" y2="100%" /></svg>
  let empty = <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" stroke="none"></svg>
  let symbol = props.value == null ? empty : props.value === xo[0] ? cross : circle
  return (
    <Col className="square" onClick={props.onClick} style={props.style}>{symbol}</Col>
  )
}


function Board(props: { squares: Board; onClick: (n: number) => void; }) {
  function renderSquare() {
    let i = 0
    return function (style?: React.CSSProperties) {
      let idx = i++
      return (<Square value={props.squares[idx]} onClick={() => props.onClick(idx)} style={style} />)
    }
  }
  let square = renderSquare()
  let borderStyle = '1px solid'
  return (
    <Container>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square()}
        {square({ borderLeft: borderStyle, borderRight: borderStyle })}
        {square()}
        <Col></Col>
      </Row>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square({ borderTop: borderStyle, borderBottom: borderStyle })}
        {square({ border: borderStyle })}
        {square({ borderTop: borderStyle, borderBottom: borderStyle })}
        <Col></Col>
      </Row>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square()}
        {square({ borderLeft: borderStyle, borderRight: borderStyle })}
        {square()}
        <Col></Col>
      </Row>
    </Container>
  )
}

const INITIALSTATE: State = {
  history: [
    { board: Array(9), turn: 0, gameState: { status: BoardStatus.Undetermined } }
  ],
  step: 0,
  stage: GameStage.Init,
  ai: true,
  players: [0, 1]
}

class Game extends React.Component<{}, State> {
  aiPlayer: (squares: Board, players: Players) => number | undefined;
  constructor(props: any) {
    super(props)
    this.state = INITIALSTATE
    this.aiPlayer = AI
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidUpdate() {
    // Get AI to play first move if it has X
    if (this.state.stage === GameStage.First && this.state.ai && this.state.players[1] === 0) {
      this.makeMove(this.aiPlayer(this.state.history[0].board, this.state.players), false)
    }
  }

  getGameState(board: Board): GameState {
    // check for 3 in a row
    for (let line of LINES) {
      if (board[line[0]] && board[line[0]] === board[line[1]] && board[line[0]] === board[line[2]]) return { status: BoardStatus.Won, winner: board[line[0]] }
    }
    // check for draw
    if (board.every(v => v != null)) return { status: BoardStatus.Draw }
    return { status: BoardStatus.Undetermined }
  }

  handleChange(state: State, e: Event): void {
    e.preventDefault()
    this.setState(state)
  }

  handleSquareClick(i: number): void {
    this.makeMove(i, true)
  }

  makeMove(i: number | undefined, human: boolean): void {
    if (i == null) return
    let history = this.state.history.slice(0, this.state.step + 1)
    let current = history[this.state.step]
    let squares = [...current.board]
    // reject move if the game is finished
    if (squares[i] || current.gameState.status !== BoardStatus.Undetermined) return
    // record move
    if (human) {
      squares[i] = xo[current.turn]
    } else {
      squares[i] = xo[this.state.players[1]]
    }
    // update game state and app state
    let gameState = this.getGameState(squares)
    history.push({ board: squares, turn: current.turn === 0 ? 1 : 0, gameState: gameState })
    let step = history.length - 1
    let stage = gameState.status !== BoardStatus.Undetermined ? GameStage.Done : GameStage.Playing
    this.setState({
      history: history,
      step: step,
      stage: stage
    }, () => {
      // perform AI move, if needed, after the state has been updated
      if (stage === GameStage.Playing && human && this.state.ai && gameState.status === BoardStatus.Undetermined) {
        const history = this.state.history.slice(0, this.state.step + 1)
        const current = history[this.state.step]
        const squares = [...current.board]
        this.makeMove(this.aiPlayer(squares, this.state.players), false)
      }
    })
  }

  newGame(): void {
    this.setState(INITIALSTATE)
  }

  undo(): void {
    let step = this.state.step
    if (this.state.ai) {
      step -= this.state.history[step - 1].turn === this.state.players[0] ? 1 : 2
    } else {
      step--
    }
    if (step < 0) step = this.state.players[0]
    this.setState({
      step: step,
      stage: GameStage.Playing
    })
  }

  redo(): void {
    let step = this.state.step + (this.state.ai ? 2 : 1)
    if (step >= this.state.history.length - 1) step = this.state.history.length - 1
    this.setState({
      step: step,
    })
  }


  render() {
    const history = this.state.history
    const current = history[this.state.step]
    const squares = current.board
    let alert
    if (current.gameState.status !== BoardStatus.Undetermined) {
      let message
      switch (current.gameState.status) {
        case BoardStatus.Won:
          message = current.gameState.winner + " wins!"
          break
        case BoardStatus.Draw:
          message = 'Draw!'
      }
      alert = <Alert variant='primary'>{message}</Alert>
    }
    let turnMsg
    if (this.state.stage !== GameStage.Done) {
      turnMsg = 'Player ' + (this.state.players[current.turn] + 1) + ' ' + xoSymbols[current.turn]
    } else {
      turnMsg = '-'
    }
    return (
      <Container>
        <GameSettingsDialog handleChange={this.handleChange} players={this.state.players} show={this.state.stage === GameStage.Init} ai={this.state.ai} />
        <Container className="mb-" role="navigation">
          <Nav className="justify-content-center mt-1 mb-4">
            <Nav.Item>
              <Nav.Link onClick={() => this.newGame()}>New Game</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => this.undo()} disabled={this.state.step === 0 || (this.state.players[0] === 1 && this.state.step === 1)}>Undo ↶</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => this.redo()} disabled={history.length === 1 || this.state.step === history.length - 1}>Redo ↷</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link disabled><Badge variant='primary'>Turn: {turnMsg}</Badge></Nav.Link>
            </Nav.Item>
          </Nav>
        </Container>
        <Board squares={squares} onClick={i => this.handleSquareClick(i)} />
        {alert}
      </Container>
    )
  }
}


function App() {
  return (
    <Game />
  );
}


function AI(board: Board, players: Players) {
  const self = xo[players[1]]
  const opponent = xo[players[0]]

  // Determine move, in order of priority (inspired by https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy)

  // case 1: top priority is winning move
  for (let line of LINES) {
    let empty = atari(line, self);
    if (empty.found)
      return empty.value;
  }
  //case 2: blocking winning move
  for (let line of LINES) {
    let empty = atari(line, opponent);
    if (empty.found)
      return empty.value;
  }
  // case 3: setting up a 'fork'
  let selfFork = fork(self, opponent)
  if (selfFork.found)
    return selfFork.value

  // case 4: preventing a 'fork'
  let oppFork = fork(opponent, self)
  if (oppFork.found)
    return oppFork.value

  // case 5: if available: play center
  if (board[4] == null)
    return 4

  const corners = [0, 2, 6, 8]
  // case 6: if opponent is in a corner, play opposite, if free
  for (let [idx, corner] of corners.entries()) {
    if (board[corner] === opponent) {
      let opposite = corners[(idx + 2) % 4]
      if (board[opposite] == null) {
        return opposite
      }
    }
  }

  // case 7: empty corner
  for (let corner of corners) {
    if (board[corner] == null)
      return corner
  }

  // case 8: empty side
  for (let side of [1, 3, 5, 7]) {
    if (board[side] == null)
      return side
  }

  // check for two of a kind
  function atari(line: number[], kind: string): {
    found: boolean;
    value?: number;
  } {
    let kinds = 0;
    let empty = null;
    for (let ele of line) {
      if (board[ele] === kind)
        kinds++;
      if (board[ele] == null)
        empty = ele;
    }
    if (kinds === 2 && empty != null)
      return { found: true, value: empty };
    return { found: false };
  }

  // setting up a 'fork'
  function fork(favor: string, disfavor: string): { found: boolean, value?: number } {
    // empty lines with already one friendly move
    // (checking for some 'self' and no 'opponent' is enough)
    let oneOfThree = LINES.filter(line => line.some(val => board[val] === favor) && !line.some(val => board[val] === disfavor));
    // fork not possible if less than two matches are found
    if (oneOfThree.length < 2) return { found: false }
    // check for overlaps
    for (let [a, lineA] of oneOfThree.entries()) {
      for (let [b, lineB] of oneOfThree.entries()) {
        // reject same line
        if (a === b) continue
        // check for shared empty square
        for (let sq of lineA) {
          if (lineB.includes(sq) && board[sq] == null) {
            return { found: true, value: sq }
          }
        }
      }
    }
    return { found: false }
  }
}


export default App;
