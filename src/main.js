const WebSocketServer = require('uws').Server;

const wss = new WebSocketServer({ port: 3000 });

const START_STATE_LEVERS = [true, false, true, true];
const MAX_ATTEPTS_POWER_OFF = 2;


let currentStateId = 0;
const stateHistory = [
  START_STATE_LEVERS,
];

const ACTIONS = {
  powerOff,
  check,
  default: () => {},
};

wss.on('connection', (ws) => {
  const toggleLeversId = toggleLevers(ws);
  const options = {
    toggleLeversId,
    numberOfAttemptsPowerOff: 0,
  };
  ws.on('message', onMessage.bind(this, ws, options));
});

function powerOff(ws, { stateId }, options) {
  const state = stateHistory[stateId] || [null];
  const isTurnedOff = state.every(elem => elem === false);

  Object.assign(options, { numberOfAttemptsPowerOff: options.numberOfAttemptsPowerOff + 1 });

  if (isTurnedOff) {
    ws.send(JSON.stringify({ newState: 'poweredOff', token: 'Congratulations, you managed, the miracle machine is stopped!' }));
    clearInterval(options.toggleLeversId);
  } else if (options.numberOfAttemptsPowerOff >= MAX_ATTEPTS_POWER_OFF) {
    ws.close(423, 'Exceeded the number of attempts POWER OFF');
  }
}

function check(ws, { stateId, lever1, lever2 }) {
  const state = stateHistory[stateId] || [];
  const isSame = state[lever1] === state[lever2];

  ws.send(JSON.stringify({ action: 'check', lever1, lever2, stateId, same: isSame }));
}

function onMessage(ws, options, message) {
  global.console.log(`received: ${message}`);
  let data = {};

  try {
    data = JSON.parse(message);
  } catch (e) {
    ws.close(400, 'Invalid JSON');
  }

  const action = ACTIONS[data.action] || ACTIONS.default;
  action(ws, data, options);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

function getNewStateLevers() {
  const latestState = stateHistory[stateHistory.length - 1];
  const changeableLever = getRandomInt(0, 3);
  const newState = [...latestState];
  newState[changeableLever] = !newState[changeableLever];

  return { newState, changeableLever };
}

function toggleLevers(ws) {
  const timerId = setInterval(() => {
    const { newState, changeableLever } = getNewStateLevers();
    stateHistory.push(newState);
    currentStateId += 1;

    ws.send(JSON.stringify({ pulled: changeableLever, stateId: currentStateId }));
  }, 1000);

  return timerId;
}
