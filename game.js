module.exports.Dice = class Dice {
    constructor(edges) {
        this.edges = (edges);
    }

    get roll() {
        // return 2;
        return Math.floor((Math.random() * this.edges) + 1);
    }
};

module.exports.Event = class Event {
    constructor(sender) {
        if (sender instanceof Object !== true) {
            throw new Exception('sender must be instance of Object');
        }
        this.sender = sender;
    }
};

module.exports.ResultEvent = class ResultEvent extends this.Event {
    constructor(sender, result) {
        super(result);
        this.sender = sender;
    }
};

module.exports.DiceRolledEvent = class DiceRolledEvent extends this.Event {
};

module.exports.PlayerJoinedEvent = class PlayerJoinedEvent extends this.Event {
};

module.exports.StartGameEvent = class StartGameEvent extends this.Event {
};

module.exports.StateChangedEvent = class StateChangedEvent extends this.Event {
};


/**
 * Base state
 */
module.exports.State = class State {
    /**
     * @param {Object} context context object
     */
    constructor(context) {
        this.context = context;
    }
    /**
     * 
     * @param {Event} event 
     */
    handle(event) {}

    onStateIn() {
        console.info(`${this.context.constructor.name} in ${this.constructor.name}`);
        const event = new module.exports.StateChangedEvent(this.context);
        this.context.notify(event);
    }

    onStateOut() {
        console.info(`${this.constructor.name} out`);
    }

    get error() {
        console.error(`${this.context.constructor.name}: you can't do this action on ${this.constructor.name}`);
    }
};


module.exports.FSM = class FSM {
    constructor() {
        this.activeState = null;
    }

    setContext(context) {
        this.context = context;
    }

    setState(state) {
        this.activeState = state;
        console.info(`${this.context.name} set ${this.activeState.name}`);
    }

    update(event) {
        console.info(`${this.context.name} update ${this.activeState.name}`);
        if (this.activeState !== null) {
            const handler = this.activeState.bind(this.context);
            handler(event);
        }
    }
};

/**
 * Object with state
 */
module.exports.OWS = class OWS {
    setState(state) {
        if (typeof this.state !== 'undefined' && this.state !== null) {
            this.state.onStateOut();
        }
        this.state = state;
        this.state.onStateIn();
    }
};

module.exports.Player = class Player {
    /**
     * @param {string} name
     * @param {Unit[]} units
     * @param {EventManager} eventManager
     */
    constructor (name, units, fsm, eventManager) {
        this.name = name;
        this.units = units;
        units.forEach(unit => unit.addPlayer(this));
        this.eventManager = eventManager;
        this.fsm = fsm;
        fsm.setContext(this);
        fsm.setState(this.waitingGame);
        const handler = this.update.bind(this);
        eventManager.subscribe('StateChangedEvent', handler);
    }

    update(event) {
        console.info(`${this.name} update ${this.fsm.activeState.name}`);
        this.fsm.update(event);
    }

    notify(event) {
        this.eventManager.notify(event);
    }

    waitingGame(event) {
        console.info(`${this.name} waiting game handle event GameStarted, ${event.sender.state.constructor.name} given`);
        const sender = event.sender;
        if (sender.state.constructor.name === 'GameStarted') {
            this.joinToGame(event.sender);
            this.fsm.setState(this.idle);
            const eventJoined = new module.exports.PlayerJoinedEvent(this);
            this.notify(eventJoined);
        }
    }

    joinToGame(game) {
        this.game = game;
        console.info(`${this.name} join to game`);
        game.addPlayer(this);
    }

    takeStep() {

    }

    idle(event) {
        console.info(`${this.name} idle handle event RoundStarted, StepStarted, ${event.sender.state.constructor.name} given`);
        if (event.sender.state.constructor.name === 'RoundStarted') {
            this.units.forEach(unit => {
                unit.startRound();
                unit.rollSpeed();
                const eventRolled = new module.exports.DiceRolledEvent(this);
                this.notify(eventRolled);
            });
        }
        if (this.game.state.constructor.name === 'StepStarted') {
            this.units.forEach(unit => {
                if (this.game.activeUnit === unit) {
                    unit.rollAttack();
                } else {
                    unit.rollDefense();
                }
            });
        }
    }
};

