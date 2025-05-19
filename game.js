const CanvasCellWidth = 16;
const CanvasCellHeight = 9;
const CanvasWidth = 64 * CanvasCellWidth;//1024
const CanvasHeight = 64 * CanvasCellHeight;//576
const canvas = document.createElement("canvas");
canvas.width = CanvasWidth;
canvas.height = CanvasHeight;
canvas.style.imageRendering = 'pixelated';
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;

class Input {
    constructor() {
        this.keysPressed = {
            left: false,
            right: false,
            up: false,
            down: false,
            s1: false,
            s2: false,
            s3: false,
            s4: false,
        };
        this.mouse = { x: 0, y: 0 };
        this.mouseClicked = false;
        this.mouse2Clicked = false;
        window.addEventListener('keydown', (e) => this.keydown(e), false);
        window.addEventListener('keyup', (e) => this.keyup(e), false);
        window.addEventListener('contextmenu', (e) => this.contextmenu(e), false);
    }

    keyPressed(pressed, event) {
        //console.log('keyPressed ' + event.code + '  ' + pressed)
        if (event.keyCode == 37 || event.code == 'KeyA') {
            this.keysPressed.left = pressed;
        } else if (event.keyCode == 39 || event.code == 'KeyD') {
            this.keysPressed.right = pressed;
        } else if (event.keyCode == 38 || event.code == 'KeyW') {
            this.keysPressed.up = pressed;
        } else if (event.keyCode == 40 || event.code == 'KeyS') {
            this.keysPressed.down = pressed;
        } else if (event.code == 'KeyQ') {
            this.keysPressed.s1 = pressed;
        } else if (event.code == 'KeyE') {
            this.keysPressed.s2 = pressed;
        } else if (event.code == 'KeyF') {
            this.keysPressed.s3 = pressed;
        } else if (event.code == 'Space') {
            this.keysPressed.s4 = pressed;
        }
        if (event.key == 'Escape') {
            
        }
    }
    keydown(event) {
        this.keyPressed(true, event);
    }
    keyup(event) {
        this.keyPressed(false, event);
    }
    mouseMove(mouse) {
        this.mouse = mouse;
    }
    mouseButton(mouse, pressed, rightclick) {
        this.mouse = mouse;
        if (rightclick) {
            this.mouse2Clicked = pressed;
        } else {
            this.mouseClicked = pressed;
        }
    }
    contextmenu(e) {
        e.preventDefault();
        return false;
    }
}
const input = new Input();

const params = new URLSearchParams(window.location.search);
const server = params.get("server");
const isServer = !server;
let lastPeerId = localStorage.getItem("bulletLastPeerId");
if (!isServer || !lastPeerId) {
    lastPeerId = undefined;
}
const logName = isServer ? 'SERVER' : 'CLIENT';

async function initPeer() {
    const iceToken = "WQe3H2X3uc01WkyRats9lpPp+5vRLYTJZkXRCn11Cy8EkczuRznplSXwjdTxFjnCtbVu3/RGTP2yaAUC8yP59TAXMuxG9gxAc2BrdHocOjfKg61NYFZdZcnXWwk9YAq74iQugGWZrWwquR89HswYDIp6VZnoMYifdLzJCy/oRYDrrt7DOO/HxKcuXVWAxPx3+18BNKfPRV1NtPejGcDrStMIY3gHvkEJ3GH05P77JXt6C/tL/daIpjUM3DIKvVJhgTBYB9zW13zH7wCuZjAUR33dNGPv5dOXzs5k96AGiC4rM8U+z2o6FJnFHsQSl3BATRYKpCyGuLfighdMuBEjEqfbwrzpaFUTZLmzDYHaS7F/9Wu26KYOtaKugx/SV6G74ZKcE00MafVr5pbwY31dOXX17yadUabWq46ldpXYlMDLwxPrWFmLpEDYaM2/pzC7bzpqtluYw5QynalsSwAhSvACvMmcM+x33yZbvcTAOUJ5PnDGWBLR9wJCWZtwIDlkyOYzMBwpaiH5XwIrabrWRmBXc9tB/1Xi/C1/8vzSNRaLAcFDbXbqJbNfdgD05IIwicgggNQxPmMbOb3pUylaUjzjHxR1/XRpCW6fKtpZ5Sk6pMkIoERZ9t/jWCq6LsYiOrmTqdEtatC8qb+je346tHG43BTB5dmvZEIYgOkYib7ao1iEHXZNe5dosFSHaQs1IRACbfKYRM/mZ+IA42pUKAB3f7KuDqbyrWNeAkKObb0t3xWkKHh9aa8jlTeKRLQBYjMdy0cul+kne/XUdsHY4c/FuzdYvle0Sdcrd/RxeHOF0fjjWal2MaRYZw==";
    let peer;
    try {
        peer = new Peer(lastPeerId, JSON.parse(await aesGcmDecrypt(iceToken, window.location.host)));
    } catch {
        peer = new Peer(lastPeerId);
        console.log('Use default PeerJS config');
    }
    peer.on('error', function (err) {
        console.log(logName + ': Peer error:' + err);
    });
    peer.on('disconnected', function () {
        console.log(logName + ': peer disconnected');
        setTimeout(() => {
            console.log(logName + ': peer.reconnect()');
            peer.reconnect();
        }, 3000);
    })
    peer.on('close', function (err) {
        console.log(logName + ': close:' + err);
    });
    let firstOpen = true;
    let client = null;
    peer.on('open', function (id) {
        if (!firstOpen) {
            console.log(logName + ': peer re-opened');
        } else {

            console.log(logName + ': peer opened');
        }
        if (isServer) {
            if (!firstOpen) {
                return;
            }
            localStorage.setItem("bulletLastPeerId", peer.id);
            document.getElementById("myId").innerText = "Other player can join you at: "
                + window.location.origin + window.location.pathname + "?server=" + peer.id;
            const server = new Server();
            server.runTick();
            peer.on('connection', function (conn) {
                console.log(logName + ': Received a client connection: ' + conn.peer);
                conn.on('open', function () {
                    server.onConnect(conn);
                });
            });
        } else {

            if (client == null) {
                client = new Client(peer);
                client.runTick();
            }
        }
        firstOpen = false;
    });
}




