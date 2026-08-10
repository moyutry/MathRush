// Particle burst effect (correct-answer celebration, level-up modal).
// Ported from the Python Particle class; adds a square/star shape mix and
// slight gravity drift as part of the visual overhaul.
MR.Particle = class Particle {
  constructor(x, y, color, opts) {
    opts = opts || {};
    this.x = x;
    this.y = y;
    const speed = opts.speed || 6;
    this.vx = (Math.random() * 2 - 1) * speed;
    this.vy = (Math.random() * 2 - 1) * speed;
    this.life = 20 + Math.random() * 20;
    this.maxLife = this.life;
    this.color = color;
    this.size = 3 + Math.random() * 5;
    this.shape = Math.random() < 0.7 ? "circle" : (Math.random() < 0.5 ? "square" : "star");
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() * 2 - 1) * 0.2;
    this.gravity = opts.gravity !== undefined ? opts.gravity : 0.06;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.985;
    this.rot += this.rotSpeed;
    this.life -= 1;
    this.size = Math.max(0, this.size - 0.08);
  }

  draw(ctx) {
    if (this.life <= 0 || this.size <= 0) return;
    const alpha = Math.max(0, Math.min(1, this.life / this.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === "square") {
      ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
    } else {
      MR.Particle.drawStar(ctx, this.size * 1.4);
    }
    ctx.restore();
  }

  static drawStar(ctx, r) {
    const spikes = 5;
    const inner = r * 0.5;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const rad = i % 2 === 0 ? r : inner;
      const ang = (Math.PI * i) / spikes;
      const px = Math.sin(ang) * rad;
      const py = -Math.cos(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
};
