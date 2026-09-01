export interface PresetClipInfo {
  id: string;
  title: string;
  genre: string;
  duration: number;
  description: string;
  renderType: 'noir' | 'scifi' | 'kitchen' | 'dragon' | 'sports';
  defaultCharacters: {
    name: string;
    voiceStyle: string;
    color: string;
    avatarIcon: string;
  }[];
  defaultScript: {
    speakerIndex: number;
    startTime: number;
    endTime: number;
    text: string;
    cue: string;
  }[];
}

export const PRESET_CLIPS: PresetClipInfo[] = [
  {
    id: 'noir-cat',
    title: 'Shadows & Claws (Noir Detective)',
    genre: 'Film Noir Comedy',
    duration: 18,
    description: 'A gritty 1940s detective confronts an enigmatic feline criminal in a rainy back alley.',
    renderType: 'noir',
    defaultCharacters: [
      { name: 'Detective Drake', voiceStyle: 'Gravelly, world-weary cigarette voice', color: '#f43f5e', avatarIcon: '🕵️‍♂️' },
      { name: 'Mr. Whiskers', voiceStyle: 'Smug, posh feline mastermind', color: '#0ea5e9', avatarIcon: '😼' }
    ],
    defaultScript: [
      { speakerIndex: 0, startTime: 1.0, endTime: 4.5, text: "The rain was pouring like stale coffee... Where's the catnip, Whiskers?", cue: "Gravelly voice, heavy sigh" },
      { speakerIndex: 1, startTime: 5.0, endTime: 9.0, text: "Oh detective, you're barking up the wrong scratching post. Meow.", cue: "Smug purr, condescending chuckle" },
      { speakerIndex: 0, startTime: 9.5, endTime: 13.5, text: "Don't play cute with me! You knocked the glass off the counter in cold blood!", cue: "Angry slam on desk, dramatic gasp" },
      { speakerIndex: 1, startTime: 14.0, endTime: 17.5, text: "Gravity is a fickle mistress, Drake. Next time... catch it!", cue: "Villainous cackle, hiss" }
    ]
  },
  {
    id: 'scifi-bridge',
    title: 'Code Red on Deck 9 (Sci-Fi Chaos)',
    genre: 'Sci-Fi Slapstick',
    duration: 16,
    description: 'A reckless starship commander and an overworked robot try to prevent the hyperdrive from exploding.',
    renderType: 'scifi',
    defaultCharacters: [
      { name: 'Captain Vance', voiceStyle: 'Booming action hero, overly confident', color: '#f59e0b', avatarIcon: '👨‍🚀' },
      { name: 'Unit 7-B', voiceStyle: 'Panicked robotic monotone, glitching', color: '#8b5cf6', avatarIcon: '🤖' }
    ],
    defaultScript: [
      { speakerIndex: 0, startTime: 1.0, endTime: 4.5, text: "Status report! Why is the coffee maker firing quantum lasers?!", cue: "Heroic shout, intense alarm" },
      { speakerIndex: 1, startTime: 5.0, endTime: 8.5, text: "Warning! Decaf protocols failed! Warp core temperature at 9000 percent!", cue: "Robotic stutter, rapid beeps" },
      { speakerIndex: 0, startTime: 9.0, endTime: 12.0, text: "Hit the big red button with the skull on it! That always works!", cue: "Reckless excitement" },
      { speakerIndex: 1, startTime: 12.5, endTime: 15.5, text: "That button releases the space bees! We are doomed! AAAAAHH!", cue: "Mechanical panic scream" }
    ]
  },
  {
    id: 'kitchen-meltdown',
    title: 'The Great Soufflé Disaster',
    genre: 'Cooking Show Drama',
    duration: 16,
    description: 'An aggressive head chef and a terrified rookie try to rescue a dessert on live television.',
    renderType: 'kitchen',
    defaultCharacters: [
      { name: 'Chef Jean-Pierre', voiceStyle: 'Dramatic French accent, yelling intensity', color: '#ef4444', avatarIcon: '👨‍🍳' },
      { name: 'Apprentice Timmy', voiceStyle: 'Squeaky, nervous teenager on first day', color: '#10b981', avatarIcon: '🧑‍🍳' }
    ],
    defaultScript: [
      { speakerIndex: 0, startTime: 1.0, endTime: 4.5, text: "Sacré bleu! Timmy! Look at this soufflé! It is flatter than a pancake!", cue: "Furious hand gestures, dramatic gasp" },
      { speakerIndex: 1, startTime: 5.0, endTime: 8.5, text: "Chef, I substituted powdered sugar with cement mix! It looked identical!", cue: "Whimpering voice, shaking knees" },
      { speakerIndex: 0, startTime: 9.0, endTime: 12.0, text: "You idiot sandwich! The food critic is biting into solid concrete!", cue: "Explosive anger, slapping cutting board" },
      { speakerIndex: 1, startTime: 12.5, endTime: 15.5, text: "On the bright side, Chef... it has incredible structural integrity!", cue: "Hopeful innocent squeak" }
    ]
  },
  {
    id: 'dragon-confrontation',
    title: 'The Reluctant Dragon Debate',
    genre: 'Fantasy Parody',
    duration: 20,
    description: 'A pompous knight attempts to slay a dragon who just wants to finish reading its book.',
    renderType: 'dragon',
    defaultCharacters: [
      { name: 'Sir Reginald', voiceStyle: 'Pompous Shakespearean knight', color: '#ec4899', avatarIcon: '🛡️' },
      { name: 'Ignis the Dragon', voiceStyle: 'Sleepy, bored British gentleman', color: '#14b8a6', avatarIcon: '🐲' }
    ],
    defaultScript: [
      { speakerIndex: 0, startTime: 1.0, endTime: 5.0, text: "Halt, vile beast of fiery brimstone! Prepare to taste righteous cold steel!", cue: "Pompous heraldic trumpet tone" },
      { speakerIndex: 1, startTime: 5.5, endTime: 9.5, text: "Do you mind? I'm in the middle of chapter 14. Could you duel me on Tuesday?", cue: "Bored yawn, turning book page" },
      { speakerIndex: 0, startTime: 10.0, endTime: 14.0, text: "Tuesday is my squire's pottery class! We shall do battle this very instant!", cue: "Indignant shouting, armor rattling" },
      { speakerIndex: 1, startTime: 14.5, endTime: 19.0, text: "Fine. *sigh* Consider yourself lightly toasted. Shoo now, Sir Clanks-a-Lot.", cue: "Dry sarcasm, tiny smoke puff" }
    ]
  }
];

