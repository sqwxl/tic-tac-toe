import React, { useState } from 'react';

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from "react-bootstrap/Badge";
import Alert from 'react-bootstrap/Alert'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
// import ButtonGroup from 'react-bootstrap/ButtonGroup'
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

interface State {
  history: Squares[];
  step: number;
  playerX: boolean;
  gameState: { status: string, winner?: string };
  stage: Stage
  ai: boolean
  players: [string, string]
}


const INITIALSTATE: State = {
  history: [{ squares: [...Array(9)] }],
  step: 0,
  playerX: true,
  gameState: { status: GameStatus.Game },
  stage: Stage.Start,
  ai: true,
  players: ['❌', '⭕']
}


function GameSettingsDialog(props: { handleChange: any; players: [string, string]; show: boolean}) {
  // let [show, setShow] = useState(true)
  let [aiToggle, setAIToggle] = useState(true)
  //let [players, setP1IsX] = useState(['❌', '⭕'])

  /* let swap = () => {
    setP1IsX([players[1], players[0]])
  } */

  let playerChoose = function(val: boolean, e: Event) {
    console.log(arguments)
    setAIToggle(val)
    props.handleChange({ ai: val }, e)
  }
  return (
    <Modal show={props.show} backdrop='static' keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>TIC-TAC-TOE</Modal.Title>
      </Modal.Header>
      <Modal.Body><p>Choose game type:</p>
        <Form>
          <Form.Row className="justify-content-between">
            <Form.Group>
              <Button disabled variant="primary">Player 1 <Badge variant="light">{props.players[0]}</Badge></Button><span> vs. </span><ToggleButtonGroup name="ai-toggle" defaultValue={aiToggle} onChange={playerChoose}>
                <ToggleButton value={true}>AI</ToggleButton>
                <ToggleButton value={false}>Player 2 <Badge variant="light">{props.players[1]}</Badge></ToggleButton>
              </ToggleButtonGroup>
            </Form.Group>
            <Form.Group>
              <Button variant="success" onClick={e => props.handleChange({ stage: Stage.Playing }, e)}>Play!</Button>
            </Form.Group>
          </Form.Row>
          <Form.Row>
            <Button variant="primary" onClick={e => props.handleChange({ players: [props.players[1], props.players[0]]}, e)}><Badge variant="light">{props.players[0]}</Badge> ⇌ <Badge variant="light">{props.players[1]}</Badge></Button>
          </Form.Row>
        </Form>
      </Modal.Body>
    </Modal >
  )
}

function Square(props: { value: string; onClick: (event: React.MouseEvent<HTMLDivElement>) => void; }) {
  return (
    <Col className="square" onClick={props.onClick}>{props.value}</Col>
  )
}


function Board(props: { squares: Squares['squares']; onClick: (n: number) => void; }) {
  function renderSquare() {
    let i = 0
    return function () {
      let idx = i++
      return (<Square value={props.squares[idx]} onClick={() => props.onClick(idx)} />)
    }
  }
  let square = renderSquare()
  return (
    <Container fluid>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square()}
        {square()}
        {square()}
        <Col></Col>
      </Row>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square()}
        {square()}
        {square()}
        <Col></Col>
      </Row>
      <Row className="board-row justify-content-center">
        <Col></Col>
        {square()}
        {square()}
        {square()}
        <Col></Col>
      </Row>
    </Container>
  )
}


class Game extends React.Component<{}, State> {
  constructor(props: any) {
    super(props)
    this.state = INITIALSTATE
    this.handleChange = this.handleChange.bind(this)
  }

  ai(opponent: string) {
    const squares = this.state.history[this.state.step].squares
    const self = opponent === 'X' ? 'O' : 'X';
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
    return {
      play(): number | undefined {
        // first move (center)
        if (squares.every(v => !v))
          return 4;
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
    };
  }

  handleChange(state: object, e: Event): void {
    e.preventDefault()
    this.setState(state)
  }

  handleSquareClick(i: number): void {
    this.makeMove(i)
  }

  callAi(ai: {
    play(): number | undefined;
  }) {
    if (this.state.ai) {
      let move = ai.play()
      if (move != null) this.makeMove(move)
    }
  }

  makeMove(i: number): void {
    const history = this.state.history.slice(0, this.state.step + 1)
    const current = history[this.state.step]
    const squares = [...current.squares]
    if (squares[i] || this.state.gameState.status !== GameStatus.Game) return
    squares[i] = this.state.playerX ? 'X' : 'O';
    history.push({ squares: squares })
    const step = history.length - 1
    const gameState = this.getGameState(squares)

    this.setState({
      history: history,
      step: step,
      playerX: (step % 2 === 0),
      gameState: gameState
    }, () => {
      let ai = this.ai(squares[i])
      this.callAi(ai)
    })
  }

  newGame(): void {
    this.setState(INITIALSTATE)
  }

  undo(): void {
    const step = this.state.step - (this.state.ai ? 2 : 1) || 0
    const gameState = this.getGameState(this.state.history[step].squares)
    this.setState({
      step: step,
      playerX: !!(step % 2 === 0),
      gameState: gameState
    })
  }

  redo(): void {
    let step = this.state.step + (this.state.ai ? 2 : 1)
    if (step >= this.state.history.length - 1) step = this.state.history.length - 1
    const gameState = this.getGameState(this.state.history[step].squares)
    this.setState({
      step: step,
      playerX: !!(step % 2 === 0),
      gameState: gameState
    })
  }

  getGameState(squares: Squares['squares']): { status: string, winner?: string } {
    //if (this.state.history.length < 3) return null
    for (let line of LINES) {
      if (squares[line[0]] && squares[line[0]] === squares[line[1]] && squares[line[0]] === squares[line[2]]) return { status: GameStatus.Won, winner: squares[line[0]] }
    }
    if (squares.every(v => v != null)) return { status: GameStatus.Draw }
    return { status: GameStatus.Game }
  }

  render() {
    const history = this.state.history
    const current = history[this.state.step]
    const squares = current.squares
    let alert
    if (this.state.gameState.status !== GameStatus.Game) {
      let message
      switch (this.state.gameState.status) {
        case GameStatus.Won:
          message = this.state.gameState.winner + " wins!"
          break
        case GameStatus.Draw:
          message = 'Draw!'
      }
      alert = <Alert variant='primary'>{message}</Alert>
    }
    return (
      <Container fluid >
        <GameSettingsDialog handleChange={this.handleChange} players={this.state.players} show={this.state.stage === Stage.Start} />
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
              <Nav.Link disabled><Badge variant='primary'>Turn: {this.state.playerX ? 'X' : 'O'}</Badge></Nav.Link>
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
