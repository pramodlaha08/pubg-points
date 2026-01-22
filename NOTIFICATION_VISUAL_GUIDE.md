# 🎮 Gaming Elimination Notification - Visual Guide

## Notification Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ╔═╗         ⚠  TEAM ELIMINATED  ⚠               ╔═╗               │
│  ║                                                   ║               │
│  ║                                                   ║               │
│  ║   💀                                              ║               │
│  ║  (rotating)    [LOGO]     TEAM NAME         ⚡   ║               │
│  ║                (glowing)   (huge, pulsing) (spin)║               │
│  ║                                                   ║               │
│  ║              [ELIMINATED] [#7] [12 🎯]            ║               │
│  ║                                                   ║               │
│  ╚═╝                Round 1                      ╚═╝               │
│  ████████████████████████████████                                   │
│         (progress bar - 6 seconds)                                  │
└─────────────────────────────────────────────────────────────────────┘

     💥  💥  💥  💥  💥  💥  💥  💥
   💥                            💥
 💥       (explosion effect)       💥
   💥                            💥
     💥  💥  💥  💥  💥  💥  💥  💥

        ○ ○ ○ (shockwave rings) ○ ○ ○
```

---

## Animation Sequence

### 0.0s - Entry

```
❌ (off-screen)
    ↓ Spring animation
    ↓ Scale 0.3 → 1.0
    ↓ RotateX -90° → 0°
    ↓ Y: -200 → 0
✅ (center screen)
```

### 0.0s - 6.0s - Display

```
- Screen flash (red, 0.6s)
- Skull rotating & scaling
- Logo glow rotating
- Team name text shadow pulsing
- Corner brackets flashing
- Scan lines moving
- Particles exploding outward (30+)
- Shockwave rings expanding (3x)
- Progress bar filling
```

### 6.0s - Exit

```
✅ (center screen)
    ↓ Scale 1.0 → 0.3
    ↓ RotateY 0° → 90°
    ↓ X: 0 → 800
    ↓ Fade out
❌ (off-screen right)
```

---

## Size Specifications

```
Container:        800px wide
Skull:           text-9xl (144px)
Logo:            100x100px
Team Name:       text-6xl (60px)
Badges:          text-lg (18px)
Progress Bar:    2px height
Particles:       10px diameter
Explosion Range: 250-400px radius
```

---

## Color Palette

```
🔴 Primary Red:     #dc2626 (red-600)
🟥 Dark Red:        #991b1b (red-800)
⬛ Black BG:        #111827 (gray-900)
🟡 Yellow Accent:   #fbbf24 (yellow-400)
🟧 Orange:          #f97316 (orange-500)
⚪ White Text:      #ffffff
🌫️ Gray Text:       #d1d5db (gray-300)
```

---

## Effects Breakdown

### 1. Screen Flash

- Duration: 0.6s
- Color: Red (#dc2626)
- Opacity: 0 → 0.3 → 0

### 2. Vignette

- Radial gradient
- Center: transparent
- Edge: rgba(139, 0, 0, 0.4)

### 3. Glow

- Box shadow animation
- 3 stages pulsing
- Red color with varying opacity

### 4. Skull

- Rotate: -10° to 10°
- Scale: 1.0 to 1.2
- Loop: infinite

### 5. Logo

- Border: 4px yellow
- Glow: rotating gradient ring
- Scale on hover: 1.1

### 6. Team Name

- Text shadow: pulsing white glow
- Stroke: 2px black
- Letter spacing: tight

### 7. Explosion Particles

- Count: 30
- Pattern: circular (360°)
- Distance: 250-400px
- Scale: 0 → 2 → 5
- Duration: 2.5s
- Colors: Red, orange, yellow

### 8. Shockwave

- Count: 3 waves
- Scale: 0 → 4
- Opacity: 0.8 → 0
- Delay: 0.3s between waves

### 9. Scan Lines

- Repeating gradient pattern
- Movement: top to bottom
- Speed: 3s per cycle
- Opacity: 10%

### 10. Corner Brackets

- 4 corners
- Flashing: opacity 0.5 → 1
- Staggered: 0.3s delay each

---

## Timing Chart

```
Time  | Event
------|------------------------------------------
0.0s  | Screen flash starts
0.0s  | Entry animation begins
0.3s  | Notification fully on screen
0.6s  | Screen flash complete
1.0s  | All animations looping
3.0s  | Halfway (progress bar)
6.0s  | Progress bar complete
6.0s  | Exit animation starts
6.6s  | Completely off screen
```

---

## Badge Information

### Eliminated Badge

```
┌─────────────┐
│ ELIMINATED  │  Red badge
│             │  Border: 2px red
└─────────────┘  Background: red/30% opacity
```

### Position Badge

```
┌─────┐
│  #7 │  Yellow badge
│     │  Shows elimination order
└─────┘  Counts down as teams eliminated
```

### Kills Badge

```
┌────────┐
│ 12 🎯 │  Orange badge
│       │  Only shown if kills > 0
└────────┘  Border: 2px orange
```

---

## Responsive Behavior

```
Desktop (1920x1080):  Full size (800px)
Tablet (768x1024):    Same (centered)
Mobile (375x667):     Not optimized (use desktop view)
```

Note: Designed for OBS/broadcast use, not mobile viewing.

---

## Integration Points

### Frontend Checks (every 2s)

```javascript
1. Fetch teams from API
2. Filter: status = "eliminated"
3. For each: Check backend "displayed"
4. If false: Add to queue
5. Show next in queue
```

### Backend Updates

```javascript
1. Notification shows
2. POST /elimination/display
3. Set displayed = true
4. Next check skips team
```

---

## Performance

- CPU: Medium (animations)
- GPU: Used (transform, opacity)
- Memory: Low
- Network: 1 request per notification
- FPS: 60fps smooth

---

## Browser Support

✅ Chrome/Edge (recommended)
✅ Firefox
✅ Safari
⚠️ Mobile browsers (not optimized)

---

## OBS Integration

```
Source:        Browser Source
URL:          http://localhost:3000/pointstable
Width:        1920
Height:       1080
FPS:          60
Chroma Key:   Green (#00ff00)
Position:     Fullscreen or overlay
```

---

## Customization

Want to change timing?

```typescript
// In GamingEliminationNotification.tsx, line ~95
timerRef.current = setTimeout(() => {
  setCurrentNotification(null);
}, 6000); // ← Change this (milliseconds)
```

Want more/fewer particles?

```typescript
// Line ~443
{[...Array(30)].map((_, i) => {
  // ↑ Change 30 to your number
```

Want different colors?

```typescript
// Change Tailwind classes:
bg-red-600 → bg-blue-600
border-yellow-500 → border-purple-500
```

---

**See it in action:** Run the app and eliminate a team! 🎮💀