class Server {
    static tickDuration = 30;//30ms, it is around 30 ticks per second
    constructor() {
        this.connections = [];
        const serverPlayer = new Player(0);
        this.world = new World(true, [serverPlayer], serverPlayer.id);

        game = new Game(true, this.world);
        game.currentView = game.worldMap;
    }
    onConnect(conn) {
        if (!this.isARefreshOfExistingConnection(conn)) {
            this.connections.push(conn);
            const player = new Player(this.world.players.length);
            this.world.players.push(player);
            this.initConnection(conn, player);
        }
        this.removeUnconnectedClients();
        this.world.arrangeTeams();
        this.sendWorld();
    }
    isARefreshOfExistingConnection(conn) {
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peer == conn.peer) {
                const player = this.connections[i].player;
                console.log(logName + `: Player ${player.id} has reconnected`);
                this.initConnection(conn, player);
                this.connections[i] = conn;
                return true;
            }
        }
        return false;
    }
    initConnection(conn, player) {
        player.connection = conn;
        conn.player = player;
        const self = this;
        conn.on('data', function (data) {
            self.onReceiveMsg(player, data);
        });
    }
    removeUnconnectedClients() {
        let changed = false;
        for (let i = 0; i < this.connections.length; i++) {
            if (this.connections[i].peerConnection == null || this.connections[i].peerConnection.connectionState != 'connected') {
                this.connections.splice(i, 1);
            }
        }
        for (let i = 1; i < this.world.players.length; i++) {// index 0 is the server player
            if (this.world.players[i].connection.peerConnection == null || this.world.players[i].connection.peerConnection.connectionState != 'connected') {
                this.world.players.splice(i, 1);
                changed = true;
            }
        }
        return changed;
    }
    runTick() {
        tickNumber++;
        if (tickNumber % 30 == 0) {
            if (this.removeUnconnectedClients()) {
                
                this.sendWorld();
            }
        }
        const updates = game.update();
        if (updates.length != 0) {
            this.broadcastAll({ t: 'updates', updates });
        }
        game.paint();
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    broadcastAll(msg) {
        for (let c of this.connections) {
            c.send(msg);
        }
    }
    sendWorld() {
        const msg = this.world.getNewWorldMsg();
        for (let c of this.connections) {
            msg.yourId = c.player.id;
            c.send(msg);
        }
    }
    onReceiveMsg(player, msg) {
        if (msg.t == 'updates') {
            this.world.onUpdates(msg.updates);
            for (let c of this.connections.filter(c => c.player.id != player.id)) {
                c.send(msg);
            }
        }
    }
}

class Client {
    constructor(peer) {
        this.peer = peer;
        this.connection = null;
        this.world = null;
        this.lastConnectTick = -999999;
        this.refreshConnection();
    }
    refreshConnection() {
        if (this.connection == null || this.connection.peerConnection == null
            || (this.connection.peerConnection.connectionState != 'connected' && (tickNumber - this.lastConnectTick) / 30 > 10)) {
            console.log(logName + ': connect to server');
            this.connection = this.peer.connect(server);
            this.lastConnectTick = tickNumber;
            const self = this;
            this.connection.on('data', function (data) {
                self.onData(data);
            });
        }
    }
    runTick() {
        tickNumberr++;
        if (tickNumber % 15 == 0) {
            this.refreshConnection();
        }
        if (game != null) {
            const updates = game.update();
            if (updates.length != 0) {
                this.connection.send({ t: 'updates', updates });
            }
            game.paint();
        }
        setTimeout(() => this.runTick(), Server.tickDuration);
    }
    onData(msg) {
        if (msg.t == 'newWorld') {
         //   this.world = World.newWorld(msg);
         //   game.currentView = this.world;
        }
        if (msg.t == 'updates' && this.world != null) {
         //   this.world.onUpdates(msg.updates);
        }
    }
}

function loadImg(name) {
    const img = new Image();
    img.src = "img/" + name + ".png";
    return img;
}
const dungeonTileSet = loadImg("0x72_DungeonTilesetII_v1.7");
function getDungeonTileSetHeroSprite(j, topMargin) {
    const x = 128;
    const y = j * 32;
    return new DoubleSprite(dungeonTileSet, x, y + topMargin, 16, 32 - topMargin);
}
function getDungeonTileSetVilainSprite(i, topMargin) {
    const x = 368;
    const y = 9 + i * 24;
    return new DoubleSprite(dungeonTileSet, x, y + topMargin, 16, 24 - topMargin);
}
const outdoorDecorTile = loadImg("Outdoor_Decor_Free");
function getOutdoorDecorSprite(i, j) {
    return new SimpleSprite(outdoorDecorTile, i * 16, j * 16, 16, 16);
}
class SimpleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, this.tWidth, this.tHeight
        );
    }
    paintScale(x, y, w, h) {
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            x, y, w, h
        );
    }
    paintRotate(x, y, w, h, angus) {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(angus);
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}
class DoubleSprite {
    constructor(tile, tx, ty, tWidth, tHeight) {
        this.tile = tile;
        this.tx = tx;
        this.ty = ty;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
    }
    paint(x, y, index, reverse) {
        index |= 0;
        if (reverse) {
            this.paintReverse(x, y, index);
            return;
        }
        // ctx.fillStyle = "pink"; ctx.fillRect(x, y, this.tWidth, this.tHeight);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            x, y,
            this.tWidth * 2, this.tHeight * 2
        );
    }
    paintReverse(x, y, index) {
        ctx.save();
        ctx.translate(x + this.tWidth * 2, y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.tile,
            this.tx + index * this.tWidth, this.ty,
            this.tWidth, this.tHeight,
            0, 0, this.tWidth * 2, this.tHeight * 2
        );
        ctx.restore();
    }
    paintRotate(x, y, angus) {
        ctx.save();
        ctx.translate(x + this.tWidth, y + this.tHeight);
        ctx.rotate(angus);
        ctx.drawImage(this.tile,
            this.tx, this.ty, this.tWidth, this.tHeight,
            -this.tWidth, -this.tHeight, this.tWidth * 2, this.tHeight * 2);
        ctx.restore();
    }
}

