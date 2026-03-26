# Stonesaga Foraging App - Plan & Architecture

## Purpose
A lightweight single-page web app to manage Stonesaga Foraging deck draws.

The app models this tabletop flow:
1. Choose a terrain deck.
2. Draw 2 cards.
3. Pick 1 to play.
4. Shuffle the other back into the deck.
5. Repeat until the player stops (or deck is exhausted).

## Scope
- Frontend only (static HTML/CSS/JS)
- No backend, no login, no server state
- Browser persistence via localStorage
- Designed to run directly from file or static hosting (including GitHub Pages)

## Project Structure
- `index.html`: Screen markup (Start, Foraging, Settings)
- `style.css`: UI styling, responsive behavior, terrain themes
- `app.js`: State, deck generation, draw logic, rendering, event handlers
- `ARCHITECTURE.md`: This design/implementation reference

## Domain Rules Implemented

### Terrain Decks
- Forest base: FF01-FF12
- Prairie base: FP01-FP12
- Glade base: not available unless Nature of the Beast is enabled

### Expansion Effects
- Meals & Myths: currently no Foraging card changes
- Nature of the Beast:
  - Adds FF15 to Forest
  - Adds FP15 to Prairie
  - Enables Glade terrain deck FT01-FT12

### Session Model
A session uses one terrain deck at a time (not combined terrains).

### Draw Resolution
- If deck has 2+ cards:
  - Draw 2
  - Player selects 1 to play
  - Non-selected card is shuffled back into deck
- If deck has 1 card:
  - Draw the single card
  - Player can play it or stop
- If deck reaches 0 after resolution:
  - Session ends

## Application Architecture

### 1) State Layer
Single in-memory `state` object with two main branches:
- `settings`
- `session`

State shape:

```json
{
  "settings": {
    "expansions": {
      "mealsAndMyths": false,
      "natureOfTheBeast": false
    }
  },
  "session": {
    "terrain": "forest|prairie|glade|null",
    "deck": [],
    "played": [],
    "currentDraw": null,
    "active": false
  }
}
```

### 2) Persistence Layer
- localStorage key: `stonesaga-foraging`
- Save-after-mutation strategy (state is written after important user/game actions)
- Load on app startup to restore:
  - expansion settings
  - active session data (if present)

### 3) Domain/Logic Layer
Key logic responsibilities:
- Build deck codes from terrain + expansion toggles
- Shuffle full deck (Fisher-Yates)
- Reinsert discarded card at random position (shuffle-back behavior)
- Draw management:
  - draw two
  - draw one when exhausted
- Select card resolution:
  - add chosen to played log
  - return non-selected card (if pair draw)
  - transition to next step or end session

### 4) UI/Render Layer
Screen-based UI (SPA style) using show/hide sections:
- Start screen
- Foraging screen
- Settings screen

Render duties include:
- Terrain selection state
- Resume-banner visibility when an active session exists
- Draw zone states:
  - choose from drawn cards
  - draw-next prompt
  - session complete summary
- Played card list
- Deck count and terrain label

### 5) Event Layer
DOM events wire user intent to logic:
- Select terrain
- Begin session
- Resume/discard active session
- Draw cards
- Select card to play
- Stop session
- Toggle expansion settings
- Return from Settings

## Screen Behavior

### Start Screen
- Terrain chooser buttons
- Begin Foraging button (enabled once terrain selected)
- Settings navigation
- Resume banner if active session exists

Special case:
- Glade option is disabled unless Nature of the Beast is enabled

### Foraging Screen
- Current terrain indicator and cards remaining
- Draw zone with card controls
- Played cards log
- Stop Foraging action
- Session complete summary when ended

### Settings Screen
- Meals & Myths toggle (no current effect on foraging deck composition)
- Nature of the Beast toggle (affects deck rules + Glade availability)

## Theming & Visual System
- CSS custom properties control color tokens
- Terrain-specific body classes:
  - `terrain-forest`
  - `terrain-prairie`
  - `terrain-glade`
- Theme controls accent color and related UI surfaces

## Hosting Notes
This project is static and can be hosted directly from a GitHub repository via GitHub Pages.

Notes:
- No backend deployment required
- localStorage persistence is per browser/device/origin
- User session data is not shared between users

## Known Constraints / Future Extensions
- No multiplayer/shared state
- No card artwork pipeline yet (placeholder area is in card UI)
- Meals & Myths toggle reserved for potential future foraging effects

Suggested future enhancements:
1. Add optional card images keyed by code (FF01, FP09, etc.)
2. Add deck/session export-import JSON for cross-device continuity
3. Add optional draw history with timestamps
4. Add optional game presets (Base only, NatB enabled)

## Quick Hand-off Summary
If continuing development on another account/machine:
1. Open `index.html` directly in a browser for local use.
2. Or publish the `Foraging` folder via GitHub Pages for hosted access.
3. Core logic lives in `app.js`; UI structure in `index.html`; visual/theme system in `style.css`.
