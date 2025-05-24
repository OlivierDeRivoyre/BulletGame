
const debug = !!new URLSearchParams(window.location.search).get("debug");;
class WorldMap {
    constructor(isServer, players) {
        this.isServer = isServer;
        this.cellPx = 48;
        this.borderX = 32;
        this.borderY = 24;
        this.cellWidth = 20;
        this.cellHeight = 11;
        function getPipoTile(i, j) {
            return new SimpleSprite(pipoBuildingTileSet, i * 48, j * 48, 48, 48);
        }
        function getWaterTile(i, j) {
            const topX = 8 * 48;
            const topY = 12 * 48;
            return new SimpleSprite(pipoGroundTileSet, topX + i * 48, topY + j * 48, 48, 48);
        }
        this.grass = getPipoTile(0, 0);
        this.house = getPipoTile(0, 6);
        this.dungeon = new SimpleSprite(pipoBuildingTileSet, 3 * 48, 8 * 48, 2 * 48, 2 * 48);
        this.moutain = new SimpleSprite(pipoBuildingTileSet, 0, 4 * 48, 2 * 48, 2 * 48);
        this.halfMoutain = new SimpleSprite(pipoBuildingTileSet, 2 * 48, 4 * 48, 2 * 48, 2 * 48);
        this.riverV = getWaterTile(4, 1);
        this.riverEnter = getWaterTile(0, 5);
        this.lakeLeftTop = getWaterTile(5, 0);
        this.lakeTop = getWaterTile(6, 0);
        this.lakeRightTop = getWaterTile(7, 0);
        this.lakeLeft = getWaterTile(5, 1);
        this.lakeCenter = getWaterTile(6, 1);
        this.lakeRight = getWaterTile(7, 1);
        this.lakeLeftBottom = getWaterTile(5, 2);
        this.lakeBottom = getWaterTile(6, 2);
        this.lakeRightBottom = getWaterTile(7, 2);
        this.lakeExit = getWaterTile(1, 5);
        this.woodBridge = new SimpleSprite(pipoBuildingTileSet, 0, 96, 48, 70);
        this.stoneBridge = new SimpleSprite(pipoBuildingTileSet, 96, 96, 48, 70);
        this.whirlpool = getPipoTile(4, 2);
        this.tree = getPipoTile(2, 1);

        this.vilains = [];
        for (let i = 0; i < 16; i++) {
            this.vilains.push(getDungeonTileSetVilainSprite(i, 0));
        }
        this.blockedCells = this.array2d();
        this.setBlockedCells();
        this.fog = this.array2d();
        this.monsters = [];
        this.reliefs = this.array2d();
        this.createMonsters();
        this.players = players.map(p => { return { id: p.id, i: 3, j: 2, sprite: p.sprite }; });
        this.player = this.players[isServer ? 0 : 1];
        this.unfogAround(this.player.i, this.player.j);
        this.nextMoveTick = -999;
        this.monsterLimit = this.array2d();
        this.computePaths();
        this.rewardTooltip = new RewardTooltip();
        this.houseCells = [{ i: 3, j: 2 }, { i: 7, j: 0 }, { i: 14, j: 3 }, { i: 19, j: 5 },
        { i: 14, j: 8 }, { i: 9, j: 10 }];
        this.dialog = null;
    }
    array2d() {
        const a = new Array(this.cellWidth);
        for (let i = 0; i < this.cellWidth; i++) {
            a[i] = new Array(this.cellHeight);
        }
        return a;
    }
    isInside(i, j) {
        if (i < 0 || i >= this.cellWidth || j < 0 || j >= this.cellHeight) {
            return false;
        }
        return true;
    }
    setBlockedCells() {
        this.blockedCells[4][0] = "Tree";
        for (let i = 0; i <= 7; i++) {
            for (let j = 4; j <= 7; j++) {
                this.blockedCells[i][j] = "Mountains";
            }
        }
        this.blockedCells[5][3] = "Mountains";
        this.blockedCells[6][3] = "Mountains";
        this.blockedCells[8][5] = "Mountains";
        this.blockedCells[8][6] = "Mountains";
        for (let i = 11; i <= 16; i++) {
            for (let j = 4; j <= 7; j++) {
                this.blockedCells[i][j] = "Lake";
            }
        }
        this.blockedCells[15][0] = "River";
        this.blockedCells[15][2] = "River";
        this.blockedCells[15][3] = "River";
        this.blockedCells[13][8] = "River";
        this.blockedCells[13][10] = "River";
    }
    createMonsters() {
        const self = this;
        function pushMonster(mobIndex, i, j, name, rewards) {
            self.monsters.push({ mobIndex, i, j, id: self.monsters.length, name, rewards, alive: !debug })
        }
        // start with a dagger
        pushMonster(1, 0, 0);// gain heal
        pushMonster(0, 2, 0);// gain shotgun
        pushMonster(15, 1, 2, "snail1");// gain shield
        pushMonster(5, 2, 3);// gain wand        
        pushMonster(2, 6, 1, '');// Need heal

        // pushMonster(0, 6, 0);
        //pushMonster(3, 6, 2);
        pushMonster(4, 8, 1);
        pushMonster(5, 8, 4);
        pushMonster(4, 8, 4);
        pushMonster(3, 9, 0);
        pushMonster(15, 9, 2);
        pushMonster(6, 10, 4);
        pushMonster(5, 11, 1);
        pushMonster(2, 13, 0);
        pushMonster(12, 13, 3);
        pushMonster(7, 15, 1);
        pushMonster(5, 16, 3);
        pushMonster(15, 19, 1);
        pushMonster(15, 17, 5);
        pushMonster(4, 18, 7);
        pushMonster(8, 18, 9);
        pushMonster(6, 14, 9);
        pushMonster(5, 12, 9);

        pushMonster(9, 10, 6);
        pushMonster(8, 9, 7);
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
        const queue = [{ i: 3, j: 2 }];
        while (queue.length != 0) {
            const current = queue[0];
            queue.splice(0, 1);
            if (!this.isInside(current.i, current.j)) {
                continue;
            }
            if (this.blockedCells[current.i][current.j]) {
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
        if (debug) {
            ctx.font = "12px Consolas";
            ctx.fillStyle = 'white';
            ctx.fillText(i + "," + j, px + 16, py + 24);
        }
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
        for (let coord of this.houseCells) {
            this.paintCell(this.house, coord.i, coord.j);
        }
        this.paintCell(this.tree, 4, 0)
        this.paintCell(this.moutain, 0, 4);
        this.paintCell(this.halfMoutain, 0, 5);
        this.paintCell(this.moutain, 0, 6);
        this.paintCell(this.moutain, 2, 4);
        this.paintCell(this.halfMoutain, 2, 5);
        this.paintCell(this.moutain, 2, 6);
        this.paintCell(this.moutain, 5, 3);
        this.paintCell(this.moutain, 4, 4);
        this.paintCell(this.halfMoutain, 4, 5);
        this.paintCell(this.moutain, 4, 6);
        this.paintCell(this.moutain, 6, 4);
        this.paintCell(this.halfMoutain, 6, 5);
        this.paintCell(this.moutain, 6, 6);
        this.paintCell(this.moutain, 7, 5);
        this.paintCell(this.dungeon, 1, 8);

        this.paintWater();

        for (let m of this.monsters) {
            this.paintMob(m.mobIndex, m.i, m.j);
        }
        for (let p of this.players) {
            this.paintCharacter(p.sprite, p.i, p.j);
        }
        for (let j = 0; j < this.cellHeight; j++) {
            for (let i = 0; i < this.cellWidth; i++) {
                var fog = this.fog[i][j];
                if (fog == 1) {
                    continue;
                }
                if (this.blockedCells[i][j] && fog) {
                    continue;
                }
                if (debug) {
                    continue;
                }
                ctx.fillStyle = fog ? '#2228' : '#222';
                const px = this.borderX + i * this.cellPx;
                const py = this.borderY + j * this.cellPx;
                ctx.fillRect(px, py, 48, 48);
            }
        }
        this.rewardTooltip.paint();
        if (this.dialog) {
            this.dialog.paint();
        }
    }
    paintWater() {
        this.paintCell(this.riverV, 15, 0);
        this.paintCell(this.riverV, 15, 1);
        this.paintCell(this.riverV, 15, 2);
        this.paintCell(this.riverV, 15, 3);

        this.paintCell(this.lakeLeftTop, 11, 4);
        this.paintCell(this.lakeTop, 12, 4);
        this.paintCell(this.lakeTop, 13, 4);
        this.paintCell(this.lakeTop, 14, 4);
        this.paintCell(this.riverEnter, 15, 4);
        this.paintCell(this.lakeRightTop, 16, 4);

        this.paintCell(this.lakeLeft, 11, 5);
        this.paintCell(this.lakeCenter, 12, 5);
        this.paintCell(this.lakeCenter, 13, 5);
        this.paintCell(this.lakeCenter, 14, 5);
        this.paintCell(this.lakeCenter, 15, 5);
        this.paintCell(this.lakeRight, 16, 5);
        this.paintCell(this.lakeLeft, 11, 6);
        this.paintCell(this.lakeCenter, 12, 6);
        this.paintCell(this.lakeCenter, 13, 6);
        this.paintCell(this.lakeCenter, 14, 6);
        this.paintCell(this.lakeCenter, 15, 6);
        this.paintCell(this.lakeRight, 16, 6);

        this.paintCell(this.lakeLeftBottom, 11, 7);
        this.paintCell(this.lakeBottom, 12, 7);
        this.paintCell(this.lakeExit, 13, 7);
        this.paintCell(this.lakeBottom, 14, 7);
        this.paintCell(this.lakeBottom, 15, 7);
        this.paintCell(this.lakeRightBottom, 16, 7);

        this.paintCell(this.riverV, 13, 8);
        this.paintCell(this.riverV, 13, 9);
        this.paintCell(this.riverV, 13, 10);

        this.paintCell(this.woodBridge, 15, 1);
        this.paintCell(this.stoneBridge, 13, 9);
        //  this.paintCell(this.whirlpool, 13, 6);
    }
    update() {
        if (this.dialog) {
            this.dialog.update();
            return [];
        }
        if (tickNumber < this.nextMoveTick) {
            return [];
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
        else if (input.keysPressed.space) {
            input.keysPressed.space = false;
            return this.tryEnter();
        }
        if (this.player.i == newPos.i && this.player.j == newPos.j) {
            return [];
        }
        if (!this.isInside(newPos.i, newPos.j)) {
            return [];
        }
        if (this.blockedCells[newPos.i][newPos.j]) {
            return [];
        }
        if (this.fog[newPos.i][newPos.j] != 1) {
            return [];
        }
        this.player.i = newPos.i;
        this.player.j = newPos.j;
        this.unfogAround(this.player.i, this.player.j);
        if (this.monsters.find(m => m.i == this.player.i && m.j == this.player.j)) {
            this.rewardTooltip.temp_SetRandomReward();
        } else {
            this.rewardTooltip.rewards = [];
        }
        this.nextMoveTick = tickNumber + 10;
        return [{ t: 'mapMove', id: this.player.id, i: this.player.i, j: this.player.j }];
    }
    tryEnter() {
        for (let i = 0; i < this.monsters.length; i++) {
            const m = this.monsters[i];
            if (m.i == this.player.i && m.j == this.player.j) {
                return this.tryEnterLevel(i, m);
            }
        }
        for (let coord of this.houseCells) {
            if (coord.i == this.player.i && coord.j == this.player.j) {
                this.dialog = new EquipPlayerDialog(this.player, game.equipement, game.worldLevel.actionBar);
            }
        }
        return [];
    }
    tryEnterLevel(monsterIndex, monster) {
        if (!this.isServer) {
            return [{ t: 'mapTryEnterLevel', monsterId: monster.id }]
        } else {
            return this.enterLevel(monsterIndex, monster);
        }
    }
    enterLevel(monsterIndex, monster) {
        if (!this.isServer) {
            return [{ t: 'mapTryEnterLevel', monsterId: monster.id }]
        }
        this.monsters.splice(monsterIndex, 1);
        this.computePaths();
        game.worldLevel.startLevel(LevelContent.getLevelContent(monster.name));
        game.currentView = game.worldLevel;
        return [{ t: 'mapEnterLevel', world: game.getWorldMsg() }]
    }
    onUpdates(msg) {
        for (let m of msg) {
            if (m.t === 'mapMove') {
                const p = this.players.find(p => p.id == m.id);
                p.i = m.i;
                p.j = m.j;
            } else if (m.t === 'mapTryEnterLevel') {
                const monsterIndex = this.monsters.findIndex(p => p.id == m.monsterId);
                if (monsterIndex != -1) {
                    return this.enterLevel(monsterIndex, this.monsters[monsterIndex]);
                }
            } else if (m.t === 'mapEnterLevel') {
                game.refreshWorldFromMsg(m.world)
            }
        }
    }


    getWorldMsg() {
        return {
            players: this.players.map(p => {
                return {
                    id: p.id,
                    i: p.i,
                    j: p.j
                };
            }),
            monsters: this.monsters.map(m => {
                return { id: m.id };
            }),
        };
    }
    refreshWorldFromMsg(msg) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].i = msg.players[i].i;
            this.players[i].j = msg.players[i].j;
        }
        for (let i = this.monsters.length - 1; i >= 0; i--) {
            const id = this.monsters[i].id;
            if (!msg.monsters.find(m => m.id == id)) {
                this.monsters.splice(i, 1);
            }
        }
    }
}