module.exports.UnitState = class UnitState extends this.State {

    rollSpeed() {
        console.error(`${this.context.name} rollSpeed: ${this.error}`);
    }

    rollAttack() {
        console.error(`${this.context.name} rollAttack: ${this.error}`);
    }

    rollDefense() {
        console.error(`${this.context.name} rollDefense: ${this.error}`);
    }

    attack() {
        console.error(`${this.context.name} attack: ${this.error}`);
    }

    takeDamage(property) {
        console.error(`${this.context.name} takeDamage: ${this.error}`);
    }

    skip() {
        console.error(`${this.context.name} skip: ${this.error}`);
    }
};

module.exports.UnitIdle = class UnitIdle extends this.UnitState {
    handle(event) {
        if (event.constructor.name === 'RoundStarted') {
            this.startRound();
        }
    }

    rollAttack() {
        const dice = this.context.game.dice;
        const result = dice.roll;
        this.context.speed = result;
        console.info(`${this.context.name} rolled dice for attack with result ${this.context.speed}`);
        const event = new module.exports.DiceRolledEvent(this.context);
        this.context.notify(event);
        this.context.setState(new module.exports.InAttack(this.context));
    }

    rollDefense() {
        const dice = this.context.game.dice;
        const result = dice.roll;
        this.context.speed = result;
        console.info(`${this.context.name} rolled dice for defense with result ${result}`);
        const event = new module.exports.DiceRolledEvent(this.context);
        this.context.notify(event);
        this.context.setState(new module.exports.InDefense(this.context));
    }

    startRound() {
        this.context.speed = null;
        this.context.setState(new module.exports.InStartRound(this.context));
    }
};

module.exports.InStartRound = class InStartRound extends this.UnitState {
    rollSpeed() {
        const dice = this.context.game.dice;
        const result = dice.roll;
        this.context.speed = result;
        console.info(`${this.context.name} rolled dice for speed with result ${this.context.speed}`);
        this.context.setState(new module.exports.UnitIdle(this.context));
    }

    startRound() {
        this.context.speed = null;
    }
};

module.exports.InAttack = class InAttack extends this.UnitState {
    attack() {
        const targetUser = this.context.game.units.filter(unit => this.context.unit !== unit).shift();
        this.context.setTarget(targetUser);
        this.context.attack();
    }

    skip() {
        this.context.rolledAttack = null;
    }
};

module.exports.InDefense = class InDefense extends this.UnitState {
    takeDamage(property) {
        if (this.context.allowed.indexOf(property) === -1) {
            console.error(`You can't attack ${property}`);
            return;
        }
        // if last
        if (this.targetUnit[property] === 1) {
            // check values of other properties
            const moreThanOne = allowed.filter(property => this[property] > 1).length > 0;
            if (moreThanOne) {
                console.error(`You can't attack ${property}`);
                return this[property];
            }
        }
        // return value of increased property
        return --this[property];
    }
};

/**
 * Player class
 * Notify event only after changing Player state
 * 
 * @property string name
 * @property Number attack
 * @property Number defense
 * @property Number|null speed
 * @property EventManager eventManager
 * @property Game game
 * @property Number rolledAttack
 * @property Number rolledDefense
 */
module.exports.Unit = class Unit extends this.OWS {
    /**
     * @param string name
     * @param Number attack
     * @param Number defense
     * @param EventManager eventManager
     */
    constructor(name, attack, defense, eventManager) {
        super();
        this.name = name;
        this.attack = attack;
        this.defense = defense;
        this.speed = null;
        this.eventManager = eventManager;
        this.player = null;
        this.game = null;
        this.rolledAttack = null;
        this.rolledDefense = null;
        this.targetUnit = null;
        this.allowed = ['attack', 'defense'];
        this.setState(new module.exports.UnitIdle(this));
        const handler = this.handle.bind(this);
        eventManager.subscribe('StateChangedEvent', handler);
    }

    notify(event) {
        this.eventManager.notify(event);
    }

    handle(event) {
        console.info(`${this.constructor.name} handle ${event.constructor.name}`);
        this.state.handle(event);
    }

    addPlayer(player) {
        this.player = player;
    }

    roll() {
        this.state.roll();
    }

    setTarget(unit) {
        this.targetUnit = unit;
    }

    rollSpeed() {
        this.state.rollSpeed();
    }
    rollAttack() {
        this.state.rollAttack();
    }
    rollDefense() {
        this.state.rollDefense();
    }

    attack() {
        this.state.attack();
    }

    startRound() {
        this.state.startRound();
    }

    skip() {
        this.state.skip();
    }

    takeDamage(property) {
        this.state.takeDamage(property);
    }
}

