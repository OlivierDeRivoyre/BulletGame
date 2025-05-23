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
class MySound {
    constructor(fileName, volume) {
        this.audio = new Audio("sound/" + fileName + ".wav");;
        this.audio.volume = volume !== undefined ? volume : 1;
    }
    play() {
        this.audio.play().catch((err) => { });
    }
}
class Sounds {
    constructor() {
        this.lazer = new MySound("lazer");
        this.shotgun2b = new MySound("shotgun-2b", 0.5);
        this.magicMissile = new MySound("magicMissile", 0.5);
        this.bubble = new MySound("bubble");
        this.houseKick = new MySound("houseKick", 0.3);
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
    hit(character, worldLevel, fromCharacter) {
        character.onHit(this.damage, worldLevel, this, fromCharacter);
        return false;
    }
}
class RootingProjectile {
    constructor() {
        this.sprite = buffSprites.root;
        this.spriteCorrectAngus = -0.75 * Math.PI;
        this.speed = 8;
        this.range = 5;
        this.radius = 12;
        this.zIndex = 20;
        this.damage = 1;
        this.rootDuration = 5;
    }
    paint(x, y, anim) {
        this.sprite.paintRotate(x - this.radius, y - this.radius, 2 * this.radius, 2 * this.radius,
            anim.angus + this.spriteCorrectAngus);
    }
    hit(character, worldLevel, fromCharacter) {
        character.addBuff(new Buff(BuffId.root, allBuffTypes.root, this.rootDuration), fromCharacter);
        character.onHit(this.damage, worldLevel, this, fromCharacter);
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
    hit(character, worldLevel, fromCharacter) {
        character.onHit(this.damage, worldLevel, this, fromCharacter);
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
    checkHit(anim, character, worldLevel) {
        if (anim.tick != 1) {
            return true;
        }
        if (!ProjectileAnim.isHitting(character, anim, this.radius * 64)) {
            return true;
        }
        character.onHeal(this.heal, worldLevel, this, anim.fromCharacter);
        return true;
    }
}
class CircleAreaProjectile {
    constructor() {
        this.sprite = getRavenSprite(4, 48);
        this.radius = 1.0;
        this.zIndex = -10;
        this.damage = 5;
        this.periodSec = 0.5;
    }
    paint(x, y, anim) {
        const pxRadius = this.radius * 64;
        const angus = tickNumber * 0.01;
        //this.sprite.paintScale(x - pxRadius, y - pxRadius, pxRadius * 2, pxRadius * 2, angus);
        this.sprite.paintRotate(x - pxRadius, y - pxRadius, pxRadius * 2, pxRadius * 2, angus);
    }
    checkHit(projectile, character, worldLevel, fromCharacter) {
        const period = Math.ceil(30 * this.periodSec);
        if (projectile.tick % period != 1) {
            return true;
        }
        if (!ProjectileAnim.isHitting(character, projectile, this.radius * 64)) {
            return true;
        }
        return this.hit(character, worldLevel, fromCharacter);
    }
    hit(character, worldLevel, fromCharacter) {
        character.onHit(this.damage, worldLevel, this, fromCharacter);
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
    constructor(projectile, from, to, fromCharacter) {
        this.projectile = projectile;
        const range = this.projectile.range * 64;
        const speed = this.projectile.speed;
        this.x = from.x;
        this.y = from.y;
        this.fromCharacter = fromCharacter;
        if (!fromCharacter) {
            throw new Error("fromChar undefined");
        }
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
    update(worldLevel) {
        this.tick++;
        this.x += this.vx;
        this.y += this.vy;
        if (this.tick < this.maxTick) {
            return true;
        }
        if (this.endFunc != null) {
            this.endFunc({ x: this.x, y: this.y }, worldLevel, this.fromCharacter);
        }
        return false;
    }
    checkHit(character, worldLevel) {
        if (!ProjectileAnim.isHitting(character, this, this.projectile.radius)) {
            return true;
        }
        const alive = this.projectile.hit(character, worldLevel, this.fromCharacter);
        if (!alive && this.endFunc != null) {
            this.endFunc({ x: this.x, y: this.y }, worldLevel, this.fromCharacter);
        }
        return alive;
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), this, camera);
    }
}

class DurationAnim {
    constructor(projectile, duration, coord, fromCharacter) {
        this.projectile = projectile;
        this.maxTick = duration * 30;
        this.x = coord.x;
        this.y = coord.y;
        this.fromCharacter = fromCharacter;
        this.tick = 0;
        this.zIndex = this.projectile.zIndex || 10;
        this.targerPlayers = false;
        this.targerMobs = true;
    }
    update(worldLevel) {
        this.tick++;
        return this.tick < this.maxTick;
    }
    checkHit(character, worldLevel) {
        return this.projectile.checkHit(this, character, worldLevel, this.fromCharacter);
    }
    paint(camera) {
        this.projectile.paint(camera.toCanvasX(this.x), camera.toCanvasY(this.y), this, camera);
    }
}
class NoSpell {
    constructor() {
        this.sprite = emptySprite;
    }
    trigger(player, mouseCoord, worldLevel) {
    }
}
class ThrowProjectileSpell {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0.2;
        this.cooldown = 0.5;
        this.sprite = getRavenSprite(0, 93);
        this.endFunc = null;
        this.mana = 0;
        this.sound = sounds.lazer;
    }
    trigger(player, mouseCoord, worldLevel) {
        const anim = new ProjectileAnim(this.projectile, player.getCenterCoord(), mouseCoord, player);
        if (this.endFunc != null) {
            const self = this;
            anim.endFunc = function (coord) {
                self.endFunc(coord, player, worldLevel);
            }
        }
        worldLevel.addProjectile(anim, player);
        this.sound.play();
        return true;
    }
}
class ShotgunAttack {
    constructor(projectile) {
        this.projectile = projectile;
        this.castingTime = 0.2;
        this.cooldown = 10;
        this.mana = 10;
        this.sprite = getRavenSprite(2, 62);
    }
    trigger(player, mouseCoord, worldLevel) {
        const from = player.getCenterCoord();
        const baseAngus = Math.atan2(mouseCoord.y - from.y, mouseCoord.x - from.x);
        for (let i = 1; i <= 5; i++) {
            const angus = baseAngus + (i - 3) * 0.20;
            const target = {
                x: from.x + 256 * Math.cos(angus),
                y: from.y + 256 * Math.sin(angus),
            };
            const anim = new ProjectileAnim(this.projectile, from, target, player);
            worldLevel.addProjectile(anim, player);
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
        this.castingTime = 0.2;
        this.cooldown = 5;
        this.range = 5;
        this.radius = 1;
        this.duration = 5;
        this.mana = 10;
    }
    trigger(player, mouseCoord, worldLevel) {
        const center = ZoneSpell.maxRangeCoord(player.getCenterCoord(), mouseCoord, this.range * 64);
        const anim = new DurationAnim(this.projectile, this.duration, center, player);
        worldLevel.addProjectile(anim, player);
        sounds.magicMissile.play();
        return true;
    }
}
class ProtectSpell {
    constructor() {
        this.sprite = buffSprites.shield;
        this.castingTime = 0.2;
        this.mana = 5;
        this.cooldown = 5;
        this.duration = 1;
        this.zIndex = -10;
    }
    trigger(player, mouseCoord, worldLevel) {
        const buff = new Buff(BuffId.shield, allBuffTypes.shield, this.duration);
        player.addBuff(buff, player);
        sounds.houseKick.play();
        return true;
    }
}
class BuffId {
    static shield = 'shield';
    static root = 'root';
    static slow = 'slow';
}
class BuffSprites {
    constructor() {
        this.root = getRavenSprite(1, 48);
        this.shield = getRavenSprite(2, 113);

        for (let id of Object.keys(this)) {
            this[id].id = id;
        }
    }
}
const buffSprites = new BuffSprites();

class BuffType {
    constructor(sprite) {
        this.id = "";
        this.sprite = sprite;
        this.paintFunc = null;
    }
}
class AllBuffTypes {
    constructor() {
        this.root = new BuffType(buffSprites.root);
        this.shield = new BuffType(buffSprites.shield);
        this.shield.paintFunc = function (character, camera) {
            const coord = character.getCenterCoord();
            const size = 64;
            buffSprites.shield.paintScale(camera.toCanvasX(coord.x) - size / 2, camera.toCanvasY(coord.y) - size / 2,
                size, size);
        };
        for (let id of Object.keys(this)) {
            this[id].id = id;
        }
    }
}
const allBuffTypes = new AllBuffTypes();

class Buff {
    constructor(id, buffType, duration) {
        this.id = id;
        this.buffType = buffType;
        this.sprite = buffType.sprite;
        this.duration = duration;
        this.value = null;
        this.paintFunc = buffType.paintFunc;
        this.endTick = -1;
    }
    getMsg() {
        return {
            id: this.id,
            type: this.buffType.id,
            duration: this.duration,
            endTick: this.endTick,
            value: this.value,
        }
    }
    static fromMsg(msg){
        const buff = new Buff(msg.id, allBuffTypes[msg.type], msg.duration);
        buff.endTick = msg.endTick;
        buff.value = msg.value;
        return buff;
    }
}

class SpellDescription{
    constructor(location, name, color, desc){
        this.location = location;
        this.name = name;
        this.color = color;
        this.desc = desc;
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

        for (let id of Object.keys(this)) {
            this[id].id = id;
        }
    }
    static noSpell() {
        const spell = new NoSpell();
        spell.description = new SpellDescription('', 'None', "white", []);
        return spell;
    }
    static basicAttack() {
        const spell = new ThrowProjectileSpell(new BulletProjectile());
        spell.cooldown = 0.3;
        spell.castingTime = 0;
        spell.description = new SpellDescription("Mouse 1", "Basic attack", "white", ["A manaless fast attack"]);
        return spell;
    }
    static shotgun() {
        let projectile = new BulletProjectile();
        projectile.color = '#f60';
        projectile.range = 2;
        projectile.damage = 3;
        const spell = new ShotgunAttack(projectile);
        spell.castingTime = 0.2;
        spell.cooldown = 2;
        spell.mana = 20;
        spell.description = new SpellDescription("Mouse 2", "Shotgun", "orange", ["Fire multiple shots"]);
        return spell;
    }
    static curseGround() {
        const spell = new ZoneSpell(new CircleAreaProjectile());
        spell.castingTime = 0.5;
        spell.cooldown = 5;
        spell.range = 5;
        spell.radius = 5;
        spell.duration = 5;
        spell.mana = 25;
        spell.description = new SpellDescription("Mouse 2", "Curse Ground", "purple", ["Curse a large ground area"]);        
        return spell;
    }
    static rootingProjectile() {
        const projectile = new RootingProjectile();
        projectile.rootDuration = 5;
        const spell = new ThrowProjectileSpell(projectile);
        spell.sprite = projectile.sprite;
        spell.cooldown = 8;
        spell.mana = 25;
        spell.sound = sounds.magicMissile;       
        spell.description = new SpellDescription("Mouse 2", "Rooting Projectile", "purple", ["Fire a projectile that root"]);
        return spell;
    }
    static healProjectile() {
        const projectile = new HealingProjectile();
        const spell = new ThrowProjectileSpell(projectile);
        spell.cooldown = 10;
        spell.mana = 35;
        spell.castingTime = 1;
        spell.sprite = projectile.sprite;
        spell.sound = sounds.magicMissile;
        spell.endFunc = function (coord, fromCharacter, worldLevel) {
            const healZone = new HealAreaProjectile();
            const anim = new DurationAnim(healZone, 0.2, coord, fromCharacter);
            anim.targerMobs = false;
            anim.targerPlayers = true;
            worldLevel.addProjectile(anim, fromCharacter);
            sounds.bubble.play();
        }        
        spell.description = new SpellDescription("Space", "Heal Projectile", "green", ["Fire a projectile that heal on impact"]);        
        return spell;
    }
    static protectSpell() {
        const spell = new ProtectSpell();
        spell.castingTime = 0;
        spell.mana = 5;
        spell.cooldown = 4;
        spell.duration = 1.5;      
        spell.description = new SpellDescription("Space", "Protection", "blue", ["Block an attack"]);              
        return spell;
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
    trigger(mob, target, worldLevel) {
        const anim = new ProjectileAnim(this.projectile, mob.getCenterCoord(), target, mob);
        anim.targerPlayers = true;
        anim.targerMobs = false;
        worldLevel.addProjectile(anim, mob);
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