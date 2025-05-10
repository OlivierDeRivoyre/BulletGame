const ravenTileSet = loadImg("RavenFantasyIcons32");
function getRavenSprite(i, j) {
    return new SimpleSprite(ravenTileSet, i * 32, j * 32, 32, 32);
}
const shikashiTileSet = loadImg("Shikashi");
function getShikashiTile(i, j) {
    return new SimpleSprite(shikashiTileSet, i * 32, j * 32, 32, 32);
}
const emptySprite = getShikashiTile(10, 1);
const deadSprite = getShikashiTile(0, 0);
class Sounds {
    constructor() {
        function loadSound(name) {
            return new Audio("sound/" + name + ".wav");
        }
        this.lazer = loadSound("lazer");
        this.shotgun2b = loadSound("shotgun-2b");
        this.shotgun2b.volume = 0.5;
        this.magicMissile = loadSound("magicMissile");
        this.magicMissile.volume = 0.5;
        this.bubble = loadSound("bubble");
        this.houseKick = loadSound("houseKick");
        this.houseKick.volume = 0.3;
    }
}
const sounds = new Sounds();

class BulletProjectile {
    constructor() {
        this.color = '#80F';
        this.speed = 20;
        this.range = 3;
        this.zIndex = 10;
        this.radius = 3;
        this.damage = 5;
    }
    paint(x, y) {
        ctx.fillStyle = this.color;
        ctx.fillRect(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius);
    }
    hit(character, world) {
        character.onHit(this.damage, world, this);
        return false;
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
        this.damage = 1;
        this.rootDuration = 2;
    }
    paint(x, y, anim) {
        this.sprite.paintRotate(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius,
            anim.angus + this.spriteCorrectAngus);
    }
    hit(character, world) {
        character.addBuff(new Buff(BuffId.root, this.sprite, this.rootDuration));
        character.onHit(this.damage, world, this);
        return false;
    }
}
class HealingProjectile {
    constructor() {
        this.sprite = getRavenSprite(10, 60);
        this.range = 3;
        this.speed = 18;
        this.radius = 12;
        this.zIndex = 20;
        this.damage = 5;
    }

