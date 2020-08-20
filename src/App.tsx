import React from 'react';

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from "react-bootstrap/Badge";
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
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

export interface Squares {
  squares: string[]
}

enum Stage {
  Start = 'START',
  Playing = 'PLAYING',
  Done = 'DONE'
}

enum GameStatus {
  Game = 'GAME',
  Won = 'WON',
  Draw = 'DRAW'
}

interface GameState { status: GameStatus; winner?: string }

interface History {
  squares: string[];
  gameState: GameState
}

interface State {
  history: History[];
  step: number;
  // playerX: boolean;
  stage: Stage
  ai: boolean
  players: [number, number]
}


const xoSymbols = ['❌', '⭕']
const xo = ['X', 'O']


function GameSettingsDialog(props: { handleChange: any; players: [number, number]; show: boolean; ai: boolean }) {
  return (
    <Modal show={props.show} backdrop='static' keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>TIC-TAC-TOE</Modal.Title>
      </Modal.Header>
      <Modal.Body><p>Choose game type:</p>
        <Form>
          <Form.Row className="justify-content-between">
            <Form.Group>
              <Button disabled variant="primary">Player 1 <Badge variant="light">{xoSymbols[props.players[0]]}</Badge></Button>
              <span> vs. </span>
              <ToggleButtonGroup name="ai-toggle" type="radio" defaultValue={props.ai ? 1 : 0} onChange={(val, e) => props.handleChange({ ai: !!val }, e)}>
                <ToggleButton value={1}>AI</ToggleButton>
                <ToggleButton value={0}>Player 2 <Badge variant="light">{xoSymbols[props.players[1]]}</Badge></ToggleButton>
              </ToggleButtonGroup>
            </Form.Group>
            <Form.Group>
              <Button variant="success" onClick={e => props.handleChange({ stage: Stage.Playing }, e)}>Play!</Button>
            </Form.Group>
          </Form.Row>
          <Form.Row>
            <Button variant="primary" onClick={e => props.handleChange({ players: [props.players[1], props.players[0]] }, e)}><Badge variant="light">{xoSymbols[props.players[0]]}</Badge> ⇌ <Badge variant="light">{xoSymbols[props.players[1]]}</Badge></Button>
          </Form.Row>
        </Form>
      </Modal.Body>
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


function Board(props: { squares: Squares['squares']; onClick: (n: number) => void; }) {
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
    { squares: Array(9), gameState: { status: GameStatus.Game } }
  ],
  step: 0,
  stage: Stage.Start,
  ai: true,
  players: [0, 1]
}

function AI() {
  return {
    play(players: [number, number], squares: string[]) {
      const self = xo[players[1]]
      const opponent = xo[players[0]]
      // check for two of a kind
      function atari(line: number[], kind: string): {
        found: boolean;
        value?: number;
      } {
        let kinds = 0;
        let empty = null;
        for (let ele of line) {
          if (squares[ele] === kind)
            kinds++;
          if (squares[ele] == null)
            empty = ele;
        }
        if (kinds === 2 && empty != null)
          return { found: true, value: empty };
        return { found: false };
      }

      // first move (random corner)
      if (squares.every(v => !v))
        return 0 + 2 * Math.round(Math.random() * 4);

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
      // case 3: preparing for win, ideally setting up a 'double'
      // empty lines with already one move
      let oneOfThree = LINES.filter(line => line.some(val => squares[val] === self) && !line.some(val => squares[val] === opponent));
      if (oneOfThree.length) {
        return oneOfThree[0].filter(val => squares[val] == null)[0];
      }
      // empty lines
      let emptyLines = LINES.filter(line => line.every(val => squares[val] === null));
      if (emptyLines.length) {
        return emptyLines[0][0];
      }
      // case 4: play anywhere (or nowhere)
      for (let [idx, square] of squares.entries()) {
        if (square == null)
          return idx;
      }
    }
  }
}

class Game extends React.Component<{}, State> {
  aiPlayer: { play(players: [number, number], squares: string[]): number | undefined; };
  constructor(props: any) {
    super(props)
    this.state = INITIALSTATE
    this.aiPlayer = AI()
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillUpdate() {
    if (this.state.ai && this.state.step === 0 && this.state.players[1] === 0) {
      const history = this.state.history.slice(0, this.state.step + 1)
      const current = history[this.state.step]
      const squares = [...current.squares]
      this.makeMove(this.aiPlayer.play(this.state.players, squares), false)
    }
  }

  getGameState(squares: Squares['squares']): GameState {
    for (let line of LINES) {
      if (squares[line[0]] && squares[line[0]] === squares[line[1]] && squares[line[0]] === squares[line[2]]) return { status: GameStatus.Won, winner: squares[line[0]] }
    }
    if (squares.every(v => v != null)) return { status: GameStatus.Draw }
    return { status: GameStatus.Game }
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
    let squares = [...current.squares]
    if (squares[i] || current.gameState.status !== GameStatus.Game) return
    if (human) {
      squares[i] = xo[this.state.step % 2]
    } else {
      squares[i] = xo[this.state.players[1]]
    }
    let gameState = this.getGameState(squares)
    history.push({ squares: squares, gameState: gameState })
    let step = history.length - 1
    this.setState({
      history: history,
      step: step
    }, () => {
      if (human && this.state.ai && gameState.status === GameStatus.Game) {
        const history = this.state.history.slice(0, this.state.step + 1)
        const current = history[this.state.step]
        const squares = [...current.squares]
        this.makeMove(this.aiPlayer.play(this.state.players, squares), false)
      }
    })
  }

  newGame(): void {
    this.setState(INITIALSTATE)
  }

  undo(): void {
    const step = this.state.step - (this.state.ai ? 2 : 1) || 0
    // const gameState = this.getGameState(this.state.history[step].squares)
    this.setState({
      step: step,
    })
  }

  redo(): void {
    let step = this.state.step + (this.state.ai ? 2 : 1)
    if (step >= this.state.history.length - 1) step = this.state.history.length - 1
    // const gameState = this.getGameState(this.state.history[step].squares)
    this.setState({
      step: step,
    })
  }


  render() {
    const history = this.state.history
    const current = history[this.state.step]
    const squares = current.squares
    let alert
    if (current.gameState.status !== GameStatus.Game) {
      let message
      switch (current.gameState.status) {
        case GameStatus.Won:
          message = current.gameState.winner + " wins!"
          break
        case GameStatus.Draw:
          message = 'Draw!'
      }
      alert = <Alert variant='primary'>{message}</Alert>
    }
    return (
      <Container>
        <GameSettingsDialog handleChange={this.handleChange} players={this.state.players} show={this.state.stage === Stage.Start} ai={this.state.ai} />
        <Container role="navigation">
          <Nav className="justify-content-center">
            <Nav.Item>
              <Nav.Link onClick={() => this.newGame()}>New Game</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => this.undo()} disabled={this.state.step === 0}>Undo ↶</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link onClick={() => this.redo()} disabled={history.length === 1 || this.state.step === history.length - 1}>Redo ↷</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link disabled><Badge variant='primary'>Turn: {xoSymbols[this.state.step % 2]} (Player {this.state.ai ? '1' : this.state.players[this.state.step % 2] + 1})</Badge></Nav.Link>
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


export default App;
