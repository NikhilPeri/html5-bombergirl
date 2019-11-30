class Bonus extends Entity {
    types = ['speed', 'bomb', 'fire'];

    type = '';
    position = {};
    bmp = null;

    constructor(position, typePosition) {
        super();
        this.type = this.types[typePosition];

        this.position = position;

        this.bmp = new createjs.Bitmap(gGameEngine.bonusesImg);
        var pixels = Utils.convertToBitmapPosition(position);
        this.bmp.x = pixels.x;
        this.bmp.y = pixels.y;
        this.bmp.sourceRect = new createjs.Rectangle(typePosition * 32, 0, 32, 32);
        gGameEngine.stage.addChild(this.bmp);
    }

    destroy() {
        gGameEngine.stage.removeChild(this.bmp);
        Utils.removeFromArray(gGameEngine.bonuses, this);
    }
}
