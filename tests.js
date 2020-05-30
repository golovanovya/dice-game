const gamemodule = require('./game');

// test dice
const edges = 6;
const dice = new gamemodule.Dice(edges);
for (let i = 0; i <= 1000; i++) {
    const rollResult = dice.roll;
    if (rollResult < 1 || rollResult > edges) {
        throw new Exception(`wrong dice value ${rollResult}`);
    }
    // console.error(dice.roll);
}


// event manager
const channel = new gamemodule.EventManager();

const controller1 = new gamemodule.FSM();
const controller2 = new gamemodule.FSM();
const unit1 = new gamemodule.Unit('unit1', 3, 2, channel);
const player1 = new gamemodule.Player('player1', [unit1], controller1, channel);
const unit2 = new gamemodule.Unit('unit2', 2, 3, channel);
const player2 = new gamemodule.Player('player2', [unit2], controller2, channel);

// // test player
// const player1 = new gamemodule.Unit('unit1', 3, 2, controller1, channel);
// const player2 = new gamemodule.Unit('unit2', 3, 2, controller2, channel);
// player1.update();
// player2.update();
let i = 0;
const callback = (event) => {
    console.log(i++);
    if (event.sender.state.constructor.name === 'GameStarted') {
        // player1.joinToGame(event.sender);
        // player2.joinToGame(event.sender);
    }
    if (event.sender.state.constructor.name === 'RoundStarted') {
        // console.log(event.sender);
    }
};
channel.subscribe('StateChangedEvent', callback);

// // Game
const game = new gamemodule.Game(dice, channel);
// setTimeout(() => console.log(game), 1000);
// player1.joinToGame(game);
// player2.joinToGame(game);