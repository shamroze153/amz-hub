import React from 'react';
import { motion } from 'motion/react';

export default function TeddyCreature() {
  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center select-none" style={{ perspective: 1000 }}>
      {/* Soft Ambient Shadow below Teddy */}
      <motion.div 
        className="absolute bottom-4 w-40 h-5 bg-slate-900/10 rounded-full blur-md"
        animate={{ 
          scale: [0.94, 1.06, 0.94],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: "easeInOut"
        }}
      />

      {/* Main Teddy SVG */}
      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.06)]"
      >
        <defs>
          {/* Teddy Fur Gradients */}
          <radialGradient id="furGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#DF9F6E" />
            <stop offset="70%" stopColor="#C27D4C" />
            <stop offset="100%" stopColor="#A25D2E" />
          </radialGradient>
          
          <radialGradient id="innerEarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F9D4B5" />
            <stop offset="100%" stopColor="#E5B289" />
          </radialGradient>

          <radialGradient id="snoutGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFF2E2" />
            <stop offset="100%" stopColor="#F5DCBF" />
          </radialGradient>

          <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFF2E2" />
            <stop offset="100%" stopColor="#E9CCA7" />
          </radialGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ==================== BODY (Faces forward, stays mostly still) ==================== */}
        <g id="teddy-body">
          {/* Breathing Body */}
          <motion.g
            animate={{ 
              scaleY: [0.98, 1.02, 0.98],
              scaleX: [1.01, 0.99, 1.01],
              y: [0.5, -0.5, 0.5]
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut"
            }}
            style={{ transformOrigin: '100px 165px' }}
          >
            {/* Soft Shadow behind head on neck */}
            <path d="M 85,115 Q 100,123 115,115" stroke="#7A3D16" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.15" />

            {/* Base Body Pear Shape */}
            <path 
              d="M 68,115 C 50,135 48,175 75,182 C 90,185 110,185 125,182 C 152,175 150,135 132,115 C 122,105 78,105 68,115 Z" 
              fill="url(#furGrad)" 
            />

            {/* Soft Fluffy Fur Tufts on Body Sides */}
            {/* Left side fluff */}
            <path d="M 58,135 Q 52,138 56,143 M 52,148 Q 46,152 52,156" stroke="#C27D4C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Right side fluff */}
            <path d="M 142,135 Q 148,138 144,143 M 148,148 Q 154,152 148,156" stroke="#C27D4C" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Belly Patch (Cream color) */}
            <path 
              d="M 80,125 C 65,140 65,170 80,178 C 90,182 110,182 120,178 C 135,170 135,140 120,125 C 110,117 90,117 80,125 Z" 
              fill="url(#bellyGrad)" 
            />

            {/* Tiny Fluffy Fur Tufts inside Belly */}
            <path d="M 95,135 Q 100,133 105,135" stroke="#D3B48F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            <path d="M 92,145 Q 100,142 108,145" stroke="#D3B48F" strokeWidth="1.2" strokeLinecap="round" fill="none" />

            {/* Tiny Paws (Forward Facing, Stays Still) */}
            {/* Left Paw */}
            <path 
              d="M 52,165 C 44,165 40,175 48,180 C 55,184 64,180 62,172 C 60,166 56,165 52,165 Z" 
              fill="#A25D2E" 
            />
            {/* Left paw pads */}
            <circle cx="50" cy="173" r="3.5" fill="#FFF2E2" opacity="0.9" />
            <circle cx="45" cy="170" r="1.8" fill="#FFF2E2" opacity="0.9" />
            <circle cx="50" cy="167" r="1.8" fill="#FFF2E2" opacity="0.9" />
            <circle cx="55" cy="170" r="1.8" fill="#FFF2E2" opacity="0.9" />

            {/* Right Paw */}
            <path 
              d="M 148,165 C 156,165 160,175 152,180 C 145,184 136,180 138,172 C 140,166 144,165 148,165 Z" 
              fill="#A25D2E" 
            />
            {/* Right paw pads */}
            <circle cx="150" cy="173" r="3.5" fill="#FFF2E2" opacity="0.9" />
            <circle cx="145" cy="170" r="1.8" fill="#FFF2E2" opacity="0.9" />
            <circle cx="150" cy="167" r="1.8" fill="#FFF2E2" opacity="0.9" />
            <circle cx="155" cy="170" r="1.8" fill="#FFF2E2" opacity="0.9" />
          </motion.g>
        </g>

        {/* ==================== HEAD (Slowly & Smoothly Turns Left & Right) ==================== */}
        <motion.g
          id="teddy-head-container"
          animate={{ 
            rotateY: [-11, 11, -11], // Slow 3D head rotation
            rotateZ: [-1.2, 1.2, -1.2], // Gentle tilting
            x: [-4.5, 4.5, -4.5], // Subtle lateral movement
            y: [-1, 0.5, -1] // Tiny bobbing
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
            ease: "easeInOut"
          }}
          style={{ transformOrigin: '100px 92px' }}
        >
          {/* EARS (Move with the head) */}
          {/* Left Ear */}
          <g id="left-ear">
            <circle cx="60" cy="50" r="21" fill="url(#furGrad)" />
            <circle cx="62" cy="52" r="13" fill="url(#innerEarGrad)" />
            {/* Fluffy tufts inside ear */}
            <path d="M 52,48 Q 55,42 58,45 M 56,54 Q 61,49 63,53" stroke="#FFF2E2" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>

          {/* Right Ear */}
          <g id="right-ear">
            <circle cx="140" cy="50" r="21" fill="url(#furGrad)" />
            <circle cx="138" cy="52" r="13" fill="url(#innerEarGrad)" />
            {/* Fluffy tufts inside ear */}
            <path d="M 148,48 Q 145,42 142,45 M 144,54 Q 139,49 137,53" stroke="#FFF2E2" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />
          </g>

          {/* MAIN HEAD DOME */}
          <circle cx="100" cy="92" r="44" fill="url(#furGrad)" />

          {/* Fluffy Tufts around the Head to create soft, fluffy fur look */}
          <g id="head-fur-tufts" stroke="#C27D4C" strokeWidth="2" strokeLinecap="round" fill="none">
            {/* Top crown hair tufts */}
            <path d="M 96,48 Q 100,40 104,48" fill="url(#furGrad)" stroke="none" />
            <path d="M 96,48 Q 100,40 104,48" />
            <path d="M 91,51 Q 95,44 100,50" />
            <path d="M 100,50 Q 105,43 109,51" />

            {/* Cheek tufts left */}
            <path d="M 58,88 Q 51,91 58,95" />
            <path d="M 56,96 Q 48,100 57,105" />
            <path d="M 59,106 Q 52,111 61,114" />

            {/* Cheek tufts right */}
            <path d="M 142,88 Q 149,91 142,95" />
            <path d="M 144,96 Q 152,100 143,105" />
            <path d="M 141,106 Q 148,111 139,114" />
          </g>

          {/* CUTE CHEEK BLUSH (Slight rosy circles) */}
          <circle cx="68" cy="104" r="8" fill="#FF8D8D" opacity="0.32" filter="url(#softGlow)" />
          <circle cx="132" cy="104" r="8" fill="#FF8D8D" opacity="0.32" filter="url(#softGlow)" />

          {/* SNOUT (Cream/Beige backdrop) */}
          <path 
            d="M 80,105 C 80,94 120,94 120,105 C 120,116 80,116 80,105 Z" 
            fill="url(#snoutGrad)" 
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
          />

          {/* SURPRISED OPEN MOUTH & VISIBLE FRONT TEETH */}
          <g id="mouth">
            {/* Surprised oval mouth cavity */}
            <ellipse cx="100" cy="111" rx="6" ry="7.5" fill="#3D1A10" />
            
            {/* Rosy tongue inside */}
            <path d="M 96,114 C 96,118 104,118 104,114 Z" fill="#FF7070" />

            {/* Cute tiny white front teeth (two teeth showing from top of mouth) */}
            <rect x="96.8" y="103.5" width="3" height="3" rx="0.5" fill="#FFFFFF" />
            <rect x="100.2" y="103.5" width="3" height="3" rx="0.5" fill="#FFFFFF" />
            <line x1="100" y1="103.5" x2="100" y2="106.5" stroke="#E2E8F0" strokeWidth="0.4" />
          </g>

          {/* SURPRISED NOSE (Cute rounded black/dark espresso triangle) */}
          <path 
            d="M 94,98 C 94,96.5 96,94.5 100,94.5 C 104,94.5 106,96.5 106,98 C 106,101 94,101 94,98 Z" 
            fill="#2D1914" 
          />
          {/* Nose shine highlight */}
          <ellipse cx="98.5" cy="96.5" rx="1.5" ry="0.8" fill="#FFFFFF" opacity="0.8" />

          {/* ==================== EYES (Pupils slowly drift to follow head turning naturally) ==================== */}
          {/* LEFT EYE */}
          <g id="left-eye-socket">
            {/* White/light background eye socket */}
            <ellipse cx="76" cy="84" rx="10.5" ry="11.5" fill="#FFFFFF" stroke="#C27D4C" strokeWidth="1" />
            
            {/* Pupil + Iris Container: Moves slightly in sync with the head movement */}
            <motion.g
              animate={{ 
                x: [-3.2, 3.2, -3.2], // Eyes drift naturally to look around
                y: [-0.6, 0.6, -0.6]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
            >
              {/* Large Dark Iris */}
              <circle cx="76" cy="84" r="6.8" fill="#2C1810" />
              {/* Beautiful Amber Inner Ring */}
              <circle cx="76" cy="84" r="5" fill="#9C5D34" opacity="0.3" />
              {/* Black Inner Pupil */}
              <circle cx="76" cy="84" r="4.2" fill="#0E0705" />
              
              {/* Surprised bright highlight reflections */}
              <circle cx="74" cy="81.5" r="2.2" fill="#FFFFFF" />
              <circle cx="78.2" cy="86" r="1" fill="#FFFFFF" opacity="0.85" />
            </motion.g>
          </g>

          {/* RIGHT EYE */}
          <g id="right-eye-socket">
            {/* White/light background eye socket */}
            <ellipse cx="124" cy="84" rx="10.5" ry="11.5" fill="#FFFFFF" stroke="#C27D4C" strokeWidth="1" />
            
            {/* Pupil + Iris Container: Moves slightly in sync with the head movement */}
            <motion.g
              animate={{ 
                x: [-3.2, 3.2, -3.2], // Eyes drift naturally to look around
                y: [-0.6, 0.6, -0.6]
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              }}
            >
              {/* Large Dark Iris */}
              <circle cx="124" cy="84" r="6.8" fill="#2C1810" />
              {/* Beautiful Amber Inner Ring */}
              <circle cx="124" cy="84" r="5" fill="#9C5D34" opacity="0.3" />
              {/* Black Inner Pupil */}
              <circle cx="124" cy="84" r="4.2" fill="#0E0705" />
              
              {/* Surprised bright highlight reflections */}
              <circle cx="122" cy="81.5" r="2.2" fill="#FFFFFF" />
              <circle cx="126.2" cy="86" r="1" fill="#FFFFFF" opacity="0.85" />
            </motion.g>
          </g>

          {/* Cute Soft Eye Brows */}
          <motion.path 
            d="M 66,70 Q 75,67 83,71" 
            stroke="#5C341A" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.85"
            animate={{ y: [-0.6, 0.6, -0.6] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
          <motion.path 
            d="M 117,71 Q 125,67 134,70" 
            stroke="#5C341A" 
            strokeWidth="2.2" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.85"
            animate={{ y: [-0.6, 0.6, -0.6] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        </motion.g>
      </svg>
    </div>
  );
}
