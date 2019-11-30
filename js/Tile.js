class Tile extends Entity {
    // Entity position on map grid
    position = {};

    // Bitmap dimensions
    size = { w: 32, h: 32 };

    // Bitmap animation
    bmp = null;

    material = '';

    constructor(material, position) {
        super();
        this.material = material;
        this.position = position;
        var img;
        if (material == 'grass') {
            img = gGameEngine.tilesImgs.grass;
        } else if (material == 'wall') {
            img = gGameEngine.tilesImgs.wall;
        } else if (material == 'wood') {
            img = gGameEngine.tilesImgs.wood;
        }
        this.bmp = new createjs.Bitmap(img);
        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x;
        this.bmp.y = pixels.y;
    }

    update() {}

    remove() {
        gGameEngine.stage.removeChild(this.bmp);
        for (var i = 0; i < gGameEngine.tiles.length; i++) {
            var tile = gGameEngine.tiles[i];
            if (this == tile) {
                gGameEngine.tiles.splice(i, 1);
            }
        }
    }
}
