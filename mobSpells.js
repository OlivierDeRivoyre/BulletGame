
class MobBasicAttack {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0;
        this.cooldown = 1;
        this.range = projectile.range;
    }
    trigger(mob, target, worldLevel) {
        const anim = new ProjectileAnim(this.projectile, mob.getCenterCoord(), target, mob);
        anim.targerPlayers = true;
        anim.targerMobs = false;
        worldLevel.addProjectile(anim, mob);
        return true;
    }
}

class MobPatternAttack {
    constructor(projectile, patterns) {
        this.projectile = projectile;
        this.castingTime = 0;
        this.cooldown = 1;
        this.range = projectile.range;
        this.patterns = patterns;
        this.currentPatternIndex = 0;
        this.sound = null;
    }
    trigger(mob, target, worldLevel) {
        const currentPattern = this.patterns[(this.currentPatternIndex++) % this.patterns.length];
        currentPattern.trigger(this.projectile, mob, target, worldLevel);
        if (this.sound) {
            this.sound.play();
        }
        return true;
    }
}
class CrossPattern {
    trigger(projectile, mob, target, worldLevel) {
        const center = mob.getCenterCoord();
        for (const dest of [{ i: 100, j: 0 }, { i: 0, j: 100 }, { i: -100, j: 0 }, { i: 0, j: -100 }]) {
            const target = { x: center.x + dest.i, y: center.y + dest.j };
            const anim = new ProjectileAnim(projectile, center, target, mob);
            anim.targerPlayers = true;
            anim.targerMobs = false;
            worldLevel.addProjectile(anim, mob);
        }
    }
}
class CrossDiagPattern {
    trigger(projectile, mob, target, worldLevel) {
        const center = mob.getCenterCoord();
        for (const dest of [{ i: 100, j: 100 }, { i: -100, j: 100 }, { i: -100, j: -100 }, { i: 100, j: -100 }]) {
            const target = { x: center.x + dest.i, y: center.y + dest.j };
            const anim = new ProjectileAnim(projectile, center, target, mob);
            anim.targerPlayers = true;
            anim.targerMobs = false;
            worldLevel.addProjectile(anim, mob);
        }
    }
}

class MobRayHealSpell {
    constructor() {
        this.raySprite = new RaySprite();
        this.targetMob = null;
        this.targerPlayers = false;
        this.targerMobs = false;
        this.zIndex = 10;
        this.tickEnd = -999;
        this.duration = 64;
        this.radius = 4;
        this.healPerSecond = 30;
    }
    checkHit(){

    }
    trigger(mob, targetMob, worldLevel) {
        this.fromMob = mob;
        this.targetMob = targetMob;
        this.tickEnd = tickNumber + this.duration;
        worldLevel.addProjectile(this);
    }
    update(worldLevel) {
        if (tickNumber % 10 == 0 && this.targetMob && this.targetMob.life > 0) {
            this.targetMob.onHeal(Math.ceil(this.healPerSecond * 10 / 30));
        }
        return tickNumber <this.tickEnd && this.fromMob.life > 0;
    }
    paint(camera) {
        if(!this.targetMob){
            return;
        }
        const from = this.fromMob.getCenterCoord();
        const to = this.targetMob.getCenterCoord();
        const angus = Math.atan2(to.y - from.y, to.x - from.x);
        const distance = computeDistance(from, to);
        this.raySprite.paint(camera, from, angus, this.radius * 64, distance);
    }

}

class MobSpells {
    static basicAttack() {
        const projectile = new BulletProjectile();
        projectile.color = 'red';
        projectile.speed = 5;
        projectile.range = 7;
        let spell = new MobBasicAttack(projectile);
        return spell;
    }
    static crossAttack() {
        const projectile = new BulletProjectile();
        projectile.color = 'red';
        projectile.speed = 5;
        projectile.range = 7;
        const spell = new MobPatternAttack(projectile, [new CrossPattern(), new CrossDiagPattern()]);
        spell.sound = sounds.lazerLow1;
        return spell;
    }
    static rayHeal() {
        return new MobRayHealSpell();
    }
}
