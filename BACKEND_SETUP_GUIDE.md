# Backend Elimination Tracking System - Complete Guide

## Overview

Backend-based elimination notification system that syncs across multiple devices using MongoDB to track which eliminations have been displayed.

---

## Backend Files to Create

### 1. Elimination Tracking Model

**File:** `pubg-backend/models/eliminationTracking.model.js`

```javascript
import mongoose from "mongoose";

const eliminationTrackingSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },
    eliminatedAt: {
      type: Date,
      default: Date.now,
    },
    displayed: {
      type: Boolean,
      default: false,
    },
    displayedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Compound index to ensure unique tracking per team per round
eliminationTrackingSchema.index(
  { teamId: 1, roundNumber: 1 },
  { unique: true },
);

export const EliminationTracking = mongoose.model(
  "EliminationTracking",
  eliminationTrackingSchema,
);
```

---

### 2. Elimination Controller

**File:** `pubg-backend/controllers/elimination.controller.js`

```javascript
import { EliminationTracking } from "../models/eliminationTracking.model.js";
import { Team } from "../models/team.model.js";

// Track new elimination
export const trackElimination = async (req, res) => {
  try {
    const { teamId, roundNumber } = req.body;

    if (!teamId || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: "teamId and roundNumber are required",
      });
    }

    // Get team info
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Create or update tracking
    const tracking = await EliminationTracking.findOneAndUpdate(
      { teamId, roundNumber },
      {
        teamId,
        teamName: team.name,
        roundNumber,
        eliminatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      message: "Elimination tracked successfully",
      data: tracking,
    });
  } catch (error) {
    console.error("Error tracking elimination:", error);
    res.status(500).json({
      success: false,
      message: "Error tracking elimination",
      error: error.message,
    });
  }
};

// Mark elimination as displayed
export const markAsDisplayed = async (req, res) => {
  try {
    const { teamId, roundNumber } = req.body;

    if (!teamId || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: "teamId and roundNumber are required",
      });
    }

    const tracking = await EliminationTracking.findOneAndUpdate(
      { teamId, roundNumber },
      {
        displayed: true,
        displayedAt: new Date(),
      },
      { new: true },
    );

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Elimination tracking not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Marked as displayed successfully",
      data: tracking,
    });
  } catch (error) {
    console.error("Error marking as displayed:", error);
    res.status(500).json({
      success: false,
      message: "Error marking as displayed",
      error: error.message,
    });
  }
};

// Check if elimination has been displayed
export const checkDisplayStatus = async (req, res) => {
  try {
    const { teamId, roundNumber } = req.params;

    if (!teamId || !roundNumber) {
      return res.status(400).json({
        success: false,
        message: "teamId and roundNumber are required",
      });
    }

    const tracking = await EliminationTracking.findOne({ teamId, roundNumber });

    if (!tracking) {
      // Not tracked yet, return not displayed
      return res.status(200).json({
        success: true,
        data: {
          displayed: false,
          tracked: false,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        displayed: tracking.displayed,
        tracked: true,
        tracking,
      },
    });
  } catch (error) {
    console.error("Error checking display status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking display status",
      error: error.message,
    });
  }
};

// Get all eliminations for a round
export const getEliminationsByRound = async (req, res) => {
  try {
    const { roundNumber } = req.params;

    const eliminations = await EliminationTracking.find({ roundNumber })
      .sort({ eliminatedAt: 1 })
      .populate("teamId");

    res.status(200).json({
      success: true,
      count: eliminations.length,
      data: eliminations,
    });
  } catch (error) {
    console.error("Error getting eliminations:", error);
    res.status(500).json({
      success: false,
      message: "Error getting eliminations",
      error: error.message,
    });
  }
};

// Reset all tracking (for new tournament)
export const resetAllTracking = async (req, res) => {
  try {
    await EliminationTracking.deleteMany({});

    res.status(200).json({
      success: true,
      message: "All elimination tracking reset successfully",
    });
  } catch (error) {
    console.error("Error resetting tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting tracking",
      error: error.message,
    });
  }
};

// Reset tracking for specific round
export const resetRoundTracking = async (req, res) => {
  try {
    const { roundNumber } = req.params;

    await EliminationTracking.deleteMany({ roundNumber });

    res.status(200).json({
      success: true,
      message: `Elimination tracking reset for round ${roundNumber}`,
    });
  } catch (error) {
    console.error("Error resetting round tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting round tracking",
      error: error.message,
    });
  }
};
```

---

### 3. Elimination Routes

**File:** `pubg-backend/routes/elimination.routes.js`

```javascript
import express from "express";
import {
  trackElimination,
  markAsDisplayed,
  checkDisplayStatus,
  getEliminationsByRound,
  resetAllTracking,
  resetRoundTracking,
} from "../controllers/elimination.controller.js";

const router = express.Router();

// Track new elimination
router.post("/track", trackElimination);

// Mark elimination as displayed
router.post("/display", markAsDisplayed);

// Check if elimination has been displayed
router.get("/check/:teamId/:roundNumber", checkDisplayStatus);

// Get all eliminations for a round
router.get("/round/:roundNumber", getEliminationsByRound);

// Reset all tracking
router.delete("/reset", resetAllTracking);

// Reset tracking for specific round
router.delete("/reset/round/:roundNumber", resetRoundTracking);

export default router;
```

---

### 4. Add Routes to Your App

In `pubg-backend/app.js` or `pubg-backend/index.js`, add:

```javascript
import eliminationRoutes from "./routes/elimination.routes.js";

// Add this line with your other routes
app.use("/api/v1/elimination", eliminationRoutes);
```

