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
        this.fog = this.array2d();
        this.monsters = [];
        this.reliefs = this.array2d();
        this.createMonsters();
        this.player = { i: 3, j: 2, sprite: getDungeonTileSetHeroSprite(0, 14) };
        this.unfogAround(this.player.i, this.player.j);
        this.nextMoveTick = -999;
        this.monsterLimit = this.array2d();
        this.computePaths();
    }
    array2d() {
        const a = new Array(this.cellWidth);
        for (let i = 0; i < this.cellWidth; i++) {
            a[i] = new Array(this.cellHeight);
        }
        return a;
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
        pushMonster(1, 5, 1);
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
    computeMonsterLimit() {
        const self = this;
        for (let m of this.monsters) {
            function setLimit(i, j) {
                const x = m.i + i;
                const y = m.j + j;
                if (x < 0 || x >= self.cellWidth || y < 0 || y >= self.cellHeight) {
                    return;
                }
                if (i == -1 && self.player.i > m.i) {
                    self.monsterLimit[x][y] = m;
                }
                if (i == 1 && self.player.i < m.i) {
                    self.monsterLimit[x][y] = m;
                }
                if (j == -1 && self.player.j > m.j) {
                    self.monsterLimit[x][y] = m;
                }
                if (j == 1 && self.player.j < m.j) {
                    self.monsterLimit[x][y] = m;
                }
            }
            setLimit(-1, -1);
            setLimit(-1, 0);
            setLimit(-1, 1);
            setLimit(0, -1);
            setLimit(0, 1);
            setLimit(1, -1);
            setLimit(1, 0);
            setLimit(1, 1);
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
        //unfog(i, j, 1);
        for (let x = -2; x <= 2; x++) {
            for (let y = -2; y <= 2; y++) {
                const level = 0.5;
                unfog(i + x, j + y, level);
            }
        }
        return;
    }
    isInside(i, j) {
        if (i < 0 || i >= this.cellWidth || j < 0 || j >= this.cellHeight) {
            return false;
        }
        return true;
    }
    computePaths() {
        const map = this.array2d();
        const self = this;
        function get(i, j) {
            if (!self.isInside(i, j)) {
                return;
            }
            return map[i][j];
        }
        function set(i, j, v) {
            if (!self.isInside(i, j)) {
                return;
            }
            map[i][j] = v;
        }
        const directions = [{ i: -1, j: 0 }, { i: 0, j: -1 }, { i: 1, j: 0 }, { i: 0, j: 1 }];
        for (let m of this.monsters) {
            set(m.i, m.j, { hasMonster: true });
        }
        for (let m of this.monsters) {
            for (let around of directions) {
                if (!get(m.i + around.i, m.j + around.j)) {
                    set(m.i + around.i, m.j + around.j, { mustGoToMonster: true })
                }
            }
        }
        const queue = [{ i: this.player.i, j: this.player.j }];
        while (queue.length != 0) {
            const current = queue[0];
            queue.splice(0, 1);
            if (!this.isInside(current.i, current.j)) {
                continue;
            }
            const position = get(current.i, current.j);
            if (position) {
                if (position.fog == 1) {
                    continue;
                }
                if (position.hasMonster) {
                    map[current.i][current.j] = { fog: 1, hasMonster: 1 };
                    continue;
                }
                if (position.mustGoToMonster) {
                    map[current.i][current.j] = { fog: 1, mustGoToMonster: 1 };
                    for (let around of directions) {
                        const p = get(current.i + around.i, current.j + around.j);
                        if (p && p.hasMonster) {
                            queue.push({ i: current.i + around.i, j: current.j + around.j })
                        }
                    }
                    continue;
                }
            }
            map[current.i][current.j] = { fog: 1 };
            for (let around of directions) {
                queue.push({ i: current.i + around.i, j: current.j + around.j })
            }
        }
        for (let i = 0; i < this.cellWidth; i++) {
            for (let j = 0; j < this.cellHeight; j++) {
                const position = get(i, j);
                if (position && position.fog == 1) {
                    this.fog[i][j] = 1;
                }
            }
        }
    }
    paintCell(sprite, i, j) {
        const px = this.borderX + i * this.cellPx;
        const py = this.borderY + j * this.cellPx;
        sprite.paint(px, py);
        ctx.font = "11px Georgia";
        ctx.fillStyle = 'white';
        ctx.fillText(i + ", " + j, px + 16, py + 24);
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
    update() {
        if (tickNumber < this.nextMoveTick) {
            return;
        }
        let newPos = { i: this.player.i, j: this.player.j };
        if (input.keysPressed.left) {
            newPos.i--;
        }
        else if (input.keysPressed.right) {
            newPos.i++;
        }
        else if (input.keysPressed.up) {
            newPos.j--;
        }
        else if (input.keysPressed.down) {
            newPos.j++;
        }
        else if (input.keysPressed.s4) {
            this.tryEnter();
        }
        if(this.player.i == newPos.i && this.player.j == newPos.j){
            return;
        }
        if (!this.isInside(newPos.i, newPos.j)) {
            return;
        }
        if (this.fog[newPos.i][newPos.j] != 1) {
            return;
        }
        this.player.i = newPos.i;
        this.player.j = newPos.j;
        this.unfogAround(this.player.i, this.player.j);
        this.nextMoveTick = tickNumber + 10;
    }
    tryEnter(){
        for(let i = 0; i <this.monsters.length; i++){
            const m = this.monsters[i];
            if(m.i == this.player.i && m.j == this.player.j){
                this.enterLevel(i);
                return;
            }
        }
    }
    enterLevel(monsterIndex){
        // TEMP
        this.monsters.splice(monsterIndex, 1);
        this.computePaths();
    }
}

