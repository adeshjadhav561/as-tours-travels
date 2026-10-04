// Ambient particle background for AS Tours & Travels.
class LuxuryParticles {
  constructor() {
    this.canvas = document.getElementById('lux-particles');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0 };
    this.motionEnabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
    if (this.motionEnabled) this.animate();
  }
  
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    
    const count = Math.min(80, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.4 + 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  animate() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const time = Date.now() * 0.001;
    
    this.particles.forEach((p, i) => {
      p.x += p.vx + this.mouse.x * 0.15 * p.z;
      p.y += p.vy + this.mouse.y * 0.15 * p.z;
      p.phase += 0.015;
      
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;
      
      const pulse = p.opacity + Math.sin(p.phase) * 0.12;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(197, 165, 90, ${Math.max(0, pulse)})`;
      this.ctx.fill();
      
      // Soft glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.z * 2.5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(197, 165, 90, ${Math.max(0, pulse * 0.1)})`;
      this.ctx.fill();
      
      // Connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
          const alpha = (1 - dist / 100) * 0.08;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(197, 165, 90, ${alpha})`;
          this.ctx.lineWidth = 0.4;
          this.ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new LuxuryParticles();
});