    paint(x, y, anim) {
        const angus = tickNumber * -0.25;
        this.sprite.paintRotate(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius, angus);
    }
    hit(character, world) {
        character.onHit(this.damage, world, this);
        return false;
    }
}
class HealAreaProjectile {
    constructor() {
        this.sprite = getRavenSprite(8, 60);
        this.radius = 2;
        this.zIndex = -10;
        this.heal = 20;
    }
    paint(x, y, anim) {
        const r = this.radius * 64 * (anim.tick + 1) / anim.maxTick;
        const nbItems = 20;
        for (let i = 0; i < nbItems; i++) {
            const angus = Math.PI * 2 * i / nbItems;
            this.sprite.paintScale(x + r * Math.cos(angus), y + r * Math.sin(angus), 12, 12);
        }
    }
    checkHit(projectile, character, world) {
        if (projectile.tick != 1) {
            return true;
        }
        if (!ProjectileAnim.isHitting(character, projectile, this.radius * 64)) {
            return true;
        }
        character.onHeal(this.heal, world, this);
        return true;
    }
}
class CircleAreaProjectile {
    constructor() {
        this.sprite = getRavenSprite(4, 48);
        this.radius = 1.5;
        this.zIndex = -10;
        this.damage = 1;
        this.periodSec = 0.5;
    }
    paint(x, y, anim) {
        const pxRadius = this.radius * 64;
        const angus = tickNumber * 0.01;
        //this.sprite.paintScale(x - pxRadius, y - pxRadius, pxRadius * 2, pxRadius * 2, angus);
        this.sprite.paintRotate(x - pxRadius, y - pxRadius, pxRadius * 2, pxRadius * 2, angus);
    }
    checkHit(projectile, character, world) {
        const period = Math.ceil(30 * this.periodSec);
        if (projectile.tick % period != 1) {
            return true;
        }
        if (!ProjectileAnim.isHitting(character, projectile, this.radius * 64)) {
            return true;
        }
        return this.hit(character, world);
    }
    hit(character, world) {
        character.onHit(this.damage, world, this);
        return true;//keep alive the anim
    }
}
class ProjectileAnim {
    static isHitting(character, bulletCoord, bulletRadius) {
        const cCoord = character.getCenterCoord();
        const cRadius = character.sprite.tWidth * 2;
        const d = square(cCoord.x - bulletCoord.x) + square(cCoord.y - bulletCoord.y)
        const r2 = square(cRadius + bulletRadius);
        return d < r2;
    }
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
        this.targerPlayers = false;
        this.targerMobs = true;
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
    checkHit(character, world) {
        if (!ProjectileAnim.isHitting(character, this, this.projectile.radius)) {
            return true;
        }
        const alive = this.projectile.hit(character, world);
        if (!alive && this.endFunc != null) {
            this.endFunc({ x: this.x, y: this.y }, world);
        }
        return alive;
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
        this.targerPlayers = false;
        this.targerMobs = true;
    }
    update(world) {
        this.tick++;
        return this.tick < this.maxTick;
    }
    checkHit(character, world) {
        return this.projectile.checkHit(this, character, world);
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
        this.sound = sounds.lazer;
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
        this.sound.play();
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
        sounds.magicMissile.play();
        return true;
    }
}
class ProtectSpell {
    constructor() {
        this.sprite = getRavenSprite(2, 113);;
        this.castingTime = 0;
        this.cooldown = 8;
        this.duration = 1.5;
        this.zIndex = -10;
    }
    trigger(player, mouseCoord, world) {
        const buff = new Buff(BuffId.shield, this.sprite, this.duration);
        buff.paintFunc = function (camera) {
            const coord = player.getCenterCoord();
            const size = 64;
            this.sprite.paintScale(camera.toCanvasX(coord.x) - size / 2, camera.toCanvasY(coord.y) - size / 2,
                size, size);
        };
        player.addBuff(buff);
        sounds.houseKick.play();
        return true;
    }
}
class BuffId {
    static shield = 'shield';
    static root = 'root';
    static slow = 'slow';
}
class Buff {
    constructor(id, sprite, duration) {
        this.id = id;
        this.sprite = sprite;
        this.duration = duration;
        this.value = null;
        this.paintFunc = null;
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
        let spell = new ThrowProjectileSpell(new BulletProjectile());
        spell.cooldown = 0.3;
        return spell;
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
        const spell = new ThrowProjectileSpell(projectile);
        spell.sprite = projectile.sprite;
        spell.cooldown = 8;
        spell.sound = sounds.magicMissile;
        return spell;
    }
    static healProjectile() {
        const projectile = new HealingProjectile();
        const spell = new ThrowProjectileSpell(projectile);
        spell.cooldown = 10;
        spell.sprite = projectile.sprite;
        spell.sound = sounds.magicMissile;
        spell.endFunc = function (coord, player, world) {
            const healZone = new HealAreaProjectile();
            const anim = new DurationAnim(healZone, 0.2, coord);
            anim.targerMobs = false;
            anim.targerPlayers = true;
            world.addProjectile(anim, player);
            sounds.bubble.play();
        }
        return spell;
    }
    static protectSpell() {
        return new ProtectSpell();
    }
}
const allSpells = new AllSpells();


class MobBasicAttack {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0;
        this.cooldown = 1;
        this.range = projectile.range;
    }
    trigger(mob, target, world) {
        const anim = new ProjectileAnim(this.projectile, mob.getCenterCoord(), target);
        anim.targerPlayers = true;
        anim.targerMobs = false;
        world.addProjectile(anim, mob);
        return true;
    }
}

class MobSpells {
    constructor() {
        this.basicAttack = MobSpells.basicAttack();
    }
    static basicAttack() {
        const projectile = new BulletProjectile();
        projectile.color = 'red';
        projectile.speed = 5;
        projectile.range = 7;
        let spell = new MobBasicAttack(projectile);
        return spell;
    }
}
const mobSpells = new MobSpells();