

class CellSpriteFactory {
    constructor() {
        this.grass1 = new CellColorSprite('#509060');
        this.grass2 = new CellColorSprite('#509360');
        this.water = new CellColorSprite('#55B');
        this.chunkTrunk = new CellDecoSprite(getOutdoorDecorSprite(0, 2), 16, 16);
        this.rock = new CellDecoSprite(getOutdoorDecorSprite(2, 2), 16, 16);
        this.grassSmallDecosSprites = [
            getOutdoorDecorSprite(0, 0),
            getOutdoorDecorSprite(1, 0),
            getOutdoorDecorSprite(2, 0),
            getOutdoorDecorSprite(0, 1),
            getOutdoorDecorSprite(1, 1),
            getOutdoorDecorSprite(2, 1),
            getOutdoorDecorSprite(3, 1),
            getOutdoorDecorSprite(4, 1),
            getOutdoorDecorSprite(5, 1),
            getOutdoorDecorSprite(6, 1),
            getOutdoorDecorSprite(1, 2),
            getOutdoorDecorSprite(5, 2),
            //getOutdoorDecorSprite(6, 2),
            getOutdoorDecorSprite(2, 7),
            getOutdoorDecorSprite(0, 8),
            getOutdoorDecorSprite(1, 8),
            getOutdoorDecorSprite(0, 9),
            getOutdoorDecorSprite(1, 9),
            getOutdoorDecorSprite(0, 10),
            getOutdoorDecorSprite(1, 10),
            getOutdoorDecorSprite(0, 11),
            getOutdoorDecorSprite(1, 11),
        ];


    }
}
const cellSpriteFactory = new CellSpriteFactory();
class Cell {
    constructor(cellSprites, prop) {
        this.cellSprites = cellSprites;
        prop = prop || {};
        this.canWalk = prop.canWalk === undefined ? true : prop.canWalk;
    }
    paint(x, y) {
        for (let s of this.cellSprites) {
            s.paint(x, y);
        }
    }
    static waterCell(){
        return new Cell([cellSpriteFactory.water], { canWalk: false });
    }
    static getGrassCell(i, j, seed) {
        const grass = (i + j) % 2 == 0 ? cellSpriteFactory.grass1 : cellSpriteFactory.grass2;
        const layers = [grass];
        if (seed % 19 == 7) {
            layers.push(cellSpriteFactory.chunkTrunk)
        } else if (seed % 23 == 8) {
            layers.push(cellSpriteFactory.rock)
        } else {
            const coords = [
                { x: 0, y: 0, mod: 191 },
                { x: 32, y: 0, mod: 193 },
                { x: 0, y: 32, mod: 197 },
                { x: 32, y: 32, mod: 199 },
            ]
            for (let c of coords) {
                const index = seed % c.mod;
                if (index < cellSpriteFactory.grassSmallDecosSprites.length) {
                    const decoSprite = cellSpriteFactory.grassSmallDecosSprites[index];
                    layers.push(new CellDecoSprite(decoSprite, c.x, c.y));
                }
            }
        }
        return new Cell(layers);
    }
}

class LevelBackground {
    constructor(borderCell, cells) {
        this.borderCell = borderCell;
        this.cells = cells;
    }
    getCell(x, y) {
        const i = Math.floor(x / 64);
        const j = Math.floor(y / 64);
        if (j < 0 || j >= this.cells.length) {
            return this.borderCell;
        }
        const row = this.cells[j];
        if (i < 0 || i >= row.length) {
            return this.borderCell;
        }
        return row[i];
    }
    paint(camera) {
        const topX = camera.topX;
        const topY = camera.topY;
        const offsetX = Math.floor(topX / 64) * 64 - topX;
        const offsetY = Math.floor(topY / 64) * 64 - topY;
        for (let j = -1; j <= CanvasCellHeight; j++) {
            for (let i = -1; i <= CanvasCellWidth; i++) {
                const x = topX + i * 64;
                const y = topY + j * 64;
                this.getCell(x, y).paint(offsetX + i * 64, offsetY + j * 64);
            }
        }
    }
}
