/**
 * Lazytask Garden - A growing village that evolves with your focus sessions
 * 
 * Progression:
 * - Level 1 (0 sessions): Small sprouts, basic grass
 * - Level 2 (1+ sessions): Growing plants, flowers, first butterfly
 * - Level 3 (3+ sessions): Small trees, rabbits appear
 * - Level 4 (6+ sessions): Bigger trees, birds, small cottage
 * - Level 5 (10+ sessions): Garden fence, more animals, pond
 * - Level 6 (15+ sessions): Windmill, deer, lush garden
 * - Level 7 (20+ sessions): Full village, varied wildlife
 * - Level 8 (25+ sessions): Magical garden with fireflies, rainbow
 */

const Garden = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  time: 0,
  animationFrame: null,
  totalSessions: 0,
  
  // Garden elements that grow over time
  plants: [],
  animals: [],
  buildings: [],
  particles: [],
  
  // Options (controllable from settings)
  options: {
    enabled: true,
    clouds: true,
    animals: true
  },
  
  // Color palettes for different times
  colors: {
    sky: { top: '#1a2a4a', bottom: '#4a6fa5' },
    ground: '#3d5a3d',
    grass: '#4a7c4a',
    sun: '#ffd93d',
  },
  
  init() {
    this.canvas = document.getElementById('garden-canvas');
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },
  
  resize() {
    const page = document.getElementById('focus-page');
    if (!page) return;
    
    this.width = page.offsetWidth;
    this.height = page.offsetHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  },
  
  setTotalSessions(sessions) {
    this.totalSessions = sessions;
    this.generateGarden();
  },
  
  setOptions(opts) {
    this.options = { ...this.options, ...opts };
  },
  
  getLevel() {
    const s = this.totalSessions;
    if (s >= 25) return 8;  // Magical garden
    if (s >= 20) return 7;  // Full village
    if (s >= 15) return 6;  // Windmill, deer
    if (s >= 10) return 5;  // Fence, pond
    if (s >= 6) return 4;   // Cottage, birds
    if (s >= 3) return 3;   // Trees, rabbits
    if (s >= 1) return 2;   // Flowers, butterflies
    return 1;               // Starting garden
  },
  
  generateGarden() {
    const level = this.getLevel();
    this.plants = [];
    this.animals = [];
    this.buildings = [];
    
    // Generate plants based on level
    this.generatePlants(level);
    this.generateAnimals(level);
    this.generateBuildings(level);
  },
  
  generatePlants(level) {
    const groundY = this.height * 0.65;
    
    // Grass tufts (always present)
    for (let i = 0; i < 30 + level * 10; i++) {
      this.plants.push({
        type: 'grass',
        x: Math.random() * this.width,
        y: groundY + Math.random() * (this.height - groundY) * 0.7,
        size: 5 + Math.random() * 10,
        sway: Math.random() * Math.PI * 2
      });
    }
    
    // Flowers (level 2+)
    if (level >= 2) {
      const flowerColors = ['#ff6b8a', '#ffd93d', '#a855f7', '#3b82f6', '#f97316'];
      for (let i = 0; i < level * 3; i++) {
        this.plants.push({
          type: 'flower',
          x: Math.random() * this.width,
          y: groundY + 20 + Math.random() * 60,
          color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
          size: 8 + Math.random() * 8,
          sway: Math.random() * Math.PI * 2
        });
      }
    }
    
    // Small plants/sprouts (level 1+)
    for (let i = 0; i < 5 + level * 2; i++) {
      this.plants.push({
        type: 'sprout',
        x: 50 + Math.random() * (this.width - 100),
        y: groundY,
        growth: Math.min(1, 0.3 + (level / 8) * 0.7 + Math.random() * 0.2),
        sway: Math.random() * Math.PI * 2
      });
    }
    
    // Trees (level 3+)
    if (level >= 3) {
      const treeCount = Math.min(6, Math.floor((level - 2) * 1.5));
      for (let i = 0; i < treeCount; i++) {
        this.plants.push({
          type: 'tree',
          x: 80 + (i * (this.width - 160) / treeCount) + Math.random() * 40 - 20,
          y: groundY,
          size: 0.5 + (level - 3) * 0.1 + Math.random() * 0.3,
          style: Math.floor(Math.random() * 3)
        });
      }
    }
    
    // Mushrooms (level 4+)
    if (level >= 4) {
      for (let i = 0; i < level - 2; i++) {
        this.plants.push({
          type: 'mushroom',
          x: Math.random() * this.width,
          y: groundY + 10 + Math.random() * 40,
          size: 6 + Math.random() * 6,
          color: Math.random() > 0.5 ? '#e74c3c' : '#f4a623'
        });
      }
    }
  },
  
  generateAnimals(level) {
    const groundY = this.height * 0.65;
    
    // Butterflies (level 2+)
    if (level >= 2) {
      for (let i = 0; i < Math.min(5, level - 1); i++) {
        this.animals.push({
          type: 'butterfly',
          x: Math.random() * this.width,
          y: groundY - 50 - Math.random() * 100,
          color: ['#ff6b8a', '#a855f7', '#ffd93d', '#3b82f6'][Math.floor(Math.random() * 4)],
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.5
        });
      }
    }
    
    // Rabbits (level 3+)
    if (level >= 3) {
      for (let i = 0; i < Math.min(3, level - 2); i++) {
        this.animals.push({
          type: 'rabbit',
          x: 100 + Math.random() * (this.width - 200),
          y: groundY + 10,
          direction: Math.random() > 0.5 ? 1 : -1,
          hop: 0,
          hopTimer: Math.random() * 100
        });
      }
    }
    
    // Birds (level 4+)
    if (level >= 4) {
      for (let i = 0; i < Math.min(4, level - 3); i++) {
        this.animals.push({
          type: 'bird',
          x: Math.random() * this.width,
          y: 50 + Math.random() * (groundY * 0.4),
          wingPhase: Math.random() * Math.PI * 2,
          speed: 1 + Math.random() * 2,
          direction: Math.random() > 0.5 ? 1 : -1
        });
      }
    }
    
    // Deer (level 6+)
    if (level >= 6) {
      this.animals.push({
        type: 'deer',
        x: this.width * 0.7 + Math.random() * 100,
        y: groundY,
        facing: -1
      });
    }
    
    // Fireflies (level 8)
    if (level >= 8) {
      for (let i = 0; i < 20; i++) {
        this.animals.push({
          type: 'firefly',
          x: Math.random() * this.width,
          y: groundY - Math.random() * (groundY * 0.5),
          phase: Math.random() * Math.PI * 2,
          glowPhase: Math.random() * Math.PI * 2
        });
      }
    }
  },
  
  generateBuildings(level) {
    const groundY = this.height * 0.65;
    
    // Cottage (level 4+)
    if (level >= 4) {
      this.buildings.push({
        type: 'cottage',
        x: this.width * 0.15,
        y: groundY,
        size: 0.6 + (level - 4) * 0.1
      });
    }
    
    // Fence (level 5+)
    if (level >= 5) {
      this.buildings.push({
        type: 'fence',
        x: 0,
        y: groundY
      });
    }
    
    // Pond (level 5+)
    if (level >= 5) {
      this.buildings.push({
        type: 'pond',
        x: this.width * 0.7,
        y: groundY + 30
      });
    }
    
    // Windmill (level 6+)
    if (level >= 6) {
      this.buildings.push({
        type: 'windmill',
        x: this.width * 0.85,
        y: groundY,
        rotation: 0
      });
    }
    
    // Well (level 7+)
    if (level >= 7) {
      this.buildings.push({
        type: 'well',
        x: this.width * 0.35,
        y: groundY + 15
      });
    }
  },
  
  start() {
    if (this.animationFrame) return;
    this.loop();
  },
  
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  },
  
  loop() {
    this.time++;
    this.draw();
    this.animationFrame = requestAnimationFrame(() => this.loop());
  },
  
  draw() {
    const ctx = this.ctx;
    const W = this.width;
    const H = this.height;
    const level = this.getLevel();
    const groundY = H * 0.65;
    
    // Clear
    ctx.clearRect(0, 0, W, H);
    
    // Sky gradient (changes slightly with level)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    if (level >= 8) {
      // Magical twilight sky
      skyGrad.addColorStop(0, '#1a1a3e');
      skyGrad.addColorStop(0.5, '#2d2a5e');
      skyGrad.addColorStop(1, '#4a3f6e');
    } else if (level >= 5) {
      // Sunset vibes
      skyGrad.addColorStop(0, '#1e3a5f');
      skyGrad.addColorStop(0.6, '#3d5a80');
      skyGrad.addColorStop(1, '#98c1d9');
    } else {
      // Day sky
      skyGrad.addColorStop(0, '#2d4a6f');
      skyGrad.addColorStop(1, '#87ceeb');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY);
    
    // Stars (level 8)
    if (level >= 8) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const sx = (i * 73 + this.time * 0.01) % W;
        const sy = (i * 47) % (groundY * 0.6);
        const twinkle = Math.sin(this.time * 0.05 + i) * 0.3 + 0.7;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    
    // Sun or Moon
    if (level >= 8) {
      // Moon
      ctx.fillStyle = '#f5f5dc';
      ctx.beginPath();
      ctx.arc(W * 0.85, H * 0.15, 35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d2a5e';
      ctx.beginPath();
      ctx.arc(W * 0.85 + 10, H * 0.15 - 5, 28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sun
      const sunX = W * 0.8;
      const sunY = H * 0.12;
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
      ctx.fill();
      
      // Sun glow
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 30, sunX, sunY, 80);
      sunGlow.addColorStop(0, 'rgba(255, 217, 61, 0.3)');
      sunGlow.addColorStop(1, 'rgba(255, 217, 61, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Clouds (if enabled)
    if (this.options.clouds) {
      this.drawClouds(ctx, W, H, groundY, level);
    }
    
    // Rainbow (level 8)
    if (level >= 8) {
      this.drawRainbow(ctx, W, H);
    }
    
    // Hills (background)
    this.drawHills(ctx, W, H, groundY, level);
    
    // Ground
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, '#4a7c4a');
    groundGrad.addColorStop(0.3, '#3d6b3d');
    groundGrad.addColorStop(1, '#2d5a2d');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);
    
    // Draw buildings (back layer)
    this.buildings.forEach(b => this.drawBuilding(ctx, b, level));
    
    // Draw plants
    this.plants.forEach(p => this.drawPlant(ctx, p));
    
    // Draw animals (if enabled)
    if (this.options.animals) {
      this.animals.forEach(a => this.drawAnimal(ctx, a));
    }
    
    // Particles/effects
    this.updateParticles(ctx);
  },
  
  drawClouds(ctx, W, H, groundY, level) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const cloudCount = 3 + Math.floor(level / 2);
    
    for (let i = 0; i < cloudCount; i++) {
      const cx = ((i * W / cloudCount) + this.time * 0.2) % (W + 200) - 100;
      const cy = 40 + (i * 30) % 80;
      const size = 30 + (i % 3) * 15;
      
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.6, cy - size * 0.2, size * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + size * 1.1, cy, size * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - size * 0.4, cy + size * 0.1, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  
  drawHills(ctx, W, H, groundY, level) {
    // Back hills
    ctx.fillStyle = '#5a8a5a';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let x = 0; x <= W; x += 50) {
      const y = groundY - 30 - Math.sin(x * 0.01 + 1) * 25 - Math.sin(x * 0.02) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, groundY);
    ctx.closePath();
    ctx.fill();
    
    // Front hills
    if (level >= 3) {
      ctx.fillStyle = '#4d7a4d';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= W; x += 50) {
        const y = groundY - 15 - Math.sin(x * 0.015 + 2) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, groundY);
      ctx.closePath();
      ctx.fill();
    }
  },
  
  drawRainbow(ctx, W, H) {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'];
    const cx = W * 0.3;
    const cy = H * 0.7;
    const baseRadius = 200;
    
    ctx.globalAlpha = 0.3;
    colors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius - i * 10, Math.PI, 0);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  },
  
  drawPlant(ctx, plant) {
    const sway = Math.sin(this.time * 0.02 + plant.sway) * 3;
    
    switch (plant.type) {
      case 'grass':
        ctx.strokeStyle = '#3d6b3d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plant.x, plant.y);
        ctx.quadraticCurveTo(plant.x + sway, plant.y - plant.size * 0.6, plant.x + sway * 0.5, plant.y - plant.size);
        ctx.stroke();
        break;
        
      case 'flower':
        // Stem
        ctx.strokeStyle = '#2d5a2d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plant.x, plant.y);
        ctx.quadraticCurveTo(plant.x + sway, plant.y - 15, plant.x + sway * 0.5, plant.y - 25);
        ctx.stroke();
        
        // Petals
        const fx = plant.x + sway * 0.5;
        const fy = plant.y - 25;
        ctx.fillStyle = plant.color;
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(angle) * 5, fy + Math.sin(angle) * 5, plant.size / 2, plant.size / 3, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.arc(fx, fy, plant.size / 3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'sprout':
        const height = 20 + plant.growth * 40;
        ctx.strokeStyle = '#2d5a2d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plant.x, plant.y);
        ctx.quadraticCurveTo(plant.x + sway, plant.y - height * 0.6, plant.x + sway * 0.3, plant.y - height);
        ctx.stroke();
        
        // Leaves
        ctx.fillStyle = '#4a7c4a';
        const leafY = plant.y - height * 0.6;
        ctx.beginPath();
        ctx.ellipse(plant.x + 8 + sway * 0.5, leafY, 10 * plant.growth, 5 * plant.growth, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(plant.x - 8 + sway * 0.5, leafY + 5, 8 * plant.growth, 4 * plant.growth, -0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'tree':
        this.drawTree(ctx, plant.x, plant.y, plant.size, plant.style, sway);
        break;
        
      case 'mushroom':
        // Stem
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(plant.x - 3, plant.y - plant.size, 6, plant.size);
        // Cap
        ctx.fillStyle = plant.color;
        ctx.beginPath();
        ctx.ellipse(plant.x, plant.y - plant.size, plant.size, plant.size * 0.6, 0, Math.PI, 0);
        ctx.fill();
        // Dots
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(plant.x - 3, plant.y - plant.size - 2, 2, 0, Math.PI * 2);
        ctx.arc(plant.x + 4, plant.y - plant.size - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  },
  
  drawTree(ctx, x, y, size, style, sway) {
    const trunkHeight = 60 * size;
    const trunkWidth = 12 * size;
    
    // Trunk
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);
    
    // Foliage
    ctx.fillStyle = '#2e7d32';
    const foliageY = y - trunkHeight;
    
    if (style === 0) {
      // Round tree
      ctx.beginPath();
      ctx.arc(x + sway * 0.3, foliageY - 30 * size, 40 * size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.arc(x - 15 * size + sway * 0.3, foliageY - 20 * size, 25 * size, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 1) {
      // Pine tree
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + sway * 0.2, foliageY - (60 + i * 25) * size);
        ctx.lineTo(x - (30 - i * 5) * size, foliageY - i * 25 * size);
        ctx.lineTo(x + (30 - i * 5) * size, foliageY - i * 25 * size);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Bushy tree
      const bushes = [[0, -40], [-20, -25], [20, -25], [0, -15]];
      bushes.forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox * size + sway * 0.3, foliageY + oy * size, 22 * size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },
  
  drawAnimal(ctx, animal) {
    switch (animal.type) {
      case 'butterfly':
        animal.phase += 0.1;
        animal.x += Math.sin(animal.phase) * animal.speed;
        animal.y += Math.cos(animal.phase * 0.7) * 0.5;
        
        // Wrap around
        if (animal.x > this.width + 20) animal.x = -20;
        if (animal.x < -20) animal.x = this.width + 20;
        
        const wingFlap = Math.sin(this.time * 0.3) * 0.5;
        ctx.fillStyle = animal.color;
        ctx.save();
        ctx.translate(animal.x, animal.y);
        // Wings
        ctx.beginPath();
        ctx.ellipse(-6, 0, 8, 5 + wingFlap * 3, -0.3 + wingFlap, 0, Math.PI * 2);
        ctx.ellipse(6, 0, 8, 5 + wingFlap * 3, 0.3 - wingFlap, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#333';
        ctx.fillRect(-1, -6, 2, 12);
        ctx.restore();
        break;
        
      case 'rabbit':
        animal.hopTimer++;
        if (animal.hopTimer > 80 + Math.random() * 40) {
          animal.hop = 1;
          animal.hopTimer = 0;
          if (Math.random() > 0.7) animal.direction *= -1;
        }
        
        if (animal.hop > 0) {
          animal.hop -= 0.05;
          animal.x += animal.direction * 2;
        }
        
        // Keep in bounds
        if (animal.x < 50) { animal.x = 50; animal.direction = 1; }
        if (animal.x > this.width - 50) { animal.x = this.width - 50; animal.direction = -1; }
        
        const hopY = Math.sin(animal.hop * Math.PI) * 15;
        ctx.fillStyle = '#d4a574';
        ctx.save();
        ctx.translate(animal.x, animal.y - hopY);
        ctx.scale(animal.direction, 1);
        
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(10, -5, 8, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.ellipse(12, -18, 3, 10, 0.2, 0, Math.PI * 2);
        ctx.ellipse(8, -17, 3, 9, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-12, 2, 5, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(14, -6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
        
      case 'bird':
        animal.wingPhase += 0.2;
        animal.x += animal.speed * animal.direction;
        animal.y += Math.sin(this.time * 0.05 + animal.wingPhase) * 0.3;
        
        // Wrap around
        if (animal.x > this.width + 30) { animal.x = -30; }
        if (animal.x < -30) { animal.x = this.width + 30; }
        
        const wing = Math.sin(animal.wingPhase) * 8;
        ctx.fillStyle = '#333';
        ctx.save();
        ctx.translate(animal.x, animal.y);
        ctx.scale(animal.direction, 1);
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wing
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-8, -wing - 5, -5, -wing - 10);
        ctx.quadraticCurveTo(0, -wing - 5, 2, 0);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(8, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.fillStyle = '#f4a623';
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.lineTo(18, -1);
        ctx.lineTo(12, 0);
        ctx.fill();
        ctx.restore();
        break;
        
      case 'deer':
        ctx.fillStyle = '#c4a484';
        ctx.save();
        ctx.translate(animal.x, animal.y);
        ctx.scale(animal.facing, 1);
        
        // Body
        ctx.beginPath();
        ctx.ellipse(0, -25, 25, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.ellipse(25, -40, 12, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Legs
        ctx.fillRect(-15, -10, 5, 30);
        ctx.fillRect(-5, -10, 5, 28);
        ctx.fillRect(8, -10, 5, 30);
        ctx.fillRect(18, -10, 5, 28);
        // Antlers
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(28, -48);
        ctx.lineTo(32, -60);
        ctx.lineTo(28, -55);
        ctx.moveTo(32, -60);
        ctx.lineTo(38, -58);
        ctx.moveTo(22, -48);
        ctx.lineTo(18, -58);
        ctx.lineTo(22, -54);
        ctx.moveTo(18, -58);
        ctx.lineTo(12, -56);
        ctx.stroke();
        // Eye
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(32, -42, 2, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-25, -25, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
        
      case 'firefly':
        animal.phase += 0.03;
        animal.glowPhase += 0.08;
        animal.x += Math.sin(animal.phase) * 0.5;
        animal.y += Math.cos(animal.phase * 1.3) * 0.3;
        
        const glow = (Math.sin(animal.glowPhase) + 1) / 2;
        
        // Glow
        const glowGrad = ctx.createRadialGradient(animal.x, animal.y, 0, animal.x, animal.y, 15);
        glowGrad.addColorStop(0, `rgba(255, 255, 150, ${glow * 0.8})`);
        glowGrad.addColorStop(1, 'rgba(255, 255, 150, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(animal.x, animal.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = `rgba(200, 200, 100, ${0.5 + glow * 0.5})`;
        ctx.beginPath();
        ctx.arc(animal.x, animal.y, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  },
  
  drawBuilding(ctx, building, level) {
    const groundY = this.height * 0.65;
    
    switch (building.type) {
      case 'cottage':
        const cx = building.x;
        const cy = building.y;
        const size = building.size;
        
        // House body
        ctx.fillStyle = '#d4a574';
        ctx.fillRect(cx - 40 * size, cy - 50 * size, 80 * size, 50 * size);
        
        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(cx - 50 * size, cy - 50 * size);
        ctx.lineTo(cx, cy - 90 * size);
        ctx.lineTo(cx + 50 * size, cy - 50 * size);
        ctx.closePath();
        ctx.fill();
        
        // Door
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(cx - 10 * size, cy - 30 * size, 20 * size, 30 * size);
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.arc(cx + 5 * size, cy - 15 * size, 2 * size, 0, Math.PI * 2);
        ctx.fill();
        
        // Window
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(cx + 15 * size, cy - 40 * size, 15 * size, 15 * size);
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx + 15 * size, cy - 40 * size, 15 * size, 15 * size);
        ctx.beginPath();
        ctx.moveTo(cx + 22.5 * size, cy - 40 * size);
        ctx.lineTo(cx + 22.5 * size, cy - 25 * size);
        ctx.moveTo(cx + 15 * size, cy - 32.5 * size);
        ctx.lineTo(cx + 30 * size, cy - 32.5 * size);
        ctx.stroke();
        
        // Chimney
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(cx + 20 * size, cy - 95 * size, 15 * size, 25 * size);
        
        // Smoke
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        for (let i = 0; i < 3; i++) {
          const smokeY = cy - 100 * size - i * 15 - (this.time * 0.5 % 30);
          const smokeX = cx + 27 * size + Math.sin(this.time * 0.02 + i) * 5;
          ctx.beginPath();
          ctx.arc(smokeX, smokeY, 6 + i * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      case 'fence':
        ctx.fillStyle = '#8b7355';
        for (let x = 50; x < this.width - 50; x += 30) {
          // Skip where buildings are
          if (level >= 4 && x > this.width * 0.1 && x < this.width * 0.25) continue;
          if (level >= 6 && x > this.width * 0.8) continue;
          
          ctx.fillRect(x, groundY - 20, 5, 25);
        }
        // Horizontal bars
        ctx.fillRect(50, groundY - 15, this.width - 100, 3);
        ctx.fillRect(50, groundY - 5, this.width - 100, 3);
        break;
        
      case 'pond':
        // Water
        ctx.fillStyle = '#4a90a4';
        ctx.beginPath();
        ctx.ellipse(building.x, building.y, 50, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const ripplePhase = this.time * 0.02;
        for (let i = 0; i < 2; i++) {
          const r = 15 + (ripplePhase + i * 0.5) % 1 * 25;
          ctx.globalAlpha = 1 - (ripplePhase + i * 0.5) % 1;
          ctx.beginPath();
          ctx.ellipse(building.x - 10 + i * 15, building.y - 5, r, r * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        
        // Lilypads
        ctx.fillStyle = '#228b22';
        ctx.beginPath();
        ctx.ellipse(building.x - 20, building.y - 5, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(building.x + 15, building.y + 5, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'windmill':
        const wx = building.x;
        const wy = building.y;
        building.rotation += 0.02;
        
        // Tower
        ctx.fillStyle = '#d4a574';
        ctx.beginPath();
        ctx.moveTo(wx - 20, wy);
        ctx.lineTo(wx - 12, wy - 80);
        ctx.lineTo(wx + 12, wy - 80);
        ctx.lineTo(wx + 20, wy);
        ctx.closePath();
        ctx.fill();
        
        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(wx - 15, wy - 80);
        ctx.lineTo(wx, wy - 100);
        ctx.lineTo(wx + 15, wy - 80);
        ctx.closePath();
        ctx.fill();
        
        // Blades
        ctx.save();
        ctx.translate(wx, wy - 70);
        ctx.rotate(building.rotation);
        ctx.fillStyle = '#8b7355';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-3, 0, 6, 40);
          ctx.fillRect(-8, 35, 16, 8);
        }
        ctx.restore();
        
        // Center
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(wx, wy - 70, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'well':
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.ellipse(building.x, building.y, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(building.x, building.y, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Roof supports
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(building.x - 20, building.y - 35, 4, 35);
        ctx.fillRect(building.x + 16, building.y - 35, 4, 35);
        
        // Roof
        ctx.fillStyle = '#8b4513';
        ctx.beginPath();
        ctx.moveTo(building.x - 25, building.y - 35);
        ctx.lineTo(building.x, building.y - 50);
        ctx.lineTo(building.x + 25, building.y - 35);
        ctx.closePath();
        ctx.fill();
        break;
    }
  },
  
  updateParticles(ctx) {
    // Could add falling leaves, etc.
  }
};

// Export for use in main app
window.Garden = Garden;
