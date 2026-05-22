// ============================================================
// OMOSILE — JAVASCRIPT
// Handles: animations, game logic, scroll reveals, interactions
// ============================================================


// Register GSAP's ScrollTrigger plugin.
// This must happen before we use ScrollTrigger anywhere.
gsap.registerPlugin(ScrollTrigger);


// ============================================================
// SCENE 1 — ARRIVAL ANIMATION
// Runs immediately when page loads — no scroll needed.
// ============================================================

// We use a GSAP timeline for sequenced animations.
// Each animation runs after the previous one finishes.
const arrivalTl = gsap.timeline({ delay: 0.5 });

arrivalTl
  // Step 1: Her name fades in and moves up slightly
  .to('#arrival-name', {
    opacity: 1,
    y: 0,                    // y:0 means move to original position (from translateY 20px)
    duration: 2,
    ease: 'power2.out'       // starts fast, slows down — elegant feel
  })

  // Step 2: The meaning fades in underneath
  .to('#arrival-meaning', {
    opacity: 1,
    duration: 1.5,
    ease: 'power1.out'
  }, '+=0.3')                // += means 0.3s AFTER previous ends

  // Step 3: Scroll prompt appears last
  .to('#scroll-prompt', {
    opacity: 1,
    duration: 1,
    ease: 'power1.out'
  }, '+=0.5');


// ============================================================
// SCROLL REVEAL — Story Scenes
// Elements fade in and rise up as the user scrolls to them.
// ============================================================

// Select all elements that should reveal on scroll
const revealElements = document.querySelectorAll(
  '.scene-label, .scene-heading, .scene-divider, .scene-body, .scene-highlight, .contact-card, .game-instructions'
);

// For each element, create a ScrollTrigger animation
revealElements.forEach(el => {
  gsap.fromTo(el,
    // FROM: invisible and slightly below
    { opacity: 0, y: 24 },
    {
      // TO: visible and in place
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,          // watches this specific element
        start: 'top 85%',     // fires when element top is 85% down the viewport
        once: true            // only fires once — stays visible after
      }
    }
  );
});


// ============================================================
// STAR COLLECTIBLES — In story scenes
// Small stars scattered in scenes. Tap to collect.
// ============================================================

// Track how many stars collected across the whole site
let totalCollected = 0;

// All star collectible elements
const collectibleStars = document.querySelectorAll('.star-collectible');

collectibleStars.forEach(star => {

  star.addEventListener('click', function() {

    // Don't do anything if already collected
    if (this.classList.contains('collected')) return;

    // Mark as collected
    this.classList.add('collected');
    totalCollected++;

    // Animate the star with GSAP — glows and scales up
    gsap.to(this.querySelector('.star-inner'), {
      scale: 1.8,
      opacity: 1,
      color: '#C9A87C',
      duration: 0.4,
      ease: 'back.out(1.7)',  // slight overshoot — feels satisfying
      yoyo: true,             // reverses back to normal size
      repeat: 1
    });

    // Show the memory text briefly
    showMemoryFlash(this.dataset.memory);

  });

});


// ============================================================
// MEMORY FLASH — Shows brief memory text when star collected
// ============================================================

function showMemoryFlash(text) {
  const flash = document.getElementById('memory-flash');
  const textEl = document.getElementById('memory-text');

  // Set the text
  textEl.textContent = text;

  // Make it visible
  flash.classList.add('visible');

  // Hide it after 2.5 seconds
  setTimeout(() => {
    flash.classList.remove('visible');
  }, 2500);
}


// ============================================================
// FISH JOKE — Tap to reveal
// ============================================================

const fishJoke = document.getElementById('fish-joke');

if (fishJoke) {
  fishJoke.addEventListener('click', function() {
    this.classList.add('revealed');
  });
}


// ============================================================
// MINI GAME — Find 7 Hidden Stars
// ============================================================

// The 7 memories attached to each hidden game star
const gameStarMemories = [
  "He added a stranger. You accepted.",
  "Two horror fans. One story post. Everything changed.",
  "He said something. He doesn't remember what. But he remembers the energy.",
  "The accidental call that started everything.",
  "Iyawomi. Okomi. Names that mean everything.",
  "You be fish. He started it. Obviously.",
  "This moment. Right now. This was always the destination."
];

