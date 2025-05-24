
class LevelContent {
    constructor() {
        this.map = LevelContent.createLevelBackground();
        this.mobs = [];
        this.mobs.push(LevelContent.createMob1At({ i: 1, j: 1 }));
        this.mobs.push(LevelContent.createMob1At({ i: 5, j: 4 }));

        this.mobs.push(LevelContent.createMob1At({ i: 12, j: 2 }));
        this.mobs.push(LevelContent.createMob1At({ i: 12, j: 4 }));
        this.mobs.push(LevelContent.createMob1At({ i: 12, j: 6 }));

        this.mobs.push(LevelContent.createMob1At({ i: 22, j: 2 }));
        this.mobs.push(LevelContent.createMob1At({ i: 22, j: 4 }));
        this.mobs.push(LevelContent.createMob1At({ i: 22, j: 6 }));
        this.mobs.push(LevelContent.createMob1At({ i: 24, j: 3 }));
        this.mobs.push(LevelContent.createMob1At({ i: 24, j: 5 }));
        this.mobs.push(LevelContent.createMob1At({ i: 24, j: 7 }));
        this.mobs.push(LevelContent.createMob1At({ i: 26, j: 3 }));
        this.mobs.push(LevelContent.createMob1At({ i: 26, j: 5 }));
        this.mobs.push(LevelContent.createMob1At({ i: 26, j: 7 }));
        this.mobs.push(LevelContent.createMob1At({ i: 28, j: 3 }));
        this.mobs.push(LevelContent.createMob1At({ i: 28, j: 5 }));
        this.mobs.push(LevelContent.createMob1At({ i: 28, j: 7 }));
    }
    static createLevelBackground(){
        const borderCell = new Cell([cellSpriteFactory.water], { canWalk: false });
        const cells = new Array(10);
        let seed = 1;
        for (var j = 0; j < cells.length; j++) {
            cells[j] = new Array(30);
            for (var i = 0; i < cells[j].length; i++) {
                seed = getNextRand(seed);
                cells[j][i] = Cell.getGrassCell(i, j, seed);
            }
        }
        return new LevelBackground(borderCell, cells);
    }
    static createMob1At(cell) {
        const mob = new Mob(getDungeonTileSetVilainSprite(0, 12), new AggroMobBrain(),
            mobSpells.basicAttack, cell.i * 64, cell.j * 64);
        return mob;
    }
}