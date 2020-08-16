import React from 'react';

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <Container>
      <Container role="navigation">
        <Nav className="justify-content-center">
          <Nav.Item>
            <Nav.Link>New Game</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link disabled>Undo ↶</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link disabled>Redo ↷</Nav.Link>
          </Nav.Item>
        </Nav>
      </Container>
      <Board />
    </Container>
  );
}

function Board() {
  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col></Col>
        <Col className="square"></Col>
        <Col className="square"></Col>
        <Col className="square"></Col>
        <Col></Col>
      </Row>
    </Container>
  )
}

function Row()

export default App;