module.exports.EventManager = class EventManager {
    constructor() {
        this.listeners = {};
    }

    notify(event) {
        console.info(`notify ${event.constructor.name}`);

        const eventType = event.constructor.name;
        console.log(`listeners ${Object.keys(this.listeners)}`);
        if (typeof this.listeners[eventType] === 'undefined') {
            return;
        }
        this.listeners[eventType].forEach(callback => callback(event));
    }

    /**
     * Add listeners to EventManager
     * @param {string} eventType name of event class
     * @param {Listener} callback listeners
     */
    subscribe(eventType, callback) {
        if (typeof this.listeners[eventType] === 'undefined') {
            this.listeners[eventType] = [];
        }
        // console.info(`Subscribe to ${eventType} callback ${callback}`);
        if (this.listeners[eventType].indexOf(callback) === -1) {
            this.listeners[eventType].push(callback);
        }
    }

    /**
     * Remove listeners from EventManager
     * @param {string} eventType name of event class
     * @param {Listener} callback 
     */
    unsubscribe(eventType, callback) {
        if (typeof this.listeners[eventType] === 'undefined') {
            return;
        }
        if (this.listeners[eventType].indexOf(callback) !== -1) {
            this.listeners[eventType].splice(this.listeners[eventType].indexOf(callback), 1);
        }
    }
};

module.exports.GameHandler = class GameHandler {
    constructor(game) {
        this.game = game;
    }

    handle(event) {
        const currentState = this.game.state;
        if (state.handle) {
            const handler = state.handle.bind(state);
            handler(event);
        }
    }

    GameStarted(event) {
        switch (event) {
            
        }
    }
}

module.exports.GameState = class GameState extends this.State {
    startGame() {
        console.error(`${this.context.name} startGame: ${this.error}`);
    }

    addPlayer(player) {
        console.error(`${this.context.name} addPlayer: ${this.error}`);
    }

    startRound() {
        console.error(`${this.context.name} startRound: ${this.error}`);
    }

    resetRound() {
        console.error(`${this.context.name} resetRound: ${this.error}`);
    }

    startStep() {
        console.error(`${this.context.name} startStep: ${this.error}`);
    }

    takeStep() {
        console.error(`${this.context.name} takeStep: ${this.error}`);
    }
};

module.exports.GameStarted = class GameStarted extends this.GameState {
    // event mapping
    handle(event) {
        console.info(`${this.constructor.name} handler`);
        switch (event.constructor.name) {
            case 'PlayerJoinedEvent':
                const playersCount = this.context.players.length;
                console.log(`${playersCount}`);
                if (playersCount >= this.context.MIN_PLAYERS) {
                    this.startRound();
                }
                break;
            case 'StartRound':
                this.startRound();
                break;
            default:
                break;
        }
    }

    addPlayer(player) {
        const game = this.context;
        if (game.players.indexOf(player) !== -1) {
            console.warn(`${player.name} already added`);
            return;
        }
        game.players.push(player);
        // add player units to the game
        game.units.push.apply(game.units, player.units);
        // add game to units
        player.units.forEach(unit => unit.game = game);
        console.info(`${player.name} has joined to game`);
    }

    startRound() {
        const game = this.context;
        const playersCount = game.players.length;
        if (playersCount < game.MIN_PLAYERS) {
            console.warn(`Game required ${game.MIN_PLAYERS} players ${playersCount} joined`);
            return;
        }
        game.setState(new module.exports.RoundStarted(game));
    }
};

