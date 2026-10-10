# CulinaryScale Pro - Enterprise Recipe Scaling & Formulation Engine

A modern, high-performance, accessible enterprise culinary scaling application engineered entirely with native **HTML5**, **CSS3 (3D depth & perspective)**, and **Vanilla JavaScript (ES6+)**.

## Features & Capabilities

- **Light & Dark Mode**:
  - Seamless theme toggle in the top bar with Sun and Moon iconography.
  - Full variable theming across all 3D cards, input fields, tables, and metric pills.
  - Automatically respects system preferences and persists the user's choice to browser `localStorage`.
- **ChefBot AI Culinary Chatbot**:
  - Floating culinary assistant integrated into the bottom-right corner.
  - Powered by Google Gemini (`gemini-3.8-flash`) via secure backend proxy route (`POST /api/chat`).
  - Answers recipe scaling math, non-linear leavening adjustments (baking powder/soda/yeast), ingredient substitutions, cooking times, and pan size adaptations.
  - "Analyze Current Recipe" feature passes active form data for real-time culinary context analysis.
  - Automatic fallback to domain culinary expertise during transient network conditions.
- **Enterprise-Grade Validation**:
  - Comprehensive input integrity checks for dish name, servings, and three core ingredients.
  - Strict validation on servings: flags empty, zero, negative, or non-numeric values with accessible inline hints and an overarching `<div role="alert">` notification banner.
  - As required, invalid or non-positive servings prevent calculated results from being displayed.
- **Exact Formulation Scaling Engine**:
  - Precision formula implementation:
    $$\text{New Quantity} = \text{Original Quantity} \times \left(\frac{\text{Wanted Servings}}{\text{Original Servings}}\right)$$
  - Advanced decimal precision handling: prevents floating-point rounding errors (e.g. `2.3333333333333335` is rounded and formatted cleanly to decimal places).
- **3D Spatial Card Styling**:
  - Real 3D CSS perspective (`perspective: 1200px`, `transform-style: preserve-3d`).
  - Interactive mouse tilt physics tracking cursor coordinates on desktop.
  - Tactile 3D button depression effects on click with realistic depth shadows.
  - Graceful fallback for users with `prefers-reduced-motion`.
- **Persistent LocalStorage State**:
  - Automatically saves all input fields as you type.
  - Saves verified calculated results.
  - Completely restores inputs and the calculated output when the page reloads or refreshes.
  - One-click Reset / Clear option to purge saved state.
- **Enterprise Workflow Tools**:
  - Quick test presets: *Tuscan Herb Pasta Primavera*, *Country Sourdough Boule*, and *Vanilla Crème Brûlée*.
  - Quick servings multipliers: `-1`, `+1`, `0.5x`, `2x`, and `3x` for fast culinary ratio exploration.
  - One-click "Copy Scaled Recipe" to clipboard with toast notification.
  - Print optimization (`@media print`) for commercial kitchen prep stations.

## Project Structure

```
├── index.html          # Semantic HTML5 layout and 3D card structure
├── css/
│   └── style.css       # Native CSS3 styles, 3D perspective, variables & responsiveness
├── js/
│   └── script.js       # Native ES6+ validation, calculation, and LocalStorage logic
└── README.md           # Documentation and run instructions
```

## How to Run the Application

Because this application uses native HTML5, CSS3, and JavaScript:

1. **Direct Browser**: Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
2. **Local Dev Server**: Run `npm run dev` in the terminal to launch the Vite local server on `http://localhost:3000`.
3. **Build Check**: Run `npm run build` or `npm run preview`.