function square(x) {
    return x * x;
}
class Player {
    constructor(id) {
        this.id = id;
        this.x = 32 * 5;
        this.y = 32 * 5;
        this.vx = 0;
        this.vy = 0;
        this.inputX = 0;
        this.inputY = 0;
        this.sprite = getDungeonTileSetHeroSprite(0, 14);
        this.lastHitTick = -999;
        this.lastHealTick = -999;
        this.maxLife = 100;
        this.life = this.maxLife;
        this.buffs = [];
        this.castingUntilTick = -999;
        this.lookLeft = false;
    }
    getCenterCoord() {
        return { x: this.x + this.sprite.tWidth, y: this.y + this.sprite.tHeight };
    }
    updateLocalPlayer(input, world) {
        let changed = false;
        if (this.life <= 0) {
            return false;
        }
        if (input.keysPressed.left) {
            if (this.inputX != -1) {
                this.inputX = -1;
                //   this.vx = 0;
                changed = true;
            }
        } else if (input.keysPressed.right) {
            if (this.inputX != 1) {
                this.inputX = 1;
                //  this.vx = 0;
                changed = true;
            }
        } else if (this.inputX != 0) {
            this.inputX = 0;
            // this.vx = 0;
            changed = true;
        }
        if (input.keysPressed.up) {
            if (this.inputY != -1) {
                this.inputY = -1;
                //    this.vy = 0;
                changed = true;
            }
        } else if (input.keysPressed.down) {
            if (this.inputY != 1) {
                this.inputY = 1;
                //  this.vy = 0;
                changed = true;
            }
        } else if (this.inputY != 0) {
            this.inputY = 0;
            //  this.vy = 0;
            changed = true;
        }
        return changed;
    }
    update() {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (tickNumber > this.buffs[i].endTick) {
                this.buffs.splice(i, 1);
            }
        }
        if (this.life <= 0) {
            return;
        }
        const isCasting = this.castingUntilTick > tickNumber;
        const maxSpeed = 4;
        function getNewSpeed(v, input) {
            if (isCasting) {
                return 0;
            }
            return Math.sign(input) * maxSpeed;

            const ratio = Math.abs(v) < maxSpeed * 0.5 ? 1
                : Math.abs(v) < maxSpeed * 0.8 ? 0.5
                    : 0.3;
            const acc = ratio * 2;
            const newV = v + input * acc;
            const maxV = input * maxSpeed;
            if (input < 0) {
                return Math.max(newV, maxV);
            } else if (input > 0) {
                return Math.min(newV, maxV);
            } else {
                let newV = v * 0.5;
                if (Math.abs(newV) < 0.1) {
                    newV = 0;
                }
                return newV;
            }
        }
        let targetVx = getNewSpeed(this.vx, this.inputX);
        let targetVy = getNewSpeed(this.vy, this.inputY);
        const norm = Math.sqrt(square(this.vx) + square(this.vy));
        if (norm > maxSpeed) {
            targetVx = targetVx * maxSpeed / norm;
            targetVy = targetVy * maxSpeed / norm;
        }
        const acc = 0.5;
        function accelerate(currentV, targetV) {
            const diff = targetV - currentV;
            if (Math.abs(diff) < acc) {
                return targetV
            }
            return currentV + Math.sign(diff) * acc;
        }
        this.vx = accelerate(this.vx, targetVx);
        this.vy = accelerate(this.vy, targetVy);

        this.x += this.vx;
        this.y += this.vy;
        if (Math.abs(this.vx) > 0.01) {
            this.lookLeft = this.vx < 0;
        }
    }

    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        if (this.life <= 0) {
            this.sprite.paintRotate(canvasX, canvasY, Math.PI / 2);
            deadSprite.paint(canvasX, canvasY + 10);
            return;
        }
        if (this.lastHitTick + 5 >= tickNumber) {
            ctx.fillStyle = 'red';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        if (this.lastHealTick + 5 >= tickNumber) {
            ctx.fillStyle = 'green';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        for (let buff of this.buffs) {
            if (buff.paintFunc) {
                buff.paintFunc(camera);
            }
        }
        this.sprite.paint(canvasX, canvasY, (tickNumber % 16) < 8, this.lookLeft);
        this.paintLifebar(canvasX, canvasY)
    }
    paintLifebar(canvasX, canvasY) {
        let top = canvasY + this.sprite.tHeight * 2;
        ctx.fillStyle = "black";
        ctx.fillRect(canvasX, top + 2, this.sprite.tWidth * 2, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(canvasX, top + 2, this.life * this.sprite.tWidth * 2 / this.maxLife, 4);
    }
    getMsg() {
        return { t: 'playerMove', id: this.id, x: this.x, y: this.y, vx: this.vx, vy: this.vy, ix: this.inputX, iy: this.inputY, ij: this.isJumping };
    }
    onMessage(msg) {
        if (msg.id == this.id && msg.t === 'playerMove') {
            this.x = msg.x;
            this.y = msg.y;
            this.vx = msg.vx;
            this.vy = msg.vy;
            this.inputX = msg.ix;
            this.inputY = msg.iy;
            this.isJumping = msg.ij;
        }
    }
    onHit(damage, world, projectile) {
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == BuffId.shield) {
                this.buffs.splice(i, 1);
                sounds.bubble.play();
                return;
            }
        }
        this.lastHitTick = tickNumber;
        this.life = Math.max(0, this.life - damage);
    }
    onHeal(heal, world, projectile) {
        this.lastHealTick = tickNumber;
        this.life = Math.min(this.maxLife, this.life + heal);
    }
    addBuff(buff) {
        buff.endTick = tickNumber + buff.duration * 30;
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == buff.id) {
                this.buffs[i] = this.id;
                return;
            }
        }
        this.buffs.push(buff)
    }
}

