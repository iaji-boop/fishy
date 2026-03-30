import { clamp, hsl, randRange } from "./utils.js";

class BubbleParticle {
  constructor(x, y, size, speed, drift, alpha = 1) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.drift = drift;
    this.alpha = alpha;
    this.phase = randRange(0, Math.PI * 2);
  }
}

class FoodParticle {
  constructor(x, y, drift) {
    this.x = x;
    this.y = y;
    this.vy = randRange(9, 16);
    this.drift = drift;
    this.age = 0;
    this.size = randRange(1.5, 2.8);
  }
}

class RippleParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 2;
    this.life = 0;
    this.maxLife = 0.75;
  }
}

export default class ParticleSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.bubbles = [];
    this.food = [];
    this.ripples = [];
    this.bubbleDensity = 1;
    this.bubbleAccumulator = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  setBubbleDensity(value) {
    this.bubbleDensity = value;
  }

  spawnBubbleBurst(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      this.bubbles.push(
        new BubbleParticle(
          x + randRange(-6, 6),
          y + randRange(-2, 2),
          randRange(1.5, 3.3),
          randRange(20, 42),
          randRange(-6, 6),
          randRange(0.8, 1.1)
        )
      );
    }
  }

  spawnRipple(x, y) {
    this.ripples.push(new RippleParticle(x, y));
  }

  spawnFood(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      this.food.push(new FoodParticle(x + randRange(-7, 7), y + randRange(-2, 4), randRange(-5, 5)));
    }
  }

  consumeFood(foodParticle) {
    const index = this.food.indexOf(foodParticle);
    if (index >= 0) {
      this.food.splice(index, 1);
    }
  }

  update(deltaTime, floorY) {
    this.bubbleAccumulator += deltaTime * (4 + this.bubbleDensity * 9);

    while (this.bubbleAccumulator >= 1) {
      this.bubbleAccumulator -= 1;
      this.bubbles.push(
        new BubbleParticle(
          randRange(8, this.width - 8),
          randRange(floorY - 6, this.height - 6),
          randRange(1.2, 2.6),
          randRange(10, 24),
          randRange(-2, 2),
          randRange(0.55, 0.9)
        )
      );
    }

    this.bubbles = this.bubbles.filter((bubble) => {
      bubble.y -= bubble.speed * deltaTime;
      bubble.x += Math.sin(bubble.phase + bubble.y * 0.1) * bubble.drift * deltaTime;
      bubble.alpha = clamp(bubble.alpha - deltaTime * 0.02, 0.15, 1.2);
      return bubble.y > -6;
    });

    this.food = this.food.filter((foodParticle) => {
      foodParticle.age += deltaTime;
      foodParticle.y += foodParticle.vy * deltaTime;
      foodParticle.x += Math.sin(foodParticle.age * 2.2) * foodParticle.drift * deltaTime;

      if (foodParticle.y >= floorY - 1) {
        foodParticle.y = floorY - 1;
        foodParticle.vy *= 0.15;
      }

      return foodParticle.age < 16;
    });

    this.ripples = this.ripples.filter((ripple) => {
      ripple.life += deltaTime;
      ripple.radius += deltaTime * 34;
      return ripple.life < ripple.maxLife;
    });
  }

  renderAmbient(ctx) {
    for (const bubble of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = clamp(bubble.alpha, 0.08, 0.65);
      ctx.strokeStyle = hsl(193, 92, 92);
      ctx.lineWidth = 1;
      ctx.strokeRect(bubble.x - bubble.size * 0.5, bubble.y - bubble.size * 0.5, bubble.size, bubble.size);
      ctx.restore();
    }

    for (const foodParticle of this.food) {
      ctx.fillStyle = hsl(42, 72, 66);
      ctx.fillRect(foodParticle.x, foodParticle.y, foodParticle.size, foodParticle.size);
      ctx.fillStyle = hsl(26, 48, 34);
      ctx.fillRect(foodParticle.x, foodParticle.y + foodParticle.size, Math.max(1, foodParticle.size - 0.4), 1);
    }
  }

  renderRipples(ctx) {
    for (const ripple of this.ripples) {
      const alpha = 1 - ripple.life / ripple.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = hsl(194, 95, 88);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
