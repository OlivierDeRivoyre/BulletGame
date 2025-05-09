const ravenTileSet = loadImg("RavenFantasyIcons32");
function getRavenSprite(i, j) {
    return new SimpleSprite(ravenTileSet, i * 32, j * 32, 32, 32);
}
const shikashiTileSet = loadImg("Shikashi");
function getShikashiTile(i, j) {
    return new SimpleSprite(shikashiTileSet, i * 32, j * 32, 32, 32);
}
const emptySprite = getShikashiTile(10, 1);
class Sounds {
    constructor() {
        function loadSound(name) {
            return new Audio("sound/" + name + ".wav");
        }
        this.lazer = loadSound("lazer");
        this.shotgun2b = loadSound("shotgun-2b");
    }
}
const sounds = new Sounds();

class BulletProjectile {
    constructor() {
        this.color = '#80F';
        this.speed = 20;
        this.range = 3;
        this.zIndex = 10;
    }
    onHit(mob) {
        return false;
    }
    paint(x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x, y, 6, 6);
    }
}
class RootingProjectile {
    constructor() {
        this.sprite = getRavenSprite(1, 48);
        this.spriteCorrectAngus = -0.75 * Math.PI;
        this.speed = 8;
        this.range = 5;
        this.radius = 12;
        this.zIndex = 20;
    }
    onHit(mob) {
        return false;
    }
    paint(x, y, anim) {
        this.sprite.paintRotate(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius,
            anim.angus + this.spriteCorrectAngus);
    }
}
class HealingProjectile {
    constructor() {
        this.sprite = getRavenSprite(10, 60);
        this.range = 3;
        this.speed = 18;
        this.radius = 12;
        this.zIndex = 20;
    }
    onHit(mob) {
        return false;
    }
    paint(x, y, anim) {
        const angus = anim.tick * -0.25;
        this.sprite.paintRotate(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius, angus);
    }
}
class HealAreaProjectile {
    constructor() {
        this.sprite = getRavenSprite(8, 60);
        this.radius = 2;
        this.zIndex = -10;
    }
    onHit(mob) {
        return true;
    }
    paint(x, y, anim) {
        const r = this.radius * 64 * (anim.tick + 1) / anim.maxTick;
        const nbItems = 20;
        for (let i = 0; i < nbItems; i++) {
            const angus = Math.PI * 2 * i / nbItems;
            this.sprite.paintScale(x + r * Math.cos(angus), y + r * Math.sin(angus), 12, 12);
        }
    }
}
class CircleAreaProjectile {
    constructor() {
        this.sprite = getRavenSprite(4, 48);
        this.radius = 1.5;
        this.zIndex = -10;
    }
    onHit(mob) {
        return true;
    }
    paint(x, y, anim) {
        const pxRadius = this.radius * 64;
        const angus = anim.tick * 0.01;
        this.sprite.paintRotate(x - pxRadius, y - pxRadius, pxRadius * 2, pxRadius * 2, angus);
    }
}
class ProjectileAnim {
    constructor(projectile, from, to) {
        this.projectile = projectile;
        const range = this.projectile.range * 64;
        const speed = this.projectile.speed;
        this.x = from.x;
        this.y = from.y;
        const hypo = Math.sqrt(square(to.x - this.x) + square(to.y - this.y));
        if (hypo < 0.001) {
            this.vx = speed;
            this.vy = 0;
        } else {
            this.vx = speed * (to.x - this.x) / hypo;
            this.vy = speed * (to.y - this.y) / hypo;
        }
        this.tick = 0;
        this.maxTick = 1 + range / speed;
        this.zIndex = this.projectile.zIndex || 10;
        this.angus = Math.atan2(this.vy, this.vx);
        this.endFunc = null;
    }
    update(world) {
        this.tick++;
        this.x += this.vx;
        this.y += this.vy;
        if (this.tick < this.maxTick) {
            return true;
        }
        if (this.endFunc != null) {
            this.endFunc({ x: this.x, y: this.y }, world);
        }
        return false;
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), this, camera);
    }
}