class RewardTooltip {
    constructor() {
        this.rewards = []
    }
    temp_SetRandomReward() {
        this.seed = getNextRand(this.seed || 17);
        const allRewards = [
            { sprite: allSpells.curseGround.sprite, name: "Curse Ground I", color: "#FBB" },
            { sprite: allSpells.healProjectile.sprite, name: "Healing Projectile I", color: "#BFB" },
            { sprite: allSpells.protectSpell.sprite, name: "Protection I", color: "#BBF" },
            { sprite: allSpells.shotgun.sprite, name: "Multi shot I", color: "#FBB" },
            { sprite: allSpells.rootingProjectile.sprite, name: "Rooting shot", color: "#FBB" },
        ]
        const selected = allRewards[this.seed % allRewards.length];
        this.rewards = [selected];
    }
    paint() {
        if (this.rewards.length == 0) {
            return;
        }

        const topX = 32 + 10;
        const topY = 16 + 48 * 5;
        const width = 48 * 6;
        const height = 48 * 3;
        ctx.fillStyle = "#303030";
        ctx.fillRect(topX, topY, width, height);
        let x = topX + 8;
        let y = topY + 16;
        ctx.font = "12px Consolas";
        ctx.fillStyle = 'white';
        ctx.textRendering = "geometricPrecision";
        ctx.fillText("Potential rewards:", x, y);
        y += 8;
        for (let reward of this.rewards) {
            reward.sprite.paintScale(x, y, 32, 32);
            ctx.font = "12px Consolas";
            ctx.fillStyle = reward.color;
            ctx.textRendering = "geometricPrecision";
            ctx.fillText(reward.name, x + 40, y + 20);
            y += 34;
        }
    }
}

