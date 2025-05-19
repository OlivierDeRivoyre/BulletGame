
class LevelContent {
    constructor() {
        this.map = new LevelBackground();
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
    static createMob1At(cell) {
        const mob = new Mob(getDungeonTileSetVilainSprite(0, 12), new AggroMobBrain(),
            mobSpells.basicAttack, cell.i * 64, cell.j * 64);
        return mob;
    }
}