module.exports.RoundStarted = class RoundStarted extends this.GameState {
    // event mapping
    handle(event) {
        console.info(`${this.constructor.name} handler`);
        switch (event.constructor.name) {
            case 'DiceRolledEvent':
                this.startStep();
                break;
            default:
                break;
        }
    }

    onStateIn() {
        this.context.round++;
        this.context.activeUnit = null;
        console.info(`Round ${this.context.round} started`);
        module.exports.State.prototype.onStateIn.call(this);
    }

    /**
     * transitions to StepStarted
     */
    startStep() {
        const units = this.context.units;
        const unitsWithSpeed = units.filter(unit => {
            console.info(`${unit.name}: have speed ${unit.speed}`);
            return unit.speed !== null;
        });
        if (unitsWithSpeed.length < units.length) {
            console.warn(`Can't start a step if some units have no speed`);
            return;
        }
        units.sort((unitA, unitB) => unitB.length - unitA.length);
        /**
         * @TODO
         * refactor for multiple units
         */
        const sameSpeed = units.reduce((carry, unit, index) => {
            if (index === 0) {
                return carry;
            }
            return carry || unit.speed === units[index - 1].speed;
        }, false);
        if (sameSpeed) {
            this.resetRound();
            console.warn(`Units have the same speed`);
        }
        this.context.activeUnit = 0;
        this.context.setState(new module.exports.StepStarted(this.context));
    }

    /**
     * transition to RoundStarted state
     */
    resetRound() {
        // reset speed
        this.context.units.forEach(unit => unit.speed = null);
        this.context.round--;
        console.info(`Reset ${this.context.round}`);
        this.context.setState(new module.exports.RoundStarted(this.context));
    }
};
/**
 * Game state
 */
module.exports.StepStarted = class StepStarted extends this.GameState {
    /**
     * wait attack and stay on this state
     */
    waitingAttack() {
        if (this.context.activeUnit.rollAttack === null) {
            this.step();
        }
    }

    /**
     * transition to Stepped state
     */
    step() {
        this.context.setState(new module.exports.Stepped(this.context));
    }
};

module.exports.Stepped = class Stepped extends this.GameState {
    startStep() {
        this.context.activeUnit = units[0];
        if (this.context.units.indexOf(this.context.activeUnit) === (this.context.units.length - 1)) {
            this.context.setState(new module.exports.StepStarted(this.context));
        } else {
            console.warn(`${this.context.activeUnit.name} is latest you should start new round`);
        }
    }

    endRound() {
        console.warn(`Round ${this.context.round} ended`);
        this.context.setState(new module.exports.RoundStarted(this.context));
    }

    onStateOut() {
        ParentClass.prototype.onStateIn.apply();
        this.context.activeUnit++;
    }
}

module.exports.GameHandler = class GameHandler {
    constructor(fsm) {
        this.fsm = fsm;
    }
};

module.exports.Game = class Game extends this.OWS {
    constructor(dice, eventManager) {
        super();
        this.players = [];
        this.units = [];
        this._activeUnit = null;
        this.eventManager = eventManager;
        this.dice = dice;
        this.round = 0;
        this.MIN_PLAYERS = 2;
        const handler = this.handle.bind(this);
        eventManager.subscribe('PlayerJoinedEvent', handler);
        eventManager.subscribe('DiceRolledEvent', handler);
        this.setState(new module.exports.GameStarted(this));
    }

    // process events in states
    handle(event) {
        console.info(`${this.constructor.name} handle event ${event.constructor.name}`);
        if (this.state.handle) {
            this.state.handle(event);
        }
    }

    get activeUnit() {
        if (this._activeUnit !== null) {
            return this.units[this._activeUnit];
        }
        return this._activeUnit;
    }

    set activeUnit(val) {
        this._activeUnit = val;
    }

    notify(event) {
        if (this.eventManager !== null) {
            this.eventManager.notify(event);
        }
    }

    startGame() {
        this.state.startGame();
    }

    addPlayer(player) {
        this.state.addPlayer(player);
    }

    startRound() {
        this.state.startRound();
    }

    resetRound() {
        this.state.resetRound();
    }

    chooseFirstPlayer() {
        this.state.chooseFirstPlayer();
    }

    startFirstStep() {
        this.state.startFirstStep();
    }
};