---

## How the System Works

### Complete Flow:

1. **Team Gets Eliminated** (eliminationCount >= 4, status: "eliminated")
2. **Frontend Polls** (every 2 seconds)
   - Fetches all teams from: `GET /api/v1/team`
   - Finds teams with `status: "eliminated"`
3. **Check Backend Tracking**
   - For each eliminated team: `GET /api/v1/elimination/check/:teamId/:roundNumber`
   - If `displayed: false` → Add to notification queue
   - If `displayed: true` → Skip (already shown)

4. **Show Notification**
   - Display for 6 seconds with gaming animation
   - **Immediately** call: `POST /api/v1/elimination/display`
   - Backend marks `displayed: true`

5. **Next Poll**
   - Same team still eliminated
   - Backend returns `displayed: true`
   - **Notification skipped** ✅

6. **Round Changes**
   - Fresh tracking for new round
   - New eliminations show again

---

## API Endpoints Reference

### Track Elimination (Optional - auto-tracked by frontend)

```
POST /api/v1/elimination/track
Content-Type: application/json

{
  "teamId": "697224a82edc6858aec82070",
  "roundNumber": 1
}
```

### Mark as Displayed (Called automatically by notification)

```
POST /api/v1/elimination/display
Content-Type: application/json

{
  "teamId": "697224a82edc6858aec82070",
  "roundNumber": 1
}
```

### Check Display Status (Polled by frontend)

```
GET /api/v1/elimination/check/:teamId/:roundNumber

Response:
{
  "success": true,
  "data": {
    "displayed": false,
    "tracked": false
  }
}
```

### Get All Eliminations for Round

```
GET /api/v1/elimination/round/:roundNumber
```

### Reset All Tracking (Testing)

```
DELETE /api/v1/elimination/reset
```

### Reset Round Tracking (Testing)

```
DELETE /api/v1/elimination/reset/round/:roundNumber
```

---

## Testing Instructions

### 1. Start Backend

```bash
cd pubg-backend
npm install
npm start
# Should run on http://localhost:8000
```

### 2. Verify Backend Routes

```bash
# Test with curl or Postman
curl http://localhost:8000/api/v1/team
```

### 3. Start Frontend

```bash
cd pubg-points
npm run dev
# Should run on http://localhost:3000
```

### 4. Open Pointstable Page

```
http://localhost:3000/pointstable
```

### 5. Eliminate a Team

- In your controller, set a team's:
  - `eliminationCount: 4`
  - `eliminatedPlayers: [0, 1, 2, 3]`
  - `status: "eliminated"`

### 6. Watch Notification Appear

- Should show within 2 seconds
- Display for 6 seconds
- Auto-dismiss
- Won't show again

### 7. Test Multi-Device Sync

- Open same page in another browser/device
- Notification already marked as displayed
- Won't show on second device

### 8. Reset for Testing

```bash
# Reset all elimination tracking
curl -X DELETE http://localhost:8000/api/v1/elimination/reset
```

---

## Environment Variables

**Frontend `.env.local`:**

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Backend `.env`:**

```
MONGODB_URI=your_mongodb_connection_string
PORT=8000
```

---

## Notification Features

✅ **Gaming-Style Design**

- Massive skull animation
- Screen flash effect
- Explosion particles (30+)
- Shockwave rings
- Corner decorations
- Scan line effects

✅ **Information Display**

- Team logo (large, animated)
- Team name (big, glowing text)
- Elimination order (#8, #7, #6...)
- Kill count with icon
- Round number

✅ **Technical Features**

- Backend-synced tracking
- Multi-device support
- Queue system (one at a time)
- Auto-dismiss (6 seconds)
- No duplicates
- Round-aware

---

## Troubleshooting

### Notifications not showing?

**Check:**

1. Browser console for errors
2. API is running: `curl http://localhost:8000/api/v1/team`
3. Team has `status: "eliminated"`
4. Team has `eliminationCount >= 4`
5. Network tab shows API calls

**Debug:**

```javascript
// Check browser console for logs:
// "Adding [TeamName] to elimination queue (Round X)"
```

### Showing infinitely?

**Solution:**

1. Check backend: `GET /api/v1/elimination/check/:teamId/:roundNumber`
2. Should show `displayed: true` after first show
3. If stuck at `false`, check POST request is working
4. Reset tracking: `DELETE /api/v1/elimination/reset`

### Multiple notifications at once?

- System queues them
- Shows one at a time
- 6 seconds each
- Check queue in console logs

### Works on one device but not another?

- Check both devices use same API URL
- Verify MongoDB is accessible
- Check network/firewall

---

## Database Schema

**Collection:** `eliminationtrackings`

```javascript
{
  _id: ObjectId,
  teamId: ObjectId (ref: Team),
  teamName: String,
  roundNumber: Number,
  eliminatedAt: Date,
  displayed: Boolean,
  displayedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

- Compound unique index on `(teamId, roundNumber)`

---

## Production Deployment

1. Deploy backend to cloud (Heroku, Railway, etc.)
2. Update frontend environment:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api/v1
```

3. Ensure MongoDB is accessible from backend server
4. Test from multiple devices
5. Monitor MongoDB for tracking data

---

## System Status

✅ Frontend notification component created
✅ Backend tracking system designed
✅ Multi-device sync supported
✅ Queue system implemented
✅ Auto-dismiss working
✅ Gaming animations complete
✅ Ready for testing

**Next Step:** Create the backend files listed above in your `pubg-backend` folder!
