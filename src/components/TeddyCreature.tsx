import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';

export default function TeddyCreature() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isWinking, setIsWinking] = useState(false);
  const earControlsLeft = useAnimation();
  const earControlsRight = useAnimation();

  // Track mouse position relative to center of the mascot to guide the eye pupils organically
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 3;
      // Calculate normalized offset from -12 to 12 pixels
      const dx = ((e.clientX - centerX) / centerX) * 12;
      const dy = ((e.clientY - centerY) / centerY) * 10;
      setMousePos({
        x: Math.max(-12, Math.min(12, dx)),
        y: Math.max(-10, Math.min(10, dy)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Periodic random blinking, winking and ear-twitching to make the mascot feel completely alive
  useEffect(() => {
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        // Wink!
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 250);
      } else if (rand < 0.6) {
        // Twitch left ear
        earControlsLeft.start({
          rotate: [-6, 15, -6, 10, 0],
          transition: { duration: 0.6, ease: 'easeInOut' }
        });
      } else if (rand < 0.9) {
        // Twitch right ear
        earControlsRight.start({
          rotate: [6, -15, 6, -10, 0],
          transition: { duration: 0.6, ease: 'easeInOut' }
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [earControlsLeft, earControlsRight]);

  return (
    <div className="relative w-80 h-80 mx-auto flex items-center justify-center select-none">
      {/* 1. MAGICAL GLOWING BACKGROUND ORB */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl"
        animate={{
          scale: [0.95, 1.15, 0.95],
          rotate: [0, 360],
        }}
        transition={{
          repeat: Infinity,
          duration: 12,
          ease: 'linear',
        }}
      />

      {/* 2. PERSISTENT FLOATING SPARKLES (PARTICLES) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-indigo-400"
          style={{
            top: `${20 + i * 12}%`,
            left: `${15 + (i * 17) % 70}%`,
            boxShadow: '0 0 10px #818cf8, 0 0 20px #a78bfa',
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + (i % 3),
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 3. MASCOT CONTAINER (Floats softly in the air) */}
      <motion.div
        className="relative w-72 h-72 flex flex-col items-center justify-center"
        animate={{
          y: [-6, 6, -6],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: 'easeInOut',
        }}
      >
        {/* Soft realistic drop shadow under the feet */}
        <motion.div
          className="absolute bottom-1 w-44 h-4 bg-slate-950/20 rounded-full blur-md"
          animate={{
            scale: [0.9, 1.08, 0.9],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            ease: 'easeInOut',
          }}
        />

        <svg
          viewBox="0 0 240 240"
          className="w-full h-full filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.18)]"
        >
          <defs>
            {/* 3D Soft Fur Body Gradient (Premium Lilac-Blue Hue) */}
            <radialGradient id="body3D" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="75%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>

            {/* Inner Ear Peach Cream Gradient */}
            <linearGradient id="innerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffd8d8" />
              <stop offset="100%" stopColor="#fca5a5" />
            </linearGradient>

            {/* Gold Cheek Blush Glow */}
            <radialGradient id="blushGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
            </radialGradient>

            {/* Beautiful Deep Liquid Eye Gradient */}
            <radialGradient id="liquidEye" cx="40%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Metallic Gold Collar & Accent */}
            <linearGradient id="goldCollar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Realistic 3D Shading for Belly */}
            <radialGradient id="bellyGrad" cx="50%" cy="25%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
          </defs>

          {/* ================= LEFT EAR (Fluffy Bunny/Panda Ear) ================= */}
          <motion.g
            animate={earControlsLeft}
            style={{ transformOrigin: '72px 75px' }}
          >
            {/* Outer Ear */}
            <ellipse
              cx="72"
              cy="55"
              rx="24"
              ry="38"
              fill="url(#body3D)"
              transform="rotate(-15 72 55)"
            />
            {/* Inner Soft Ear */}
            <ellipse
              cx="72"
              cy="58"
              rx="14"
              ry="26"
              fill="url(#innerEarGrad)"
              transform="rotate(-15 72 58)"
            />
          </motion.g>

          {/* ================= RIGHT EAR (Fluffy Bunny/Panda Ear) ================= */}
          <motion.g
            animate={earControlsRight}
            style={{ transformOrigin: '168px 75px' }}
          >
            {/* Outer Ear */}
            <ellipse
              cx="168"
              cy="55"
              rx="24"
              ry="38"
              fill="url(#body3D)"
              transform="rotate(15 168 55)"
            />
            {/* Inner Soft Ear */}
            <ellipse
              cx="168"
              cy="58"
              rx="14"
              ry="26"
              fill="url(#innerEarGrad)"
              transform="rotate(15 168 58)"
            />
          </motion.g>

          {/* ================= COSY MASCOT BODY ================= */}
          <g id="body-base">
            {/* Rounded soft 3D body sphere */}
            <ellipse cx="120" cy="170" rx="55" ry="50" fill="url(#body3D)" />

            {/* Cute Creamy White Bellied Patch */}
            <ellipse cx="120" cy="172" rx="38" ry="32" fill="url(#bellyGrad)" />

            {/* Little Cute Gold Medal Collar Bell */}
            <circle cx="120" cy="130" r="11" fill="url(#goldCollar)" stroke="#b45309" strokeWidth="1" />
            <circle cx="120" cy="125" r="4" fill="#fef08a" opacity="0.8" />
            {/* Tiny Bell Slot */}
            <circle cx="120" cy="132" r="2.5" fill="#451a03" />

            {/* Left Cute Rounded Foot */}
            <ellipse cx="80" cy="216" rx="16" ry="12" fill="url(#body3D)" />
            <circle cx="80" cy="212" r="6" fill="#f1f5f9" />
            
            {/* Right Cute Rounded Foot */}
            <ellipse cx="160" cy="216" rx="16" ry="12" fill="url(#body3D)" />
            <circle cx="160" cy="212" r="6" fill="#f1f5f9" />

            {/* Left Hand (resting cozy on belly) */}
            <ellipse cx="68" cy="164" rx="14" ry="11" fill="url(#body3D)" transform="rotate(25 68 164)" />
          </g>

          {/* ================= COSY WAVING RIGHT HAND (Welcoming!) ================= */}
          <motion.g
            id="waving-hand"
            animate={{
              rotate: [0, 20, -5, 20, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            style={{ transformOrigin: '168px 164px' }}
          >
            {/* Cozy round paw waving */}
            <ellipse cx="174" cy="154" rx="15" ry="12" fill="url(#body3D)" transform="rotate(-30 174 154)" />
            {/* Soft pink paw print details */}
            <circle cx="174" cy="154" r="5" fill="#fca5a5" opacity="0.9" />
            <circle cx="167" cy="147" r="2" fill="#ffd8d8" opacity="0.9" />
            <circle cx="175" cy="144" r="2" fill="#ffd8d8" opacity="0.9" />
            <circle cx="182" cy="149" r="2" fill="#ffd8d8" opacity="0.9" />
          </motion.g>

          {/* ================= MASCOT HEAD ================= */}
          <g id="head-base">
            {/* Fluffy perfectly round face */}
            <circle cx="120" cy="100" r="52" fill="url(#body3D)" />

            {/* Soft pink blush cheeks */}
            <circle cx="84" cy="115" r="12" fill="url(#blushGlow)" />
            <circle cx="156" cy="115" r="12" fill="url(#blushGlow)" />

            {/* ================= COSY EXPRESSIVE LENS EYES ================= */}
            {/* LEFT EYE */}
            <g id="left-eye-container">
              {isWinking ? (
                // Happy closed wink curve
                <path
                  d="M 76,96 Q 86,106 96,96"
                  stroke="#1e1b4b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : (
                <>
                  <ellipse cx="86" cy="96" rx="10" ry="13" fill="url(#liquidEye)" />
                  {/* Organic Pupil Glinting / Gaze tracking mouse position */}
                  <motion.circle
                    cx="88"
                    cy="94"
                    r="4.5"
                    fill="#ffffff"
                    style={{ x: mousePos.x * 0.4, y: mousePos.y * 0.4 }}
                  />
                  {/* Secondary Sparkle reflection */}
                  <motion.circle
                    cx="83.5"
                    cy="99"
                    r="2"
                    fill="#ffffff"
                    opacity="0.8"
                    style={{ x: mousePos.x * 0.35, y: mousePos.y * 0.35 }}
                  />
                  <motion.circle
                    cx="90.5"
                    cy="98"
                    r="1"
                    fill="#93c5fd"
                    opacity="0.6"
                    style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
                  />
                </>
              )}
            </g>

            {/* RIGHT EYE */}
            <g id="right-eye-container">
              <ellipse cx="154" cy="96" rx="10" ry="13" fill="url(#liquidEye)" />
              {/* Gaze tracking mouse position */}
              <motion.circle
                cx="152"
                cy="94"
                r="4.5"
                fill="#ffffff"
                style={{ x: mousePos.x * 0.4, y: mousePos.y * 0.4 }}
              />
              {/* Secondary Sparkle reflection */}
              <motion.circle
                cx="147.5"
                cy="99"
                r="2"
                fill="#ffffff"
                opacity="0.8"
                style={{ x: mousePos.x * 0.35, y: mousePos.y * 0.35 }}
              />
              <motion.circle
                cx="154.5"
                cy="98"
                r="1"
                fill="#93c5fd"
                opacity="0.6"
                style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
              />
            </g>

            {/* Cute mini eyebrows */}
            <motion.path
              d="M 78,78 Q 86,74 94,80"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M 146,80 Q 154,74 162,78"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.2 }}
            />

            {/* Little Cute Button Nose */}
            <polygon
              points="115,108 125,108 120,113"
              fill="#1e193b"
              stroke="#1e193b"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Highlight on nose */}
            <ellipse cx="120" cy="109" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.8" />

            {/* Joyful open mouth smile */}
            <path
              d="M 112,117 Q 120,112 128,117"
              stroke="#1e193b"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 113.5,117 C 113.5,126 126.5,126 126.5,117"
              fill="#f43f5e"
              stroke="#1e193b"
              strokeWidth="1.5"
            />
            {/* Cute tongue inside */}
            <path
              d="M 117,121 C 117,121 120,118 123,121 C 123,124 117,124 117,121"
              fill="#fda4af"
            />
          </g>
        </svg>

        {/* 4. FLOATING TEXT SPEECH BUBBLE (Welcomes them with cozy aura) */}
        <motion.div
          className="absolute -top-10 bg-white/95 border border-slate-100 px-3.5 py-1.5 rounded-2xl shadow-xl text-[11px] font-extrabold text-indigo-700 flex items-center gap-1 backdrop-blur-sm"
          animate={{
            scale: [0.96, 1.04, 0.96],
            y: [0, -3, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: 'easeInOut',
          }}
        >
          <span className="text-sm">👋</span>
          <span>Hi! Welcome Back!</span>
          {/* Bubble tail */}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white/95 border-r border-b border-slate-100 rotate-45" />
        </motion.div>
      </motion.div>
    </div>
  );
}