// Helper to draw animated canvas scenes for preset clips
export function drawAnimatedScene(
  ctx: CanvasRenderingContext2D,
  type: PresetClipInfo['renderType'],
  time: number,
  width: number,
  height: number
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  if (type === 'noir') {
    // Rainy Noir Alley
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // City silhouette in background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, height * 0.3, 120, height * 0.7);
    ctx.fillRect(180, height * 0.2, 160, height * 0.8);
    ctx.fillRect(360, height * 0.35, 140, height * 0.65);
    ctx.fillRect(520, height * 0.15, 180, height * 0.85);

    // Streetlamp with glowing cone
    const lampX = width * 0.75;
    ctx.fillStyle = '#475569';
    ctx.fillRect(lampX - 6, height * 0.2, 12, height * 0.8);
    ctx.fillRect(lampX - 25, height * 0.18, 50, 16);

    // Light cone
    const grad = ctx.createRadialGradient(lampX, height * 0.2, 10, lampX, height * 0.6, width * 0.4);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    grad.addColorStop(0.8, 'rgba(254, 240, 138, 0.05)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(lampX, height * 0.2);
    ctx.lineTo(lampX - width * 0.35, height);
    ctx.lineTo(lampX + width * 0.35, height);
    ctx.closePath();
    ctx.fill();

    // Detective silhouette
    const detX = width * 0.3 + Math.sin(time * 0.5) * 8;
    const detY = height * 0.52;
    ctx.fillStyle = '#020617';
    // Hat
    ctx.beginPath();
    ctx.ellipse(detX, detY, 45, 14, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(detX - 25, detY - 30, 50, 30);
    // Trenchcoat body
    ctx.beginPath();
    ctx.moveTo(detX - 35, detY + 15);
    ctx.lineTo(detX + 35, detY + 15);
    ctx.lineTo(detX + 60, height * 0.95);
    ctx.lineTo(detX - 60, height * 0.95);
    ctx.closePath();
    ctx.fill();

    // Cat on a brick wall
    const catX = width * 0.78;
    const catY = height * 0.65 + Math.sin(time * 2) * 3;
    ctx.fillStyle = '#020617';
    // Wall
    ctx.fillRect(width * 0.68, height * 0.72, width * 0.3, height * 0.28);
    // Cat body
    ctx.beginPath();
    ctx.arc(catX, catY, 28, 0, Math.PI * 2);
    ctx.fill();
    // Cat ears
    ctx.beginPath();
    ctx.moveTo(catX - 22, catY - 20);
    ctx.lineTo(catX - 10, catY - 45);
    ctx.lineTo(catX, catY - 25);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(catX + 5, catY - 25);
    ctx.lineTo(catX + 18, catY - 45);
    ctx.lineTo(catX + 26, catY - 18);
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(catX - 10, catY - 6, 6, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(catX + 10, catY - 6, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rain lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 35; i++) {
      const rx = (i * 37 + time * 450) % width;
      const ry = (i * 53 + time * 800) % height;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 8, ry + 22);
      ctx.stroke();
    }
  } else if (type === 'scifi') {
    // Sci-Fi Spaceship Bridge
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Space window stars
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 43 + time * 15) % (width * 0.7) + width * 0.15;
      const sy = (i * 71) % (height * 0.45) + height * 0.05;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Asteroids floating by
    const astX = (time * 60) % (width + 100) - 50;
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(astX, height * 0.22, 25, 0, Math.PI * 2);
    ctx.fill();

    // Bridge console frame
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width * 0.2, height * 0.55);
    ctx.lineTo(width * 0.8, height * 0.55);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Pulsing Red Alarm Banner
    const alarmFlash = Math.sin(time * 8) > 0;
    ctx.fillStyle = alarmFlash ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.05)';
    ctx.fillRect(0, 0, width, height);

    // Glowing screens
    ctx.fillStyle = alarmFlash ? '#ef4444' : '#06b6d4';
    ctx.fillRect(width * 0.28, height * 0.62, width * 0.18, height * 0.18);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(width * 0.54, height * 0.62, width * 0.18, height * 0.18);

    // Captain
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(width * 0.4, height * 0.52, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    ctx.fillRect(width * 0.36, height * 0.56, 32, 40);

    // Robot Unit
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(width * 0.62, height * 0.44, 42, 42);
    // Robot eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(width * 0.65, height * 0.48, 12, 6);
    ctx.fillRect(width * 0.72, height * 0.48, 12, 6);
    // Antenna
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width * 0.67, height * 0.44);
    ctx.lineTo(width * 0.67, height * 0.38);
    ctx.stroke();
  } else if (type === 'kitchen') {
    // Kitchen Show
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, width, height);

    // Countertop
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, height * 0.65, width, height * 0.35);

    // Boiling Pot with Steam
    const potX = width * 0.5;
    const potY = height * 0.68;
    ctx.fillStyle = '#475569';
    ctx.fillRect(potX - 45, potY - 35, 90, 60);

    // Flying Pancake
    const panY = potY - 80 - Math.abs(Math.sin(time * 3)) * 60;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(potX, panY, 35, 12, time * 2, 0, Math.PI * 2);
    ctx.fill();

    // Steam puffs
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 5; i++) {
      const puffX = potX - 20 + i * 10 + Math.sin(time * 4 + i) * 12;
      const puffY = potY - 45 - ((time * 50 + i * 25) % 80);
      ctx.beginPath();
      ctx.arc(puffX, puffY, 12 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chef Left
    ctx.fillStyle = '#ffffff';
    // Tall chef hat
    ctx.fillRect(width * 0.22 - 25, height * 0.3, 50, 60);
    ctx.beginPath();
    ctx.arc(width * 0.22, height * 0.3, 30, 0, Math.PI * 2);
    ctx.fill();
    // Face
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(width * 0.22, height * 0.45, 25, 0, Math.PI * 2);
    ctx.fill();
    // Moustache
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(width * 0.22 - 20, height * 0.47, 40, 8);

    // Rookie Right (Panicking)
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.46, 24, 0, Math.PI * 2);
    ctx.fill();
    // Wide open mouth
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.49, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Dragon & Knight Fantasy
    ctx.fillStyle = '#312e81';
    ctx.fillRect(0, 0, width, height);

    // Moon
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.2, 40, 0, Math.PI * 2);
    ctx.fill();

    // Mountains
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width * 0.3, height * 0.4);
    ctx.lineTo(width * 0.6, height);
    ctx.lineTo(width * 0.8, height * 0.5);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Dragon on Right
    const dragX = width * 0.72;
    const dragY = height * 0.55 + Math.sin(time * 2) * 8;
    ctx.fillStyle = '#059669';
    // Dragon head
    ctx.beginPath();
    ctx.arc(dragX, dragY, 45, 0, Math.PI * 2);
    ctx.fill();
    // Snout
    ctx.fillRect(dragX - 60, dragY - 15, 60, 35);
    // Dragon eye with reading glasses
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(dragX - 25, dragY - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(dragX - 25, dragY - 10, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Book in Dragon claws
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(dragX - 70, dragY + 30, 45, 30);

    // Knight on Left
    const kX = width * 0.25;
    const kY = height * 0.65;
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(kX, kY - 20, 22, 0, Math.PI * 2);
    ctx.fill();
    // Helmet plume
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(kX - 5, kY - 50, 10, 25);
    // Sword raised
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(kX + 15, kY);
    ctx.lineTo(kX + 45, kY - 45);
    ctx.stroke();
  }

  ctx.restore();
}