class ActionBar {
    static MaxSpells = 5;
    constructor(player, world) {
        this.player = player;
        this.world = world;
        this.spells = new Array(ActionBar.MaxSpells);
        this.basicAttack = allSpells.basicAttack;
        this.spells[0] = allSpells.curseGround;
        this.spells[1] = allSpells.rootingProjectile;
        this.spells[2] = allSpells.healProjectile;
        this.spells[3] = allSpells.protectSpell;
        this.spells[4] = allSpells.shotgun;
        this.topX = 400;
        this.height = 60;
        this.width = 172;
        this.topY = CanvasHeight - this.height;
        this.shortcuts = ['Q', 'E', 'F', 'SPC', 'M2'];
        this.castingSpell = null;
        this.startCastingAtTick = -999;
        this.castingUntilTick = -999;
        this.maxMana = 100;
        this.mana = this.maxMana;
        this.regenMana = 5;
    }
    tryTrigger(spell) {
        if (spell.lastAttackTick && tickNumber < spell.lastAttackTick + spell.cooldown * 30) {
            return false;
        }
        if (this.mana < spell.mana) {
            return false;
        }
        if (spell.castingTime <= 0) {
            this.castSpell(spell);
            return true;
        }
        this.castingSpell = spell;
        this.player.castingUntilTick = tickNumber + Math.ceil(spell.castingTime * 30);
        this.castingUntilTick = this.player.castingUntilTick;
        this.startCastingAtTick = tickNumber;
        return true;
    }
    castSpell(spell) {
        spell.trigger(this.player, this.world.camera.toWorldCoord(input.mouse), this.world);
        spell.lastAttackTick = tickNumber;
        this.mana = Math.max(0, this.mana - spell.mana);
    }
    update(input) {
        if (this.player.life <= 0) {
            return;
        }
        if (input.keysPressed.s4 && this.world.exitCell && this.world.exitCell.isPlayerInside(this.player)) {
            input.keyPressed.s4 = false;
            this.world.exitCell.trigger();
            return;
        }
        if (tickNumber % 30 == 0) {
            this.mana = Math.min(this.maxMana, this.mana + this.regenMana);
        }
        if (this.castingSpell != null) {
            if (this.castingUntilTick <= tickNumber) {
                this.castSpell(this.castingSpell)
                this.castingSpell = null;
            }
            return;
        }

        if (input.mouse2Clicked && this.tryTrigger(this.spells[4])) {
        }
        else if (input.keysPressed.s1 && this.tryTrigger(this.spells[0])) {
        }
        else if (input.keysPressed.s2 && this.tryTrigger(this.spells[1])) {
        }
        else if (input.keysPressed.s3 && this.tryTrigger(this.spells[2])) {
        }
        else if (input.keysPressed.s4 && this.tryTrigger(this.spells[3])) {
        }
        else if (input.mouseClicked && this.tryTrigger(this.basicAttack)) {
        }
    }
    paint() {
        if (this.castingSpell != null) {
            this.paintCastingBar(this.topX + 2, this.topY - 10, this.castingSpell);
        }
        ctx.fillStyle = '#222';
        ctx.fillRect(this.topX, this.topY, this.width, this.height);
        for (let i = 0; i < this.spells.length; i++) {
            this.paintSpell(i);
        }
        this.paintManaLifeBar(this.topX + 2, this.topY + 36, this.player.life / this.player.maxLife, 'green', 12);
        this.paintManaLifeBar(this.topX + 2, this.topY + 50, this.mana / this.maxMana, 'blue', 8);
    }
    paintCastingBar(topX, topY, spell) {
        ctx.fillStyle = "#0008";
        const width = this.width;
        ctx.fillRect(topX, topY, width, 4);
        const total = this.castingUntilTick - this.startCastingAtTick;
        const current = tickNumber - this.startCastingAtTick;
        ctx.fillStyle = "#b71";
        ctx.fillRect(topX, topY, current * width / total, 4);
    }
    paintSpell(i) {
        const spell = this.spells[i];
        if (spell == null) {
            return;
        }
        const buttonX = 2 + this.topX + i * 34;
        const buttonY = 2 + this.topY;
        ctx.fillStyle = '#444';
        ctx.fillRect(buttonX, this.topY + 2, 32, 32);
        spell.sprite.paintScale(buttonX, buttonY, 32, 32);

        if (spell == this.castingSpell) {
            const total = this.castingUntilTick - this.startCastingAtTick;
            const current = tickNumber - this.startCastingAtTick;
            const progress = current / total;
            this.paintProgressOverSpell(buttonX, buttonY, progress, '#b718');
        }
        if (spell.lastAttackTick && tickNumber < spell.lastAttackTick + spell.cooldown * 30) {
            ctx.fillStyle = '#4448';
            ctx.fillRect(buttonX, this.topY + 2, 32, 32);
            const cooldownFor = tickNumber - spell.lastAttackTick;
            const cooldownRatio = 1 - cooldownFor / (spell.cooldown * 30);
            this.paintProgressOverSpell(buttonX, buttonY, cooldownRatio, '#222c');
            //TODO: show cooldown in sec in middle of the icon
        }
        else if (spell.mana != 0 && this.mana < spell.mana) {
            const ratio = 1 - this.mana / spell.mana;
            ctx.fillStyle = '#44f8';
            ctx.fillRect(buttonX, this.topY + 2, 32, 32);
            this.paintProgressOverSpell(buttonX, buttonY, ratio, '#22fc');
        }
        ctx.fillStyle = "white";
        ctx.font = "12px Consolas";
        ctx.textRendering = "geometricPrecision";
        ctx.fillText(this.shortcuts[i], buttonX + 2, buttonY + 30);
    }
    paintProgressOverSpell(buttonX, buttonY, ratio, color) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(buttonX, buttonY, 32, 32);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(buttonX + 16, buttonY + 16);
        ctx.lineTo(buttonX + 16, buttonY);
        ctx.arc(buttonX + 16, buttonY + 16, 30, -0.5 * Math.PI, -0.5 * Math.PI - 2 * ratio * Math.PI, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }
    paintManaLifeBar(topX, topY, ratio, color, height) {
        const width = this.width - 4;
        ctx.fillStyle = "#0008";
        ctx.fillRect(topX, topY, width, height);
        ctx.fillStyle = color;
        ctx.fillRect(topX, topY, width * ratio, height);
    }
}