class DurationAnim {
    constructor(projectile, duration, coord) {
        this.projectile = projectile;
        this.maxTick = duration * 30;
        this.x = coord.x;
        this.y = coord.y;
        this.tick = 0;
        this.zIndex = this.projectile.zIndex || 10;
    }
    update(world) {
        this.tick++;
        return this.tick < this.maxTick;
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), this, camera);
    }
}
class NoSpell {
    constructor() {
        this.sprite = emptySprite;
    }
    trigger(player, mouseCoord, world) {
    }
}
class ThrowProjectileSpell {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0;
        this.cooldown = 0.7;
        this.sprite = getRavenSprite(0, 93);
        this.endFunc = null;
    }
    trigger(player, mouseCoord, world) {
        const anim = new ProjectileAnim(this.projectile, player.getCenterCoord(), mouseCoord);
        if (this.endFunc != null) {
            const self = this;
            anim.endFunc = function (coord) {
                self.endFunc(coord, player, world);
            }
        }
        world.addProjectile(anim, player);
        sounds.lazer.play();
        return true;
    }
}
class ShotgunAttack {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0;
        this.cooldown = 5;
        this.sprite = getRavenSprite(2, 62);
    }
    trigger(player, mouseCoord, world) {
        const from = player.getCenterCoord();
        const baseAngus = Math.atan2(mouseCoord.y - from.y, mouseCoord.x - from.x);
        for (let i = 1; i <= 5; i++) {
            const angus = baseAngus + (i - 3) * 0.20;
            const target = {
                x: from.x + 256 * Math.cos(angus),
                y: from.y + 256 * Math.sin(angus),
            };
            const anim = new ProjectileAnim(this.projectile, from, target);
            world.addProjectile(anim, player);
        }
        sounds.shotgun2b.play();
        return true;
    }
}
class ZoneSpell {
    static maxRangeCoord(from, to, maxRange) {
        const d = Math.sqrt(square(to.x - from.x) + square(to.y - from.y));
        if (d < maxRange) {
            return { x: to.x, y: to.y };
        }
        const ratio = maxRange / d;
        return {
            x: from.x + (to.x - from.x) * ratio,
            y: from.y + (to.y - from.y) * ratio,
        }
    }
    constructor(projectile) {
        this.projectile = projectile;
        this.sprite = projectile.sprite;
        this.castingTime = 0;
        this.cooldown = 5;
        this.range = 5;
        this.radius = 5;
        this.duration = 5;
    }
    trigger(player, mouseCoord, world) {
        const center = ZoneSpell.maxRangeCoord(player.getCenterCoord(), mouseCoord, this.range * 64);
        const anim = new DurationAnim(this.projectile, this.duration, center);
        world.addProjectile(anim, player);
        return true;
    }
}
class ProtectSpell {
    constructor() {
        this.sprite = getRavenSprite(2, 113);;
        this.castingTime = 0;
        this.cooldown = 20;
        this.duration = 1.5;
        this.zIndex = -10;
    }
    trigger(player, mouseCoord, world) {
        const anim = new DurationAnim(this, this.duration, player.getCenterCoord());
        anim.player = player;
        world.addProjectile(anim, player);
        return true;
    }
    paint(x, y, anim, camera) {
        const coord = anim.player.getCenterCoord();
        const size = 64;
        this.sprite.paintScale(camera.toCanvasX(coord.x) - size / 2, camera.toCanvasY(coord.y) - size / 2,
            size, size);
    }
}

class AllSpells {

    constructor() {
        this.noSpell = AllSpells.noSpell();
        this.basicAttack = AllSpells.basicAttack();
        this.shotgun = AllSpells.shotgun();
        this.curseGround = AllSpells.curseGround();
        this.rootingProjectile = AllSpells.rootingProjectile();
        this.healProjectile = AllSpells.healProjectile();
        this.protectSpell = AllSpells.protectSpell();
    }
    static noSpell() {
        return new NoSpell();
    }
    static basicAttack() {
        return new ThrowProjectileSpell(new BulletProjectile());
    }
    static shotgun() {
        let projectile = new BulletProjectile();
        projectile.color = '#f60';
        projectile.range = 2;
        return new ShotgunAttack(projectile);
    }
    static curseGround() {
        return new ZoneSpell(new CircleAreaProjectile());
    }
    static rootingProjectile() {
        const projectile = new RootingProjectile();
        const rootingProjectile = new ThrowProjectileSpell(projectile);
        rootingProjectile.sprite = projectile.sprite;
        rootingProjectile.cooldown = 8;
        return rootingProjectile;
    }
    static healProjectile() {
        const projectile = new HealingProjectile();
        const rootingProjectile = new ThrowProjectileSpell(projectile);
        rootingProjectile.cooldown = 10;
        rootingProjectile.sprite = projectile.sprite;
        rootingProjectile.endFunc = function (coord, player, world) {
            const healZone = new HealAreaProjectile();
            const anim = new DurationAnim(healZone, 0.2, coord);
            world.addProjectile(anim, player);
        }
        return rootingProjectile;
    }
    static protectSpell() {
        return new ProtectSpell();
    }
}
const allSpells = new AllSpells();