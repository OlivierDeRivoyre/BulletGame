class LevelDescription {
    constructor(name, reward, summary) {
        this.name = name;
        this.reward = reward;
        this.summary = summary;
    }
}
class LevelContent {
    constructor(map, mobs, levelDescription) {
        this.map = map;
        this.mobs = mobs;
        this.levelDescription = levelDescription;
        this.startingPosition = [{ i: 4, j: 4 }, { i: 3, j: 4 }]
    }
    static createLevelBackground(width, height) {
        const borderCell = Cell.waterCell();//new Cell([cellSpriteFactory.water], { canWalk: false });
        const cells = new Array(height);
        let seed = 1;
        for (var j = 0; j < cells.length; j++) {
            cells[j] = new Array(width);
            for (var i = 0; i < cells[j].length; i++) {
                seed = getNextRand(seed);
                cells[j][i] = Cell.getGrassCell(i, j, seed);
            }
        }
        return new LevelBackground(borderCell, cells);
    }
    static createMobGobelinAt(cell) {
        const mob = new Mob(
            getDungeonTileSetVilainSprite(0, 12),
            new AggroMobBrain(),
            MobSpells.basicAttack(),
            cell.i * 64, cell.j * 64);
        return mob;
    }
    static getGobelin1(levelId) {
        const map = LevelContent.createLevelBackground(30, 10);
        const mobs = [];
        mobs.push(LevelContent.createMobGobelinAt({ i: 1, j: 1 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 5, j: 4 }));

        mobs.push(LevelContent.createMobGobelinAt({ i: 12, j: 2 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 12, j: 4 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 12, j: 6 }));

        mobs.push(LevelContent.createMobGobelinAt({ i: 22, j: 2 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 22, j: 4 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 22, j: 6 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 24, j: 3 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 24, j: 5 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 24, j: 7 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 26, j: 3 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 26, j: 5 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 26, j: 7 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 28, j: 3 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 28, j: 5 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 28, j: 7 }));

        const levelDescription = new LevelDescription(levelId, allSpells.shotgun, ['A pack of mobs']);
        return new LevelContent(map, mobs, levelDescription);
    }

    static createMobSnailAt(cell) {
        const spell = MobSpells.crossAttack();
        spell.projectile.damage = 15;
        const mob = new Mob(
            getDungeonTileSetVilainSprite(15, 4),
            new AggroMobBrain(),
            spell,
            cell.i * 64, cell.j * 64);
        mob.speed = 1;
        mob.life = mob.maxLife = 500;
        return mob;
    }

    static getSnail1() {
        const map = LevelContent.createLevelBackground(18, 8);
        const mobs = [];
        mobs.push(LevelContent.createMobSnailAt({ i: 16, j: 3 }));
        const levelDescription = new LevelDescription('Snail', allSpells.protectSpell, ['A single strong boss']);
        return new LevelContent(map, mobs, levelDescription);
    }

    static createMobAngelAt(cell) {
        const spell = MobSpells.crossAttack();
        spell.projectile.damage = 5;
        const mob = new Mob(
            getDungeonTileSetVilainSprite(12, 4),
            new FearfullMobBrain(),
            spell,
            cell.i * 64, cell.j * 64);
        mob.speed = 6;
        return mob;
    }

    static getAngel1() {
        const map = LevelContent.createLevelBackground(10, 10);
        map.cells[0][0] = Cell.waterCell();
        map.cells[9][0] = Cell.waterCell();
        map.cells[0][9] = Cell.waterCell();
        map.cells[9][9] = Cell.waterCell();
        for (let i = 3; i <= 6; i++) {
            for (let j = 3; j <= 6; j++) {
                map.cells[i][j] = Cell.waterCell();
            }
        }
        const mobs = [];
        mobs.push(LevelContent.createMobAngelAt({ i: 7, j: 3 }));
        const levelDescription = new LevelDescription('Angel', allSpells.basicBow, ['A fearfull angel']);
        const level = new LevelContent(map, mobs, levelDescription);
        level.startingPosition = [{ i: 1, j: 4 }, { i: 2, j: 4 }]
        return level;
    }
    static createMobGobelinSorcererAt(cell) {
        const spell = MobSpells.rayHeal();        
        const mob = new Mob(
            getDungeonTileSetVilainSprite(1, 10),
            new SupportMobBrain(),
            spell,
            cell.i * 64, cell.j * 64);
        mob.speed = 3;
        return mob;
    }

    static getGobelinSorcerer1() {
        const map = LevelContent.createLevelBackground(16, 10);
        const mobs = [];
        mobs.push(LevelContent.createMobGobelinAt({ i: 10, j: 2 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 9, j: 3 }));
        mobs.push(LevelContent.createMobGobelinAt({ i: 10, j: 4 }));
        mobs.push(LevelContent.createMobGobelinSorcererAt({ i: 10, j: 3 }));
        const levelDescription = new LevelDescription('Gobelin tribe', allSpells.healRaySpell, ['Gobelins with their', 'sorcerer']);
        const level = new LevelContent(map, mobs, levelDescription);
        return level;
    }
    static internalGetLevelContent(levelId) {
        switch (levelId) {
            case 'gobelinSorcerer1': return LevelContent.getGobelinSorcerer1();
            case 'gobelin1': return LevelContent.getGobelin1("Gobelins");
            case 'snail1': return LevelContent.getSnail1();
            case 'angel1': return LevelContent.getAngel1();
        }
        return LevelContent.getGobelin1(levelId);
    }
    static getLevelContent(levelId) {
        const level = LevelContent.internalGetLevelContent(levelId);
        level.id = levelId;
        return level;
    }
}