function getNextRand(previous) {
    return ((previous + 11) * 16807) % 2147483647;
}
function distanceSquare(coord1, coord2) {
    return square(coord1.x - coord2.x) + square(coord1.y - coord2.y);
}
function computeDistance(coord1, coord2) {
    return Math.sqrt(distanceSquare(coord1, coord2));
}
class AggroMobBrain {
    init(mob, world, mobSeed) {
        this.mob = mob;
        this.world = world;
        this.intialCoord = { x: this.mob.x, y: this.mob.y };
        this.targetCoord = null;
        this.targetPlayer = null;
        this.mob.seed = mobSeed;
        this.fireRange = 6;
        this.speed = 3;
        this.walkAroundPlayerUntil = -9999;
    }
    update() {
        if (this.targetPlayer != null && this.targetPlayer.life <= 0) {
            this.targetPlayer = this.world.findNearestPlayer(this.mob);
        }
        if (this.targetCoord != null && distanceSquare(this.mob, this.targetCoord) < square(this.speed)) {
            this.targetCoord = null;
        }
        let destCoord;
        if (this.targetPlayer != null) {
            const distanceToPlayer = distanceSquare(this.mob, this.targetPlayer);
            if (distanceToPlayer < square((this.fireRange + 3) * 64)) {
                this.mob.tryShoot(this.targetPlayer.getCenterCoord(), this.world);
            }
            if (this.targetCoord != null && tickNumber < this.walkAroundPlayerUntil) {
                destCoord = this.targetCoord;
            } else if (distanceToPlayer < square(64 * 1.5)) {
                this.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.world);
                this.walkAroundPlayerUntil = tickNumber + 30 * 1;
                destCoord = this.targetCoord;
            } else {
                destCoord = this.targetPlayer;
                this.targetCoord = null;
            }
        } else {
            if (this.targetCoord == null) {
                this.targetCoord = AggroMobBrain.getRandomTargetCoord(this.mob, this.intialCoord, this.world);
            }
            destCoord = this.targetCoord;
        }
        const d = computeDistance(this.mob, destCoord);
        if (d < 0.01) {
            return;
        }

        if (this.mob.buffs.find(b => b.id == BuffId.root)) {
            return;
        }

        const vx = this.speed * (destCoord.x - this.mob.x) / d;
        const vy = this.speed * (destCoord.y - this.mob.y) / d;
        this.mob.x += vx;
        this.mob.y += vy;
    }
    onHit() {
        if (this.targetPlayer == null) {
            this.targetPlayer = this.world.findNearestPlayer(this.mob);
        }
    }
    static getRandomTargetCoord(mob, initialCoord, world) {

        function getNextCoord(quarter) {
            const angus = Math.PI * 2 * (quarter % 8) / 8;
            const dx = Math.sign(Math.floor(Math.cos(angus) * 10));
            const dy = Math.sign(Math.floor(Math.sin(angus) * 10));
            let nextCoord = {
                x: mob.x + dx * 64,
                y: mob.y + dy * 64,
            };
            const dist1 = distanceSquare(nextCoord, initialCoord);
            if (dist1 > 64 * 64 * 4 * 4) {
                const otherCoord = {
                    x: mob.x - dx * 64,
                    y: mob.y - dy * 64,
                };
                if (distanceSquare(otherCoord, initialCoord) < dist1) {
                    nextCoord = otherCoord;
                }
            }
            return nextCoord;
        }
        mob.seed = getNextRand(mob.seed);
        for (let i = 0; i < 8; i++) {
            const nextCoord = getNextCoord(mob.seed + i);
            const targetCell = world.map.getCell(nextCoord.x, nextCoord.y);
            if (targetCell.canWalk) {
                return nextCoord;
            }
        }
        return initialCoord;
    }
}


