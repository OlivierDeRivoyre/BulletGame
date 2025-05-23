class Input {
    constructor() {
        this.keysPressed = {
            left: false,
            right: false,
            up: false,
            down: false,
            space: false,
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
        } else if (event.code == 'Space') {
            this.keysPressed.space = pressed;
        }
        if (event.key == 'Escape') {
        }
    }
    mouseButton(mouse, pressed, rightclick) {
        this.mouse = mouse;
        if (rightclick) {
            this.mouse2Clicked = pressed;
        } else {
            this.mouseClicked = pressed;
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

    contextmenu(e) {
        e.preventDefault();
        return false;
    }
}
const input = new Input();