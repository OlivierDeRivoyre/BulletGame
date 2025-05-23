
function loadImg(name) {
    const img = new Image();
    img.src = "img/" + name + ".png";
    return img;
}
const dungeonTileSet = loadImg("0x72_DungeonTilesetII_v1.7");
function getDungeonTileSetHeroSprite(j, topMargin) {
    const x = 128;
    const y = j * 32;
    return new DoubleSprite(dungeonTileSet, x, y + topMargin, 16, 32 - topMargin);
}
function getDungeonTileSetVilainSprite(i, topMargin) {
    const x = 368;
    const y = 9 + i * 24;
    return new DoubleSprite(dungeonTileSet, x, y + topMargin, 16, 24 - topMargin);
}
const outdoorDecorTile = loadImg("Outdoor_Decor_Free");
function getOutdoorDecorSprite(i, j) {
    return new SimpleSprite(outdoorDecorTile, i * 16, j * 16, 16, 16);
}
const pipoBuildingTileSet = loadImg("pipo-map001");
const pipoGroundTileSet = loadImg("pipo-map001_at");
const oakTreeImg = loadImg("Oak_Tree");

class SimpleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, this.tWidth, this.tHeight
        );
    }
    paintScale(x, y, w, h) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, w, h
        );
    }
    paintRotate(x, y, w, h, angus) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(angus);
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}
class DoubleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y, index, reverse) {
        index |= 0;
        if (reverse) {
            this.paintReverse(x, y, index);
            return;
        }
        // ctx.fillStyle = "pink"; ctx.fillRect(x, y, this.tWidth, this.tHeight);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            x, y,
            this.tWidth * 2, this.tHeight * 2
        );
    }
    paintReverse(x, y, index) {
        ctx.save();
        ctx.translate(x + this.tWidth * 2, y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            0, 0, this.tWidth * 2, this.tHeight * 2
        );
        ctx.restore();
    }
    paintRotate(x, y, angus) {
        ctx.save();
        ctx.translate(x + this.tWidth, y + this.tHeight);
        ctx.rotate(angus);
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            -this.tWidth, -this.tHeight, this.tWidth * 2, this.tHeight * 2);
        ctx.restore();
    }
}