class Equipement {
    constructor() {
        this.spells = [];
        for (let id of Object.keys(allSpells)) {
            this.spells.push(allSpells[id]);
        }
    }
}

class EquipPlayerDialog {
    constructor(player, equipement, actionBar) {
        this.player = player;
        this.actionBar = actionBar;
        this.pages = [];
        for (let pageName of ["Mouse 1", "Mouse 2", "Space"]) {
            const spells = equipement.spells.filter(s => s.description.location == pageName);
            const page = {
                name: pageName,
                spells,
                spellsZone: new Array(spells.length),
                index: this.pages.length,
            }
            this.pages.push(page);
        }
        this.selectedPage = 0;
    }

    paint() {
        const borderX = 10;
        let topX = borderX
        let topY = 10;
        for (let i = 0; i < this.pages.length; i++) {
            const buttonBorder = 8;
            const page = this.pages[i];
            ctx.font = "16px Consolas";
            const textWidth = Math.ceil(ctx.measureText(page.name).width);
            ctx.fillStyle = i == this.selectedPage ? '#c96' : '#974';
            ctx.fillRect(topX, topY, textWidth + buttonBorder * 2, 30)
            page.headerZone = { x: topX, y: topY, width: textWidth + buttonBorder * 2, height: 30 };
            ctx.fillStyle = 'Black';
            ctx.fillText(page.name, topX + buttonBorder, topY + 20);
            topX += textWidth + buttonBorder * 2;
        }

        const grad = ctx.createLinearGradient(0, 0, CanvasWidth - 20, 0);
        grad.addColorStop(0, '#c96');
        grad.addColorStop(1, '#974');
        ctx.fillStyle = grad;
        ctx.fillRect(borderX, 40, CanvasWidth - 2 * borderX, CanvasHeight - 50);

        this.paintSpells(this.pages[this.selectedPage]);

        this.paintCursor();
    }

