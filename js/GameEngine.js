class GameEngine {
    tileSize = 32;
    tilesX = 17;
    tilesY = 13;
    size =  {};
    fps = 50;
    playersCount = 2; /* 1 - 2 */
    bonusesPercent = 5;

    stage = null;
    menu = null;
    players = [];
    bots = [];
    tiles = [];
    bombs = [];
    bonuses = [];

    playerBoyImg = null;
    playerGirlImg = null;
    playerGirl2Img = null;
    tilesImgs = {};
    bombImg = null;
    fireImg = null;
    bonusesImg = null;

    playing = false;
    mute = false;
    soundtrackLoaded = false;
    soundtrackPlaying = false;
    soundtrack = null;

    constructor() {
        this.size = {
            w: this.tileSize * this.tilesX,
            h: this.tileSize * this.tilesY
        };

        this.startingPlayerPositions = [
            {x: 1, y: 1},
            {x: 1, y: this.tilesY - 2},
            {x: this.tilesX - 2, y: 1},
            {x: this.tilesX - 2, y: this.tilesY - 2}
        ]
    }

    load() {
        // Init canvas
        this.stage = new createjs.Stage("canvas");
        this.stage.enableMouseOver();

        // Load assets
        var queue = new createjs.LoadQueue();
        var that = this;
        queue.addEventListener("complete", function() {
            that.playerBoyImg = queue.getResult("playerBoy");
            that.playerGirlImg = queue.getResult("playerGirl");
            that.playerGirl2Img = queue.getResult("playerGirl2");
            that.tilesImgs.grass = queue.getResult("tile_grass");
            that.tilesImgs.wall = queue.getResult("tile_wall");
            that.tilesImgs.wood = queue.getResult("tile_wood");
            that.bombImg = queue.getResult("bomb");
            that.fireImg = queue.getResult("fire");
            that.bonusesImg = queue.getResult("bonuses");
            that.setup();
        });
        queue.loadManifest([
            {id: "playerBoy", src: "img/george.png"},
            {id: "playerGirl", src: "img/betty.png"},
            {id: "playerGirl2", src: "img/betty2.png"},
            {id: "tile_grass", src: "img/tile_grass.png"},
            {id: "tile_wall", src: "img/tile_wall.png"},
            {id: "tile_wood", src: "img/tile_wood.png"},
            {id: "bomb", src: "img/bomb.png"},
            {id: "fire", src: "img/fire.png"},
            {id: "bonuses", src: "img/bonuses.png"}
        ]);

        createjs.Sound.addEventListener("fileload", this.onSoundLoaded);
        createjs.Sound.alternateExtensions = ["mp3"];
        createjs.Sound.registerSound("sound/bomb.ogg", "bomb");
        createjs.Sound.registerSound("sound/game.ogg", "game");

        // Create menu
        this.menu = new Menu();
    }

    setup() {
        if (!gInputEngine.bindings.length) {
            gInputEngine.setup();
        }

        this.bombs = [];
        this.tiles = [];
        this.bonuses = [];

        // Draw tiles
        this.drawTiles();
        this.drawBonuses();

        this.spawnPlayers();
        this.spawnBots();

        // Toggle sound
        gInputEngine.addListener('mute', this.toggleSound);
        gInputEngine.addListener('debugger', () => {debugger});

        // Restart listener
        // Timeout because when you press enter in address bar too long, it would not show menu
        setTimeout(function() {
            gInputEngine.addListener('restart', function() {
                if (gGameEngine.playersCount == 0) {
                    gGameEngine.menu.setMode('single');
                } else {
                    gGameEngine.menu.hide();
                    gGameEngine.restart();
                }
            });
        }, 200);

        // Escape listener
        gInputEngine.addListener('escape', function() {
            if (!gGameEngine.menu.visible) {
                gGameEngine.menu.show();
            }
        });

        // Start loop
        if (!createjs.Ticker.hasEventListener('tick')) {
            createjs.Ticker.addEventListener('tick', gGameEngine.update);
            createjs.Ticker.setFPS(this.fps);
        }

        if (gGameEngine.playersCount > 0) {
            if (this.soundtrackLoaded) {
                this.playSoundtrack();
            }
        }

        if (!this.playing) {
            this.menu.show();
        }
    }

    onSoundLoaded(sound) {
        if (sound.id == 'game') {
            gGameEngine.soundtrackLoaded = true;
            if (gGameEngine.playersCount > 0) {
                gGameEngine.playSoundtrack();
            }
        }
    }

    playSoundtrack() {
        if (!gGameEngine.soundtrackPlaying) {
            gGameEngine.soundtrack = createjs.Sound.play("game", "none", 0, 0, -1);
            gGameEngine.soundtrack.setVolume(1);
            gGameEngine.soundtrackPlaying = true;
        }
    }

    update() {
        // Player
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            player.update();
        }

        // Bots
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            var bot = gGameEngine.bots[i];
            bot.update();
        }

        // Bombs
        for (var i = 0; i < gGameEngine.bombs.length; i++) {
            var bomb = gGameEngine.bombs[i];
            bomb.update();
        }

        // Menu
        gGameEngine.menu.update();

        // Stage
        gGameEngine.stage.update();
    }

    drawTiles() {
        for (var i = 0; i < this.tilesY; i++) {
            for (var j = 0; j < this.tilesX; j++) {
                if ((i == 0 || j == 0 || i == this.tilesY - 1 || j == this.tilesX - 1)
                    || (j % 2 == 0 && i % 2 == 0)) {
                    // Wall tiles
                    var tile = new Tile('wall', { x: j, y: i });
                    this.stage.addChild(tile.bmp);
                    this.tiles.push(tile);
                } else {
                    // Grass tiles
                    var tile = new Tile('grass', { x: j, y: i });
                    this.stage.addChild(tile.bmp);

                    // Wood tiles
                    if (!(i <= 2 && j <= 2)
                        && !(i >= this.tilesY - 3 && j >= this.tilesX - 3)
                        && !(i <= 2 && j >= this.tilesX - 3)
                        && !(i >= this.tilesY - 3 && j <= 2)) {

                        var wood = new Tile('wood', { x: j, y: i });
                        this.stage.addChild(wood.bmp);
                        this.tiles.push(wood);
                    }
                }
            }
        }
    }

    drawBonuses() {
        // Cache woods tiles
        var woods = [];
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.material == 'wood') {
                woods.push(tile);
            }
        }

        // Sort tiles randomly
        woods.sort(function() {
            return 0.5 - Math.random();
        });

        // Distribute bonuses to quarters of map precisely fairly
        for (var j = 0; j < 4; j++) {
            var bonusesCount = Math.round(woods.length * this.bonusesPercent * 0.01 / 4);
            var placedCount = 0;
            for (var i = 0; i < woods.length; i++) {
                if (placedCount > bonusesCount) {
                    break;
                }

                var tile = woods[i];
                if ((j == 0 && tile.position.x < this.tilesX / 2 && tile.position.y < this.tilesY / 2)
                    || (j == 1 && tile.position.x < this.tilesX / 2 && tile.position.y > this.tilesY / 2)
                    || (j == 2 && tile.position.x > this.tilesX / 2 && tile.position.y < this.tilesX / 2)
                    || (j == 3 && tile.position.x > this.tilesX / 2 && tile.position.y > this.tilesX / 2)) {

                    var typePosition = placedCount % 3;
                    var bonus = new Bonus(tile.position, typePosition);
                    this.bonuses.push(bonus);

                    // Move wood to front
                    this.moveToFront(tile.bmp);

                    placedCount++;
                }
            }
        }
    }

    spawnPlayers() {
        this.players = [];
        for (var i = 0; i < this.playersCount; i++) {
            var player = new Player(i, this.startingPlayerPositions[i], {
                'up':    `up${i}`,
                'left':  `left${i}`,
                'down':  `down${i}`,
                'right': `right${i}`,
                'bomb':  `bomb${i}`
            });
            this.players.push(player);
        }

    }

    spawnBots() {
        this.bots = [];
        for (var i = this.playersCount; i < 4; i++) {
            var bot = new Bot(i, this.startingPlayerPositions[i]);
            this.bots.push(bot);
        }
    }

    // Checks whether two rectangles intersect.
    intersectRect(a, b) {
        return (a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom);
    }

    // Returns tile at given position.
    getTile(position) {
        for (var i = 0; i < this.tiles.length; i++) {
            var tile = this.tiles[i];
            if (tile.position.x == position.x && tile.position.y == position.y) {
                return tile;
            }
        }
    }

    // Returns tile material at given position.
    getTileMaterial(position) {
        var tile = this.getTile(position);
        return (tile) ? tile.material : 'grass' ;
    }

    gameOver(status) {
        if (gGameEngine.menu.visible) { return; }

        if (status == 'win') {
            var winText = "You won!";
            if (gGameEngine.playersCount > 1) {
                var winner = gGameEngine.getWinner();
                winText = winner == 0 ? "Player 1 won!" : "Player 2 won!";
            }
            this.menu.show([{text: winText, color: '#669900'}, {text: ' ;D', color: '#99CC00'}]);
        } else {
            this.menu.show([{text: 'Game Over', color: '#CC0000'}, {text: ' :(', color: '#FF4444'}]);
        }
    }

    getWinner() {
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            if (player.alive) {
                return i;
            }
        }
    }

    restart() {
        gInputEngine.removeAllListeners();
        gGameEngine.stage.removeAllChildren();
        gGameEngine.setup();
    }

    // Moves specified child to the front.
    moveToFront(child) {
        var children = gGameEngine.stage.getNumChildren();
        gGameEngine.stage.setChildIndex(child, children - 1);
    }

    toggleSound() {
        if (gGameEngine.mute) {
            gGameEngine.mute = false;
            gGameEngine.soundtrack.resume();
        } else {
            gGameEngine.mute = true;
            gGameEngine.soundtrack.pause();
        }
    }

    countPlayersAlive() {
        var playersAlive = 0;
        for (var i = 0; i < gGameEngine.players.length; i++) {
            if (gGameEngine.players[i].alive) {
                playersAlive++;
            }
        }
        return playersAlive;
    }

    getPlayersAndBots() {
        var players = [];

        for (var i = 0; i < gGameEngine.players.length; i++) {
            players.push(gGameEngine.players[i]);
        }

        for (var i = 0; i < gGameEngine.bots.length; i++) {
            players.push(gGameEngine.bots[i]);
        }

        return players;
    }

    // Hack OpenAI Gym integration
    _observation() {
        // board for observation
        var board = [];
        for (var i = 0; i < gGameEngine.tilesY; i++) {
            board[i] = Array(gGameEngine.tilesX).fill(0);
        }
        if (gGameEngine.countPlayersAlive() == 0) {
            return board
        }

        // Players
        for (var i = 0; i < gGameEngine.players.length; i++) {
            var player = gGameEngine.players[i];
            if (player.alive) {
                board[player.position.y][player.position.x] = player.id + 1;
                player.bombs.map((b) => {board[b.position.y][b.position.x] += 10;})
            }
        }

        // Bots
        for (var i = 0; i < gGameEngine.bots.length; i++) {
            var bot = gGameEngine.bots[i];
            if (bot.alive) {
                board[bot.position.y][bot.position.x] = bot.id + 1;
                bot.bombs.map((b) => {board[b.position.y][b.position.x] += 10;})
            }
        }

        // Tiles
        for (var i = 0; i < gGameEngine.tiles.length; i++) {
            var tile = gGameEngine.tiles[i];
            if ( tile.material == 'wall') {
                board[tile.position.y][tile.position.x] = 5
            } else if ( tile.material == 'wood') {
                board[tile.position.y][tile.position.x] = 6
            }
        }

        // Bonuses
        for (var i = 0; i < gGameEngine.bonuses.length; i++) {
            var bonus = gGameEngine.bonuses[i];
            if (board[bonus.position.y][bonus.position.x] == 0) { //grass
                if ( bonus.type == 'speed') {
                    board[bonus.position.y][bonus.position.x] = 7
                } else if ( bonus.type == 'bomb') {
                    board[bonus.position.y][bonus.position.x] = 8
                } else {
                    board[bonus.position.y][bonus.position.x] = 9
                }
            }
        }

        return board
    }
}

gGameEngine = new GameEngine();