// How many game stars found so far
let gameStarsFound = 0;

// Reference to the game field container
const gameField = document.getElementById('game-field');
const starsFoundDisplay = document.getElementById('stars-found');

// Build the game — place 7 hidden stars at random positions
function buildGame() {
  if (!gameField) return;

  const fieldWidth  = gameField.offsetWidth  || 300;
  const fieldHeight = gameField.offsetHeight || 400;

  // We'll store star positions to avoid overlap
  const positions = [];

  for (let i = 0; i < 7; i++) {

    // Find a position that doesn't overlap existing stars
    let x, y, attempts = 0;
    do {
      // Random position with padding from edges
      x = 8 + Math.random() * 80;   // 8% to 88% of width
      y = 5 + Math.random() * 85;   // 5% to 90% of height
      attempts++;
    } while (
      attempts < 50 &&
      positions.some(p => Math.abs(p.x - x) < 15 && Math.abs(p.y - y) < 15)
      // Keep trying if too close to existing star (within 15% of field)
    );

    positions.push({ x, y });

    // Create the star element
    const star = document.createElement('div');
    star.className = 'game-star';

    // First star gets a hint pulse to teach the mechanic
    if (i === 0) star.classList.add('hint-star');

    star.textContent = '✦';

    // Position it
    star.style.left = x + '%';
    star.style.top  = y + '%';

    // Store which star number this is
    star.dataset.index = i;

    // Tap/click handler
    star.addEventListener('click', function() {
      if (this.classList.contains('found')) return; // already found

      // Mark as found
      this.classList.add('found');
      this.classList.remove('hint-star'); // remove pulse animation
      gameStarsFound++;

      // Update the counter display
      starsFoundDisplay.textContent = gameStarsFound;

      // Show memory for this star
      showMemoryFlash(gameStarMemories[parseInt(this.dataset.index)]);

      // Animate found star with GSAP
      gsap.fromTo(this,
        { scale: 1 },
        {
          scale: 2,
          duration: 0.3,
          ease: 'back.out(2)',
          yoyo: true,
          repeat: 1
        }
      );

      // Check if all 7 found
      if (gameStarsFound === 7) {
        // Small delay before showing completion
        setTimeout(showGameComplete, 800);
      }

    });

    gameField.appendChild(star);
  }
}

// Show the game completion overlay
function showGameComplete() {
  const complete = document.getElementById('game-complete');
  if (complete) {
    complete.classList.add('visible');
  }
}

// Continue button — scrolls down to gallery
const continueBtn = document.getElementById('continue-to-gallery');
if (continueBtn) {
  continueBtn.addEventListener('click', function() {
    const gallery = document.getElementById('scene-gallery');
    if (gallery) {
      gallery.scrollIntoView({ behavior: 'smooth' }); // smooth scroll
    }
  });
}

// Build the game when the game section becomes visible
// (avoids building it before the DOM is ready)
const gameSection = document.getElementById('scene-game');
if (gameSection) {
  const gameObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && gameStarsFound === 0) {
      // Small delay to let the section fully render first
      setTimeout(buildGame, 300);
      gameObserver.disconnect(); // only build once
    }
  }, { threshold: 0.3 });

  gameObserver.observe(gameSection);
}


// ============================================================
// GALLERY — Scroll reveal for photo frames
// ============================================================

// When gallery section becomes visible, reveal frames one by one
const galleryFrames = document.querySelectorAll('.gallery-frame');

galleryFrames.forEach((frame, index) => {
  gsap.fromTo(frame,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: index * 0.15,     // each frame reveals slightly after the previous
      ease: 'power2.out',
      scrollTrigger: {
        trigger: frame,
        start: 'top 88%',
        once: true
      }
    }
  );
});


// ============================================================
// CONFESSION — Line by line scroll reveal
// Each line appears as she scrolls through it.
// ============================================================

const confessionLines = document.querySelectorAll(
  '.confession-line, .confession-em, .confession-highlight, .confession-name, .confession-declaration, .confession-question'
);