    paintSpells(page) {
        let topY = 50;
        let topX = 20;
        const actionBarSpell = this.actionBar.spells[page.index];
        for (let i = 0; i < page.spells.length; i++) {
            const spell = page.spells[i];

            if (actionBarSpell && spell.id == actionBarSpell.id) {
                const grad = ctx.createLinearGradient(topX, topY, 300, 36);
                grad.addColorStop(0, '#dd7');
                grad.addColorStop(1, '#cc6');
                ctx.fillStyle = grad;
                ctx.fillRect(topX - 2, topY - 4, 300, 38);
            }
            page.spellsZone[i] = { x: topX - 2, y: topY - 4, width: 300, height: 38 };
            spell.sprite.paint(topX, topY, 32, 32);
            ctx.font = "16px Consolas";
            ctx.fillStyle = spell.description.color;
            ctx.textRendering = "geometricPrecision";
            ctx.fillText(spell.description.name, topX + 40, topY + 20);
            topY += 40;
        }
    }

    paintCursor() {
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 5, 2 * Math.PI, 0);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(input.mouse.x, input.mouse.y, 4, 2 * Math.PI, 0);
        ctx.fillStyle = 'red';
        ctx.fill();
    }

    update() {
        if (input.keysPressed.space) {
            input.keysPressed.space = false;
            game.worldMap.dialog = null;
            return;
        }
        if (input.mouseClicked) {
            for (let i = 0; i < this.pages.length; i++) {
                let headerZone = this.pages[i].headerZone;
                if (!headerZone) {
                    return;
                }
                if (isInsideRect(input.mouse, headerZone)) {
                    this.selectedPage = i;
                    return;
                }
            }
            const page = this.pages[this.selectedPage];
            for (let i = 0; i < page.spells.length; i++) {
                let zone = page.spellsZone[i];
                if (!zone) {
                    return;
                }
                if (isInsideRect(input.mouse, zone)) {
                    const selectedSpell = page.spells[i];
                    this.actionBar.spells[page.index] = selectedSpell;
                    return;
                }
            }
        }
    }
}