class Mob {
    constructor(sprite, brain, spell, x, y) {
        this.sprite = sprite;
        this.brain = brain;
        this.spell = spell;
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        this.maxLife = 100;
        this.life = this.maxLife;
        this.lastHitTick = -9999;
        this.lastShootTick = -9999;
        this.buffs = [];
        this.lookLeft = false;
        this.createExitCell = false;
    }
    init(world, mobSeed) {
        this.brain.init(this, world, mobSeed);
    }
    getCenterCoord() {
        return { x: this.x + this.sprite.tWidth, y: this.y + this.sprite.tHeight };
    }
    update() {
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            if (tickNumber > this.buffs[i].endTick) {
                this.buffs.splice(i, 1);
            }
        }
        if (this.life <= 0) {
            return;
        }
        const oldX = this.x;
        this.brain.update();
        if (this.x != oldX) {
            this.lookLeft = this.x < oldX;
        }
    }
    tryShoot(target, world) {
        if (tickNumber < this.lastShootTick + this.spell.cooldown * 30) {
            return;
        }
        if (this.spell.trigger(this, target, world)) {
            this.lastShootTick = tickNumber;
        }
    }
    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        if (this.life <= 0) {
            this.sprite.paintRotate(canvasX, canvasY, Math.PI / 2);
            deadSprite.paint(canvasX, canvasY + 10);
            return;
        }
        if (this.lastHitTick + 5 >= tickNumber) {
            ctx.fillStyle = 'red';
            ctx.fillRect(canvasX, canvasY, this.sprite.tWidth * 2, this.sprite.tHeight * 2);
        }
        this.sprite.paint(canvasX, canvasY, (tickNumber % 40) < 20, this.lookLeft);
        this.paintLifebar(canvasX, canvasY);
    }
    paintLifebar(canvasX, canvasY) {
        let top = canvasY + this.sprite.tHeight * 2;
        ctx.fillStyle = "black";
        ctx.fillRect(canvasX, top + 2, this.sprite.tWidth * 2, 4);
        ctx.fillStyle = "green";
        ctx.fillRect(canvasX, top + 2, this.life * this.sprite.tWidth * 2 / this.maxLife, 4);
    }
    onHit(damage, world, projectile) {
        this.life = Math.max(0, this.life - damage);
        this.lastHitTick = tickNumber;
        this.brain.onHit();
        if (this.life <= 0 && !world.exitCell) {
            world.exitCell = new ExitCell(this.initialX, this.initialY);
        }
    }
    onHeal(heal, world, projectile) {
    }
    addBuff(buff) {
        buff.endTick = tickNumber + buff.duration * 30;
        for (let i = 0; i < this.buffs.length; i++) {
            if (this.buffs[i].id == buff.id) {
                this.buffs[i] = this.id;
                return;
            }
        }
        this.buffs.push(buff)
    }
}
class CellColorSprite {
    constructor(color) {
        this.color = color;
    }
    paint(x, y) {
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.fillStyle = this.color;
        ctx.rect(x, y, 64, 64);
        ctx.fill();
    }
}
class CellDecoSprite {
    constructor(sprite, offsetX, offsetY) {
        this.sprite = sprite;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }
    paint(x, y) {
        this.sprite.paintScale(x + this.offsetX, y + this.offsetX, 32, 32);
    }
}
class CellSpriteFactory {
    constructor() {
        this.grass1 = new CellColorSprite('#509060');
        this.grass2 = new CellColorSprite('#509360');
        this.water = new CellColorSprite('#55B');
        this.chunkTrunk = new CellDecoSprite(getOutdoorDecorSprite(0, 2), 16, 16);
        this.rock = new CellDecoSprite(getOutdoorDecorSprite(2, 2), 16, 16);
        this.grassSmallDecosSprites = [
            getOutdoorDecorSprite(0, 0),
            getOutdoorDecorSprite(1, 0),
            getOutdoorDecorSprite(2, 0),
            getOutdoorDecorSprite(0, 1),
            getOutdoorDecorSprite(1, 1),
            getOutdoorDecorSprite(2, 1),
            getOutdoorDecorSprite(3, 1),
            getOutdoorDecorSprite(4, 1),
            getOutdoorDecorSprite(5, 1),
            getOutdoorDecorSprite(6, 1),
            getOutdoorDecorSprite(1, 2),
            getOutdoorDecorSprite(5, 2),
            //getOutdoorDecorSprite(6, 2),
            getOutdoorDecorSprite(2, 7),
            getOutdoorDecorSprite(0, 8),
            getOutdoorDecorSprite(1, 8),
            getOutdoorDecorSprite(0, 9),
            getOutdoorDecorSprite(1, 9),
            getOutdoorDecorSprite(0, 10),
            getOutdoorDecorSprite(1, 10),
            getOutdoorDecorSprite(0, 11),
            getOutdoorDecorSprite(1, 11),
        ];


    }
}
const cellSpriteFactory = new CellSpriteFactory();
class Cell {
    constructor(cellSprites, prop) {
        this.cellSprites = cellSprites;
        prop = prop || {};
        this.canWalk = prop.canWalk === undefined ? true : prop.canWalk;
    }
    paint(x, y) {
        for (let s of this.cellSprites) {
            s.paint(x, y);
        }
    }
    static getGrassCell(i, j, seed) {
        const grass = (i + j) % 2 == 0 ? cellSpriteFactory.grass1 : cellSpriteFactory.grass2;
        const layers = [grass];
        if (seed % 19 == 7) {
            layers.push(cellSpriteFactory.chunkTrunk)
        } else if (seed % 23 == 8) {
            layers.push(cellSpriteFactory.rock)
        } else {
            const coords = [
                { x: 0, y: 0, mod: 191 },
                { x: 32, y: 0, mod: 193 },
                { x: 0, y: 32, mod: 197 },
                { x: 32, y: 32, mod: 199 },
            ]
            for (let c of coords) {
                const index = seed % c.mod;
                if (index < cellSpriteFactory.grassSmallDecosSprites.length) {
                    const decoSprite = cellSpriteFactory.grassSmallDecosSprites[index];
                    layers.push(new CellDecoSprite(decoSprite, c.x, c.y));
                }
            }
        }
        return new Cell(layers);
    }
}