confessionLines.forEach(line => {
  gsap.fromTo(line,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: line,
        start: 'top 80%',
        once: true
      }
    }
  );
});


// ============================================================
// ENDING — Constellation + fade in
// ============================================================

const endingCanvas  = document.getElementById('constellation-canvas');
const endingContent = document.getElementById('ending-content');

// Only run if the canvas element exists
if (endingCanvas) {
  const ctx = endingCanvas.getContext('2d');

  // Resize canvas to match screen
  function resizeCanvas() {
    endingCanvas.width  = window.innerWidth;
    endingCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // The 7 star points that will form the constellation
  // Positions are percentages of canvas size — responsive
  const constellationPoints = [
    { x: 0.20, y: 0.25 },
    { x: 0.35, y: 0.18 },
    { x: 0.50, y: 0.30 },
    { x: 0.65, y: 0.20 },
    { x: 0.78, y: 0.35 },
    { x: 0.55, y: 0.55 },
    { x: 0.40, y: 0.65 },
  ];

  // Animation state
  let progress = 0;       // 0 to 1 — how complete the constellation drawing is
  let animating = false;

  // Draw the constellation on canvas
  function drawConstellation(progress) {
    const w = endingCanvas.width;
    const h = endingCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw background stars (ambient — not the constellation)
    ctx.fillStyle = 'rgba(245,236,215,0.08)';
    for (let i = 0; i < 80; i++) {
      // Stable random positions using index as seed
      const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
      const sy = (Math.sin(i * 311.7) * 0.5 + 0.5) * h;
      const sr = 0.5 + (Math.sin(i * 74.3) * 0.5 + 0.5) * 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw the constellation lines connecting the points
    const totalLines = constellationPoints.length - 1;
    const lineProgress = Math.min(progress * 2, 1); // lines draw first half

    ctx.strokeStyle = 'rgba(201,168,124,0.3)';
    ctx.lineWidth = 0.8;

    for (let i = 0; i < totalLines; i++) {
      const segProgress = Math.max(0, Math.min(1,
        lineProgress * totalLines - i
      ));

      if (segProgress <= 0) continue;

      const start = constellationPoints[i];
      const end   = constellationPoints[i + 1];

      ctx.beginPath();
      ctx.moveTo(start.x * w, start.y * h);
      ctx.lineTo(
        start.x * w + (end.x - start.x) * w * segProgress,
        start.y * h + (end.y - start.y) * h * segProgress
      );
      ctx.stroke();
    }

    // Draw the star points — appear in second half of animation
    const pointProgress = Math.max(0, progress * 2 - 1);

    constellationPoints.forEach((point, i) => {
      const delay = i / constellationPoints.length;
      const alpha = Math.max(0, Math.min(1, (pointProgress - delay) * 5));

      if (alpha <= 0) return;

      const px = point.x * w;
      const py = point.y * h;

      // Outer glow
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, 12);
      gradient.addColorStop(0,   `rgba(201,168,124,${alpha * 0.6})`);
      gradient.addColorStop(1,   'rgba(201,168,124,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.fill();

      // Core star dot
      ctx.fillStyle = `rgba(245,236,215,${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Animate the constellation drawing
  function animateConstellation() {
    animating = true;

    gsap.to({ p: 0 }, {
      p: 1,
      duration: 4,
      ease: 'power1.inOut',
      onUpdate: function() {
        progress = this.targets()[0].p;
        drawConstellation(progress);
      },
      onComplete: function() {
        // After constellation fully drawn, fade in the ending text
        gsap.to(endingContent, {
          opacity: 1,
          y: 0,
          duration: 1.5,
          ease: 'power2.out'
        });
      }
    });
  }

  // Start constellation when ending section scrolls into view
  const endingSection = document.getElementById('scene-ending');
  if (endingSection) {
    const endObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !animating) {
        animateConstellation();
        endObserver.disconnect();
      }
    }, { threshold: 0.3 });

    endObserver.observe(endingSection);
  }

  // Draw initial state
  drawConstellation(0);
}
