# Tournament Squad Size Configuration Guide

## Overview

Your tournament system is now fully configurable to support both **4-player squad** and **2-player duo** formats. Simply change an environment variable to switch between tournament types.

## Quick Start

### Switch to Duo Mode (2 Players)

**Backend (.env):**
```env
TEAM_SQUAD_SIZE=2
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_TEAM_SQUAD_SIZE=2
```

### Switch to Squad Mode (4 Players)

**Backend (.env):**
```env
TEAM_SQUAD_SIZE=4
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_TEAM_SQUAD_SIZE=4
```

## What Changes When You Switch Squad Size?

When you update the `TEAM_SQUAD_SIZE` variable, the following updates automatically:

### Backend Changes
- **Player Index Validation**: Eliminat player validation changes from `0-3` to `0-1` (for duo) or `0-3` (for squad)
- **Elimination Count Logic**: Team is marked as "eliminated" when:
  - **Duo mode**: eliminationCount >= 2
  - **Squad mode**: eliminationCount >= 4
- **Team Log Messages**: Messages display correct player count dynamically
  - Duo: "Player has 1/2 eliminated players"
  - Squad: "Player has 3/4 eliminated players"

### Frontend Changes
- **Player Buttons**: Displays correct number of player buttons in controller
  - **Duo mode**: Shows 2 buttons (P1, P2)
  - **Squad mode**: Shows 4 buttons (P1-P4)
- **Elimination Display**: Shows correct max count
  - **Duo mode**: "Eliminations: 1/2"
  - **Squad mode**: "Eliminations: 3/4"
- **Team Cards**: Automatically adjusts grid layout and button count
- **Tables**: All team tables show correct elimination indicators

## Configuration Files

### Backend Configuration
**File**: `src/config/squadSize.js`

```javascript
SQUAD_CONFIG = {
  maxPlayers: 2 or 4,
  maxPlayerIndex: 1 or 3,
  fullEliminationCount: 2 or 4,
}
```

**Reads from**: `TEAM_SQUAD_SIZE` environment variable

### Frontend Configuration
**File**: `lib/squadConfig.ts`

```typescript
SQUAD_CONFIG = {
  maxPlayers: 2 or 4,
  maxPlayerIndex: 1 or 3,
  fullEliminationCount: 2 or 4,
  getPlayerLabel(index): "P1", "P2", etc.
  isValidPlayerIndex(index): boolean
  playerIndices(): [0, 1] or [0, 1, 2, 3]
}
```

**Reads from**: `NEXT_PUBLIC_TEAM_SQUAD_SIZE` environment variable

## Implementation Details

### Files Updated

**Backend:**
- `src/config/squadSize.js` (new)
- `src/controllers/team.controller.js` - Elimination validation and counts
- `src/controllers/eliminationNotification.controller.js` - Elimination tracking
- `src/utils/teamLog.helper.js` - Log message templates
- `.env.example` - Added TEAM_SQUAD_SIZE

**Frontend:**
- `lib/squadConfig.ts` (new)
- `components/TeamCard.tsx` - Player buttons and elimination display
- `components/TeamTable2.tsx` - Team status table
- `.env.example` - Added NEXT_PUBLIC_TEAM_SQUAD_SIZE

### Key Implementation Pattern

All hardcoded player/elimination references now use the centralized config:

**Before:**
```javascript
// Backend
if (playerIndex > 3) throw new Error("Invalid");
if (eliminationCount === 4) team.isEliminated = true;

// Frontend
{[0, 1, 2, 3].map(i => <Button key={i}>{i + 1}</Button>)}
<p>Eliminations: {count}/4</p>
```

**After:**
```javascript
// Backend
if (!SQUAD_CONFIG.isValidPlayerIndex(playerIndex)) throw new Error("Invalid");
if (eliminationCount === SQUAD_CONFIG.fullEliminationCount) team.isEliminated = true;

// Frontend
{SQUAD_CONFIG.playerIndices().map(i => <Button>{SQUAD_CONFIG.getPlayerLabel(i)}</Button>)}
<p>Eliminations: {count}/{SQUAD_CONFIG.fullEliminationCount}</p>
```

## Testing the Configuration

### 1. Update Environment Variables
```bash
# Backend
echo "TEAM_SQUAD_SIZE=2" >> .env

# Frontend  
echo "NEXT_PUBLIC_TEAM_SQUAD_SIZE=2" >> .env.local
```

### 2. Restart Services
```bash
# Backend
npm run dev

# Frontend (in another terminal)
npm run build && npm run dev
```

### 3. Test Pages
- **Controller**: Should show 2 player buttons per team (or 4)
- **Team Cards**: Should display correct elimination count (X/2 or X/4)
- **Leaderboard**: Should show correct team status
- **Live Feed**: Should log messages with correct player counts

### 4. Verify Eliminations
- Eliminate players via controller
- Check team status when all players are eliminated
- Verify commentator feed shows correct elimination messages

## Environment Variable Priority

Both backend and frontend read their respective variables:
- **Backend**: `TEAM_SQUAD_SIZE` (from `.env`)
- **Frontend**: `NEXT_PUBLIC_TEAM_SQUAD_SIZE` (from `.env.local`)

⚠️ **Important**: Keep these in sync for consistent behavior across your system.

## Reverting Changes

If you need to modify the squad size after tournament data has been created, the system will still work because:
- All team data stores the raw `eliminationCount` value
- Display logic uses the current config value
- Historical data remains unchanged

Just update the env variables and restart services.

## Future Customizations

The configuration system supports any number of players:

```javascript
// To add support for 3-player teams (if needed later)
// 1. Update permitted values in squadSize.js
// 2. Add new env handling
// 3. Restart services
```

## Troubleshooting

### "Invalid player index" errors
- Check `TEAM_SQUAD_SIZE` matches `NEXT_PUBLIC_TEAM_SQUAD_SIZE`
- Verify environment variables are set correctly
- Restart backend and frontend services

### Wrong number of player buttons showing
- Clear `.next` build cache: `rm -r .next`
- Rebuild frontend: `npm run build`
- Hard refresh browser (Ctrl+Shift+R)

### Elimination counts not matching
- Verify backend SQUAD_CONFIG is loaded: run backend in dev mode and check logs
- Check that new team rounds are created after config change
- Existing rounds keep their old elimination data (expected behavior)

## Database Migration (if needed)

If you want to backfill or clear data when changing squad sizes:

```javascript
// Backend API endpoint (add to team.controller.js if needed)
export const resetAllTeamRounds = asyncHandler(async (req, res) => {
  await Team.updateMany({}, { rounds: [] });
  // ... rest of cleanup
});
```

**Use with caution** - this will delete all round data.