class Map {
    constructor() {
        this.borderCell = new Cell([cellSpriteFactory.water], { canWalk: false });
        this.cells = new Array(10);
        let seed = 1;
        for (var j = 0; j < this.cells.length; j++) {
            this.cells[j] = new Array(30);
            for (var i = 0; i < this.cells[j].length; i++) {
                seed = getNextRand(seed);
                this.cells[j][i] = Cell.getGrassCell(i, j, seed);
            }
        }
    }
    getCell(x, y) {
        const i = Math.floor(x / 64);
        const j = Math.floor(y / 64);
        if (j < 0 || j >= this.cells.length) {
            return this.borderCell;
        }
        const row = this.cells[j];
        if (i < 0 || i >= row.length) {
            return this.borderCell;
        }
        return row[i];
    }
    paint(camera) {
        const topX = camera.topX;
        const topY = camera.topY;
        const offsetX = Math.floor(topX / 64) * 64 - topX;
        const offsetY = Math.floor(topY / 64) * 64 - topY;
        for (let j = -1; j <= CanvasCellHeight; j++) {
            for (let i = -1; i <= CanvasCellWidth; i++) {
                const x = topX + i * 64;
                const y = topY + j * 64;
                this.getCell(x, y).paint(offsetX + i * 64, offsetY + j * 64);
            }
        }
    }
}

