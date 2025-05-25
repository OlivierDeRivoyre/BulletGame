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
        const borderCell = new Cell([cellSpriteFactory.water], { canWalk: false });
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
    static createMob1At(cell) {
        const mob = new Mob(
            getDungeonTileSetVilainSprite(0, 12),
            new AggroMobBrain(),
            MobSpells.basicAttack(),
            cell.i * 64, cell.j * 64);
        return mob;
    }
    static getDefaultLevel(levelId) {
        const map = LevelContent.createLevelBackground(30, 10);
        const mobs = [];
        mobs.push(LevelContent.createMob1At({ i: 1, j: 1 }));
        mobs.push(LevelContent.createMob1At({ i: 5, j: 4 }));

        mobs.push(LevelContent.createMob1At({ i: 12, j: 2 }));
        mobs.push(LevelContent.createMob1At({ i: 12, j: 4 }));
        mobs.push(LevelContent.createMob1At({ i: 12, j: 6 }));

        mobs.push(LevelContent.createMob1At({ i: 22, j: 2 }));
        mobs.push(LevelContent.createMob1At({ i: 22, j: 4 }));
        mobs.push(LevelContent.createMob1At({ i: 22, j: 6 }));
        mobs.push(LevelContent.createMob1At({ i: 24, j: 3 }));
        mobs.push(LevelContent.createMob1At({ i: 24, j: 5 }));
        mobs.push(LevelContent.createMob1At({ i: 24, j: 7 }));
        mobs.push(LevelContent.createMob1At({ i: 26, j: 3 }));
        mobs.push(LevelContent.createMob1At({ i: 26, j: 5 }));
        mobs.push(LevelContent.createMob1At({ i: 26, j: 7 }));
        mobs.push(LevelContent.createMob1At({ i: 28, j: 3 }));
        mobs.push(LevelContent.createMob1At({ i: 28, j: 5 }));
        mobs.push(LevelContent.createMob1At({ i: 28, j: 7 }));

        const levelDescription = new LevelDescription(levelId, null, []);
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

    static getLevelContent(levelId) {
        switch (levelId) {
            case 'snail1': return LevelContent.getSnail1();
        }
        return LevelContent.getDefaultLevel(levelId);
    }
}