class InputEngine {
    /**
     * A dictionary mapping ASCII key codes to string values describing
     * the action we want to take when that key is pressed.
     */
    bindings = {};

    /**
     * A dictionary mapping actions that might be taken in our game
     * to a boolean value indicating whether that action is currently being performed.
     */
    actions = {};

    listeners = [];

    constructor() { };

    setup() {
        this.bind(38, 'up0');    // up arrow
        this.bind(37, 'left0');  // left arrow
        this.bind(40, 'down0');  // down arrow
        this.bind(39, 'right0'); // right arrow
        this.bind(32, 'bomb0');  // space
        this.bind(18, 'bomb0');  // alt right

        this.bind(87, 'up1');    // w
        this.bind(65, 'left1');  // a
        this.bind(83, 'down1');  // s
        this.bind(68, 'right1'); // d
        this.bind(16, 'bomb1');  // shift left

        this.bind(73, 'up2');    // i
        this.bind(74, 'left2');  // j
        this.bind(75, 'down2');  // j
        this.bind(76, 'right2'); // l
        this.bind(220, 'bomb2'); // \

        this.bind(84, 'up3');    // t
        this.bind(70, 'left3');  // f
        this.bind(71, 'down3');  // g
        this.bind(68, 'right3'); // h
        this.bind(72, 'bomb3');  // alt left

        this.bind(13, 'restart');
        this.bind(27, 'escape');
        this.bind(77, 'mute');
        this.bind(191, 'debugger');

        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    onKeyDown(event) {
        var action = gInputEngine.bindings[event.keyCode];
        if (action) {
            gInputEngine.actions[action] = true;
            event.preventDefault();
        }
        return false;
    }

    actionDown(action) {
        if (action) {
            gInputEngine.actions[action] = true;
        }
        return false;
    }

    onKeyUp(event) {
        var action = gInputEngine.bindings[event.keyCode];
        if (action) {
            gInputEngine.actions[action] = false;

            var listeners = gInputEngine.listeners[action];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    var listener = listeners[i];
                    listener();
                }
            }
            event.preventDefault();
        }
        return false;
    }

    actionUp(action) {
        if (action) {
            gInputEngine.actions[action] = false;

            var listeners = gInputEngine.listeners[action];
            if (listeners) {
                for (var i = 0; i < listeners.length; i++) {
                    var listener = listeners[i];
                    listener();
                }
            }
        }
    }

    /**
     * The bind function takes an ASCII keycode and a string representing
     * the action to take when that key is pressed.
     */
    bind(key, action) {
        this.bindings[key] = action;
    }

    addListener(action, listener) {
        this.listeners[action] = this.listeners[action] || new Array();
        this.listeners[action].push(listener);
    }


    removeListener(action) {
        this.listeners[action] = new Array();
    }

    removeAllListeners() {
        this.listeners = [];
    }
}

gInputEngine = new InputEngine();