class Level {
    constructor() {
        this.map = new Map();
        this.mobs = [];
        this.mobs.push(Level.createMob1At({ i: 1, j: 1 }));
        this.mobs.push(Level.createMob1At({ i: 5, j: 4 }));

        this.mobs.push(Level.createMob1At({ i: 12, j: 2 }));
        this.mobs.push(Level.createMob1At({ i: 12, j: 4 }));
        this.mobs.push(Level.createMob1At({ i: 12, j: 6 }));

        this.mobs.push(Level.createMob1At({ i: 22, j: 2 }));
        this.mobs.push(Level.createMob1At({ i: 22, j: 4 }));
        this.mobs.push(Level.createMob1At({ i: 22, j: 6 }));
        this.mobs.push(Level.createMob1At({ i: 24, j: 3 }));
        this.mobs.push(Level.createMob1At({ i: 24, j: 5 }));
        this.mobs.push(Level.createMob1At({ i: 24, j: 7 }));
        this.mobs.push(Level.createMob1At({ i: 26, j: 3 }));
        this.mobs.push(Level.createMob1At({ i: 26, j: 5 }));
        this.mobs.push(Level.createMob1At({ i: 26, j: 7 }));
        this.mobs.push(Level.createMob1At({ i: 28, j: 3 }));
        this.mobs.push(Level.createMob1At({ i: 28, j: 5 }));
        this.mobs.push(Level.createMob1At({ i: 28, j: 7 }));
    }
    static createMob1At(cell) {
        const mob = new Mob(getDungeonTileSetVilainSprite(0, 12), new AggroMobBrain(),
            mobSpells.basicAttack, cell.i * 64, cell.j * 64);
        return mob;
    }
}
class ExitCell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = getRavenSprite(2, 0);
    }
    paint(camera) {
        const canvasX = camera.toCanvasX(this.x);
        const canvasY = camera.toCanvasY(this.y);
        this.sprite.paint(canvasX, canvasY)
    }
    trigger() {
        game.currentView = game.worldMap;
    }
    isPlayerInside(player) {
        return distanceSquare(this, player) < square(32);
    }
}
let tickNumber = 0;
class World {
    constructor(isServer, players, localPlayerId) {
        this.isServer = isServer;
        this.players = players;
        this.mouse = null;
        this.localPlayer = players.find(p => p.id == localPlayerId);
        if (!this.localPlayer) {
            throw new Error(`Player not found ${localPlayerId}`);
        }
        this.camera = new CameraOffset(this.localPlayer);
        this.actionBar = new ActionBar(this.localPlayer, this);
        this.level = new Level();
        this.map = this.level.map;
        this.mobs = this.level.mobs;
        this.projectiles = [];
        this.annimAdded = false;
        this.mobs[this.mobs.length - 1].createExitCell = true;
        for (let i = 0; i < this.mobs.length; i++) {
            this.mobs[i].init(this, i);
        }
    }
    startLevel(level) {
        this.level = level;
        this.map = this.level.map;
        this.mobs = this.level.mobs;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].x = 32 * (5 * i);
            this.players[i].y = 32 * 5;
        }
        this.projectiles = [];
        for (let i = 0; i < this.mobs.length; i++) {
            this.mobs[i].init(this, i);
        }
        this.exitCell = null;
    }
    addProjectile(anim) {
        this.projectiles.push(anim);
        this.annimAdded = true;
    }
    update() {
        if (this.annimAdded) {
            this.projectiles.sort((a, b) => a.zIndex - b.zIndex);
            this.annimAdded = false;
        }
        const changed = this.localPlayer.updateLocalPlayer(input, this);
        for (let p of this.players) {
            p.update();
        }
        this.camera.update();
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (!this.projectiles[i].update(this)) {
                this.projectiles.splice(i, 1);
            }
        }
        for (let m of this.mobs) {
            m.update(this);
        }
        this.checkBulletsHitOnAll()
        this.actionBar.update(input, this);
        const updates = [];

        return updates;
    }
    checkBulletsHitOnAll() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (!this.checkBulletHitOnAll(this.projectiles[i])) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    checkBulletHitOnAll(projectile) {
        if (projectile.targerPlayers) {
            for (let c of this.players.filter(c => c.life > 0)) {
                if (!projectile.checkHit(c, this)) {
                    return false;
                }
            }
        }
        if (projectile.targerMobs) {
            for (let c of this.mobs.filter(c => c.life > 0)) {
                if (!projectile.checkHit(c, this)) {
                    return false;
                }
            }
        }
        return true;
    }
    findNearestPlayer(coord) {
        let minD = 999999999;
        let player = null;
        for (let p of this.players) {
            if (p.life > 0) {
                const d = distanceSquare(p, coord);
                if (d < minD) {
                    minD = d;
                    player = p;
                }
            }
        }
        return player;
    }
    paint() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.level.map.paint(this.camera);
        for (let p of this.projectiles) {
            p.paint(this.camera);
        }
        if (this.exitCell) {
            this.exitCell.paint(this.camera);
        }
        for (let mob of this.level.mobs) {
            mob.paint(this.camera);
        }


        for (let p of this.players) {
            p.paint(this.camera);
        }
        this.actionBar.paint();
        this.paintCursor();
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
    getNewWorldMsg() {
        return {
            t: 'newWorld',
            p: this.players.map(p => { return { id: p.id, x: p.x, y: p.y, r: p.radius, t: p.team } }),
            b: { x: this.ball.x, y: this.ball.y },
            yourId: '',
        }
    }
    static newWorld(msg) {
        const players = msg.p.map(p => {
            let player = new Player(p.id);
            player.x = p.x;
            player.y = p.y;
            player.radius = p.r;
            player.team = p.t;
            return player;
        });
        const world = new World(false, players, msg.yourId);

        return world;
    }
    onUpdates(updates) {
        for (let m of updates) {
            for (let p of this.players) {
                p.onMessage(m);
            }
        }
    }

}
class CameraOffset {
    constructor(localPlayer) {
        this.localPlayer = localPlayer;
        this.topX = 0;
        this.topY = 0;
    }
    update() {
        this.topX = Math.floor(this.localPlayer.x - CanvasWidth / 2);
        this.topY = Math.floor(this.localPlayer.y - CanvasHeight / 2);
    }
    toCanvasX(x) {
        return Math.floor(x - this.topX)
    }
    toCanvasY(y) {
        return Math.floor(y - this.topY)
    }
    toWorldCoord(canvasPoint) {
        return {
            x: canvasPoint.x + this.topX,
            y: canvasPoint.y + this.topY,
        };
    }
}
class Screen {
    constructor() {
        this.screenCanvas = document.getElementById("myCanvas");
        this.screenCanvas.style.imageRendering = 'pixelated';
        this.screenCtx = this.screenCanvas.getContext("2d");

        this.windowResize();
        window.addEventListener('resize', () => this.windowResize(), false);
        window.addEventListener('mousemove', (e) => this.mouseMove(e), false);
        window.addEventListener('mousedown', (e) => this.mouseDown(e), false);
        window.addEventListener('mouseup', (e) => this.mouseUp(e), false);
    }
    scaleOnScreen() {
        this.screenCtx.imageSmoothingEnabled = false;
        this.screenCtx.clearRect(0, 0, this.screenCanvas.width, this.screenCanvas.height);
        this.screenCtx.drawImage(canvas,
            0, 0, canvas.width, canvas.height,
            0, 0, this.screenCanvas.width, this.screenCanvas.height)
    }
    toCanvasCoord(x, y) {
        return {
            x: Math.floor(x * canvas.width / this.screenCanvas.width),
            y: Math.floor(y * canvas.height / this.screenCanvas.height)
        };
    }
    mouseMove(event) {
        input.mouseMove(this.toCanvasCoord(event.offsetX, event.offsetY));
    }
    mouseButton(e, pressed) {
        let rightclick = false;
        if (e.which) {
            rightclick = (e.which == 3);
        } else if (e.button) {
            rightclick = (e.button == 2);
        }
        input.mouseButton(this.toCanvasCoord(event.offsetX, event.offsetY), pressed, rightclick);
    }
    mouseDown(event) {
        this.mouseButton(event, true);
    }
    mouseUp(event) {
        this.mouseButton(event, false);
    }
    windowResize() {
        if (document.fullscreenElement) {
            this.screenCanvas.width = window.innerWidth;
            this.screenCanvas.height = window.innerHeight;
        } else {
            let w = window.innerWidth - 40;
            let h = window.innerHeight - 180;
            if (h * 16 > w * 9) {
                h = Math.floor(w * 9 / 16);
            } else {
                w = Math.floor(h * 16 / 9);
            }
            this.screenCanvas.width = w;
            this.screenCanvas.height = h;
        }
    }
    fullScreen() {
        if (this.screenCanvas.webkitRequestFullScreen) {
            this.screenCanvas.webkitRequestFullScreen();
        }
        else {
            this.screenCanvas.mozRequestFullScreen();
        }
    }
}

class Game {
    constructor(isServer, world) {
        this.isServer = isServer;
        this.world = world;
        this.worldMap = new WorldMap();
        this.screen = new Screen();
        this.currentView = null;
    }
    update() {
        if(this.currentView == null){
            return;            
        }
        this.currentView.update();
        return [];
    }
    paint() {
        if (this.currentView) {
            this.currentView.paint();
        }
        this.screen.scaleOnScreen();
    }
}
let game = null;


initPeer();
function fullScreen() {
    screen.fullScreen();
}

