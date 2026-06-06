---
name: testing-portfolio
description: Test the portfolio site end-to-end. Use when verifying UI changes, refactoring, or content updates to index.html.
---

# Testing the Portfolio Site

## Environment

- **No server needed** — open `file:///path/to/portfolio/index.html` directly in Chrome
- **No credentials needed** — fully static site (EmailJS SDK is loaded but sends are not testable without a real server)
- **No CI configured** — all verification is manual/visual

## How to Test

1. Open `file:///home/ubuntu/repos/portfolio/index.html` in Chrome
2. Maximize the browser window before recording
3. Start a screen recording if testing UI changes

## Key Sections to Verify

### Data-Driven Sections (rendered by JS from arrays)
- **Ticker** (`#tickerTrack`): 6 items duplicated to 12 for seamless CSS loop animation. Verify items: Video Editing, Motion Graphics, Color Grading, Visual Effects, Brand Films, Reels & Shorts.
- **Work Grid** (`#worksGrid`): 4 portfolio items with YouTube thumbnails, titles, tags, years. Click to open lightbox.
- **Testimonials** (`#testiTrack`): 4 cards with initials, names, roles, review text. Slider with prev/next arrows and auto-advance.
- **Services** (`#servicesList`): 4 items numbered 01–04 with names and descriptions.

### Interactive Features
- **Video Lightbox**: Click a work item → overlay opens with YouTube embed. Escape or close button dismisses. Body scroll should lock/unlock via `setBodyScroll()`.
- **Testimonial Slider**: ← / → buttons advance cards. Auto-advance runs on interval. Navigation dots indicate position.
- **Mobile Menu**: At ≤900px width, hamburger icon appears. Opens full-screen overlay with nav links. Close button dismisses.
- **Contact Form**: Empty submit shows "Please fill in all fields." error. Actual email sending requires a live server (EmailJS).
- **Scroll Animations**: `.reveal` elements fade in on scroll via `createScrollObserver()`. Section wipe transitions on scroll.

### CSS Utilities
- **`.corner-bracket`**: Shared base for loader + hero reel corner brackets. Check 4 orange L-shapes at TL/TR/BL/BR positions.
- **`.btn-primary`**: Shared orange button style on hero CTA, "View All" link, and form submit. Hover changes color + translateY.

## Console Verification

Use `browser_console` to programmatically verify DOM state:
```js
// Ticker items
document.querySelectorAll('.ticker-item').length // should be 12

// Work items
document.querySelectorAll('.work-item').length // should be 4

// Testimonials
document.querySelectorAll('.testi-card').length // should be 4

// Services
document.querySelectorAll('.svc-item').length // should be 4

// Shared button class
document.querySelectorAll('.btn-primary').length // should be 3

// Corner brackets
document.querySelectorAll('.corner-bracket.reel-corner').length // should be 4
```

## Known Caveats

- **YouTube embeds fail on `file://`**: The lightbox opens correctly but YouTube iframe shows "Error 153 — Video player configuration error". This is expected when not served over HTTP/HTTPS. The lightbox mechanism itself works fine.
- **Loader auto-dismisses**: The page loader animates away quickly. To inspect loader corner brackets, you may need to reload and screenshot immediately, or check the DOM before the loader's removal timeout fires.
- **No linter/formatter configured**: There are no lint or typecheck commands to run. Verification is purely visual + console error checking.
- **EmailJS form submission**: Cannot be tested locally — requires the page to be served from a real domain for EmailJS to work.

## Devin Secrets Needed

None — this is a fully static site with no authentication or API keys required for testing.
