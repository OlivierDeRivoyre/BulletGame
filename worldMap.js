const pipoBuildingTileSet = loadImg("pipo-map001");
class WorldMap {
    constructor() {
        this.cellPx = 48;
        this.borderX = 32;
        this.borderY = 24;
        this.cellWidth = 20;
        this.cellHeight = 11;
        function getPipoTile(i, j) {
            return new SimpleSprite(pipoBuildingTileSet, i * 48, j * 48, 48, 48);
        }
        this.grass = getPipoTile(0, 0);
        this.house = getPipoTile(0, 6);
        this.dungeon = new SimpleSprite(pipoBuildingTileSet, 3 * 48, 8 * 48, 2 * 48, 2 * 48);
        this.moutain = new SimpleSprite(pipoBuildingTileSet, 0, 4 * 48, 2 * 48, 2 * 48);
        this.halfMoutain = new SimpleSprite(pipoBuildingTileSet, 2 * 48, 4 * 48, 2 * 48, 2 * 48);
        this.vilains = [];
        for (let i = 0; i < 16; i++) {
            this.vilains.push(getDungeonTileSetVilainSprite(i, 0));
        }
        const self = this;
        function array2d() {
            const a = new Array(self.cellWidth);
            for (let i = 0; i < self.cellWidth; i++) {
                a[i] = new Array(self.cellHeight);
            }
            return a;
        }
        this.fog = array2d();
        this.monsters = [];
        this.reliefs = array2d();
        this.createMonsters();
        this.player = { i: 3, j: 2, sprite: getDungeonTileSetHeroSprite(0, 14) };
        this.unfogAround(this.player.i, this.player.j);
        this.nextMoveTick = -999;
    }
    createMonsters() {
        const self = this;
        function pushMonster(mobIndex, i, j) {
            self.monsters.push({ mobIndex, i, j })
        }
        pushMonster(0, 0, 0);
        pushMonster(0, 2, 0);
        pushMonster(0, 1, 2);
        pushMonster(1, 2, 3);
        pushMonster(1, 2, 3);
        pushMonster(1, 4, 1);
        pushMonster(2, 5, 3);
        pushMonster(0, 6, 0);
        pushMonster(3, 6, 2);
        pushMonster(4, 8, 1);
        pushMonster(5, 8, 4);
        pushMonster(4, 8, 4);
        pushMonster(3, 9, 0);
        pushMonster(15, 9, 2);
        pushMonster(6, 10, 4);
        pushMonster(5, 11, 1);
        pushMonster(12, 13, 3);
        pushMonster(7, 14, 0);
        pushMonster(5, 16, 3);
        pushMonster(15, 19, 1);
        pushMonster(15, 17, 5);
        pushMonster(4, 16, 7);
        pushMonster(8, 18, 9);
        pushMonster(6, 14, 9);
        pushMonster(5, 12, 9);

        pushMonster(9, 9, 5);
        pushMonster(8, 10, 7);
        pushMonster(14, 8, 8);

        pushMonster(13, 5, 8);
        pushMonster(14, 5, 10);
        pushMonster(11, 3, 9);
    }
    update() {
        if (tickNumber  < this.nextMoveTick) {
            return;
        }
        let changed = false;
        if (input.keysPressed.left) {
            this.player.i--;
            changed = true;
        }
        if (input.keysPressed.right) {
            this.player.i++;
            changed = true;
        }
        if (input.keysPressed.up) {
            this.player.j--;
            changed = true;
        }
        if (input.keysPressed.down) {
            this.player.j++;
            changed = true;
        }
        if(changed){
            this.unfogAround(this.player.i, this.player.j);
             this.nextMoveTick = tickNumber + 15;
        }
    }
    unfogAround(i, j) {
        const self = this;
        function unfog(i, j, v) {
            if (i < 0 || i >= self.cellWidth || j < 0 || j >= self.cellHeight) {
                return;
            }
            const oldValue = self.fog[i][j] || 0;
            self.fog[i][j] = Math.max(v, oldValue);
        }
        unfog(i, j, 1);
        unfog(i - 1, j - 1, 0.5);
        unfog(i - 1, j, 0.5);
        unfog(i - 1, j + 1, 0.5);
        unfog(i, j - 1, 0.5);
        unfog(i, j + 1, 0.5);
        unfog(i + 1, j - 1, 0.5);
        unfog(i + 1, j, 0.5);
        unfog(i + 1, j + 1, 0.5);

    }
    paintCell(sprite, i, j) {
        const px = this.borderX + i * this.cellPx;
        const py = this.borderY + j * this.cellPx;
        sprite.paint(px, py);
        ctx.font = "11px Georgia";
        ctx.fillStyle = 'white';
        //    ctx.fillText(i + ", " + j, px + 16, py + 24);
    }
    paintMob(mobIndex, i, j) {
        const sprite = this.vilains[mobIndex];
        this.paintCharacter(sprite, i, j);
    }
    paintCharacter(sprite, i, j) {
        const px = this.borderX + i * this.cellPx + Math.floor((this.cellWidth - sprite.tWidth) / 2);
        const py = this.borderY + j * this.cellPx + Math.floor((this.cellWidth - sprite.tHeight) / 2);
        const animIndex = Math.floor(tickNumber / 20) % 2;
        const reverse = i > 2 && !(j > 7 && i < 10);
        sprite.paint(px, py, animIndex, reverse);
    }
    paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let j = 0; j < this.cellHeight; j++) {
            for (let i = 0; i < this.cellWidth; i++) {
                this.paintCell(this.grass, i, j);
            }
        }
        this.paintCell(this.house, 3, 2);
        this.paintCell(this.moutain, 0, 4);
        this.paintCell(this.halfMoutain, 0, 5);
        this.paintCell(this.moutain, 0, 6);
        this.paintCell(this.moutain, 2, 4);
        this.paintCell(this.halfMoutain, 2, 5);
        this.paintCell(this.moutain, 2, 6);
        this.paintCell(this.moutain, 4, 4);
        this.paintCell(this.halfMoutain, 4, 5);
        this.paintCell(this.moutain, 4, 6);
        this.paintCell(this.moutain, 6, 4);
        this.paintCell(this.halfMoutain, 6, 5);
        this.paintCell(this.moutain, 6, 6);
        this.paintCell(this.moutain, 7, 5);
        this.paintCell(this.dungeon, 1, 8);

        for (let m of this.monsters) {
            this.paintMob(m.mobIndex, m.i, m.j);
        }
        this.paintCharacter(this.player.sprite, this.player.i, this.player.j);
        for (let j = 0; j < this.cellHeight; j++) {
            for (let i = 0; i < this.cellWidth; i++) {
                var fog = this.fog[i][j];
                if (fog == 1) {
                    continue;
                }
                ctx.fillStyle = fog ? '#2228' : '#222';
                const px = this.borderX + i * this.cellPx;
                const py = this.borderY + j * this.cellPx;
                ctx.fillRect(px, py, 48, 48);
            }
        }
    }
}
