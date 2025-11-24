/**
 * Galaga Clone - Game Engine
 */

class Particle {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0; // Opacity/Life
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Bullet {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = 10;
        this.markedForDeletion = false;
    }

    update() {
        this.y -= this.speed;
        if (this.y < 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = '#ff0044'; // Red laser
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0044';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height - this.height - 20;
        this.speed = 5;
        this.shootTimer = 0;
        this.shootInterval = 15; // Frames between shots
    }

    update() {
        // Movement
        if (this.game.keys.ArrowLeft) this.x -= this.speed;
        if (this.game.keys.ArrowRight) this.x += this.speed;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;

        // Shooting
        if (this.shootTimer > 0) this.shootTimer--;
        if (this.game.keys.Space && this.shootTimer === 0) {
            this.game.bullets.push(new Bullet(this.game, this.x + this.width / 2, this.y));
            this.shootTimer = this.shootInterval;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#00f3ff'; // Neon Cyan
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';

        // Simple ship shape (Triangle-ish)
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

class Enemy {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speedX = 2;
        this.speedY = 0;
        this.markedForDeletion = false;
        this.color = '#ff00ff'; // Neon Pink
        this.angle = 0;
        this.curve = Math.random() * 7;
        this.initialX = x;
    }

    update() {
        // Simple swaying motion
        this.x = this.initialX + Math.sin(this.angle) * 20;
        this.angle += 0.05;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Alien shape (Bug-like)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.6);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.6);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 10, 5, 5);
        ctx.fillRect(this.x + this.width - 10, this.y + 10, 5, 5);

        ctx.shadowBlur = 0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.lastTime = 0;
        this.score = 0;
        this.highScore = localStorage.getItem('galaga_highscore') || 0;
        this.gameOver = false;
        this.gameActive = false;

        this.bullets = [];
        this.particles = [];
        this.enemies = [];
        this.player = new Player(this);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Input handling
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            Space: false
        };

        window.addEventListener('keydown', e => {
            if (e.code === 'ArrowLeft') this.keys.ArrowLeft = true;
            if (e.code === 'ArrowRight') this.keys.ArrowRight = true;
            if (e.code === 'Space' || e.code === 'Enter') {
                if (e.code === 'Space') this.keys.Space = true;

                if (!this.gameActive && document.getElementById('start-screen').classList.contains('active')) {
                    this.start();
                } else if (this.gameOver && document.getElementById('game-over-screen').classList.contains('active')) {
                    this.start();
                }
            }
        });

        window.addEventListener('keyup', e => {
            if (e.code === 'ArrowLeft') this.keys.ArrowLeft = false;
            if (e.code === 'ArrowRight') this.keys.ArrowRight = false;
            if (e.code === 'Space') this.keys.Space = false;
        });

        // Click to start (Fallback)
        document.getElementById('start-screen').addEventListener('click', () => {
            if (!this.gameActive) this.start();
        });

        document.getElementById('game-over-screen').addEventListener('click', () => {
            if (this.gameOver) this.start();
        });

        // Update UI
        document.getElementById('high-score').innerText = this.highScore;

        // Start loop
        requestAnimationFrame(t => this.loop(t));
    }

    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        // Re-center player if needed
        if (this.player) {
            this.player.y = this.height - this.player.height - 20;
            if (this.player.x > this.width) this.player.x = this.width / 2;
        }
    }

    createEnemyGrid() {
        this.enemies = [];
        const rows = 4;
        const cols = 6;
        const enemyWidth = 30;
        const enemyHeight = 30;
        const padding = 30;
        const totalWidth = cols * enemyWidth + (cols - 1) * padding;
        const startX = (this.width - totalWidth) / 2;
        const startY = 80;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (enemyWidth + padding);
                const y = startY + r * (enemyHeight + padding);
                this.enemies.push(new Enemy(this, x, y));
            }
        }
    }

    start() {
        this.gameActive = true;
        this.gameOver = false;
        this.score = 0;
        this.bullets = [];
        this.particles = [];
        this.player = new Player(this);
        this.createEnemyGrid();

        document.getElementById('score').innerText = this.score;

        // Hide screens
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('hidden');

        console.log("Game Started");
    }

    endGame() {
        this.gameActive = false;
        this.gameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('galaga_highscore', this.highScore);
            document.getElementById('high-score').innerText = this.highScore;
        }
        document.getElementById('final-score').innerText = this.score;

        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('game-over-screen').classList.add('active');
    }

    checkCollisions() {
        // Bullets hit Enemies
        this.bullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (!bullet.markedForDeletion && !enemy.markedForDeletion &&
                    bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {

                    bullet.markedForDeletion = true;
                    enemy.markedForDeletion = true;

                    // Explosion particles
                    for (let i = 0; i < 8; i++) {
                        this.particles.push(new Particle(this, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color));
                    }

                    this.score += 100;
                    document.getElementById('score').innerText = this.score;
                }
            });
        });

        // Enemies hit Player
        this.enemies.forEach(enemy => {
            if (!enemy.markedForDeletion &&
                enemy.x < this.player.x + this.player.width &&
                enemy.x + enemy.width > this.player.x &&
                enemy.y < this.player.y + this.player.height &&
                enemy.y + enemy.height > this.player.y) {

                this.endGame();
            }
        });

        // Win condition (clear all enemies)
        if (this.enemies.length === 0 && this.gameActive) {
            // Respawn for now
            setTimeout(() => {
                if (this.gameActive && this.enemies.length === 0) this.createEnemyGrid();
            }, 1000);
        }
    }

    update(deltaTime) {
        if (!this.gameActive) return;

        this.player.update();

        // Update Bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => !bullet.markedForDeletion);

        // Update Enemies
        this.enemies.forEach(enemy => enemy.update());
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

        // Update Particles
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => particle.life > 0);

        this.checkCollisions();
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameActive) {
            this.player.draw(this.ctx);
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            this.particles.forEach(particle => particle.draw(this.ctx));
        }
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
