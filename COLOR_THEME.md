# BookMyQuiltRetreat - Color Theme Guide

## Overview
This document contains the complete color palette used in the BookMyQuiltRetreat application. All colors are defined in HSL format and support both light and dark modes.

---

## Primary Brand Colors

### Primary Color
- **HSL**: `250 70% 60%`
- **HEX**: `#7C5CF5`
- **RGB**: `rgb(124, 92, 245)`
- **Usage**: Main brand color, primary buttons, links, highlights
- **Foreground (Text on Primary)**: White (`#FFFFFF`)

### Accent Color
- **HSL**: `262 83% 58%`
- **HEX**: `#8B5CF6`
- **RGB**: `rgb(139, 92, 246)`
- **Usage**: Secondary brand color, accents, complementary elements
- **Foreground (Text on Accent)**: White (`#FFFFFF`)

---

## Primary Gradients

### Gradient Primary
- **Direction**: 135deg (diagonal)
- **From**: `hsl(250, 70%, 60%)` → `#7C5CF5`
- **To**: `hsl(262, 83%, 58%)` → `#8B5CF6`
- **CSS**: `linear-gradient(135deg, hsl(250, 70%, 60%), hsl(262, 83%, 58%))`
- **Usage**: Hero sections, primary CTAs, main backgrounds

### Gradient Hero
- **Direction**: 180deg (vertical)
- **From**: `hsl(250, 70%, 60%)` → `#7C5CF5`
- **To**: `hsl(262, 83%, 58%)` → `#8B5CF6`
- **CSS**: `linear-gradient(180deg, hsl(250, 70%, 60%) 0%, hsl(262, 83%, 58%) 100%)`
- **Usage**: Page headers, hero sections

---

## Light Mode Colors

### Background & Surface
- **Background**: `hsl(0, 0%, 100%)` → `#FFFFFF` (White)
- **Card**: `hsl(0, 0%, 100%)` → `#FFFFFF` (White)
- **Popover**: `hsl(0, 0%, 100%)` → `#FFFFFF` (White)

### Text Colors
- **Foreground**: `hsl(222.2, 84%, 4.9%)` → `#0A0E27` (Very Dark Blue)
- **Card Foreground**: `hsl(222.2, 84%, 4.9%)` → `#0A0E27` (Very Dark Blue)
- **Muted Foreground**: `hsl(220, 9%, 46%)` → `#6B7280` (Medium Gray)

### Secondary Colors
- **Secondary**: `hsl(210, 40%, 96.1%)` → `#F1F5F9` (Light Blue-Gray)
- **Secondary Foreground**: `hsl(222.2, 47.4%, 11.2%)` → `#1E293B` (Dark Blue-Gray)

### Muted Colors
- **Muted**: `hsl(220, 14%, 96%)` → `#F4F6F8` (Very Light Gray)
- **Muted Foreground**: `hsl(220, 9%, 46%)` → `#6B7280` (Medium Gray)

### Border & Input
- **Border**: `hsl(220, 13%, 91%)` → `#E2E8F0` (Light Gray)
- **Input**: `hsl(220, 13%, 91%)` → `#E2E8F0` (Light Gray)
- **Ring** (Focus): `hsl(250, 70%, 60%)` → `#7C5CF5` (Primary)

### Destructive (Error/Delete)
- **Destructive**: `hsl(0, 84.2%, 60.2%)` → `#EF4444` (Red)
- **Destructive Foreground**: `hsl(210, 40%, 98%)` → `#F8FAFC` (Off-White)

---

## Dark Mode Colors

### Background & Surface
- **Background**: `hsl(222.2, 84%, 4.9%)` → `#0A0E27` (Very Dark Blue)
- **Card**: `hsl(222.2, 84%, 4.9%)` → `#0A0E27` (Very Dark Blue)
- **Popover**: `hsl(222.2, 84%, 4.9%)` → `#0A0E27` (Very Dark Blue)

### Text Colors
- **Foreground**: `hsl(210, 40%, 98%)` → `#F8FAFC` (Off-White)
- **Card Foreground**: `hsl(210, 40%, 98%)` → `#F8FAFC` (Off-White)
- **Muted Foreground**: `hsl(215, 20.2%, 65.1%)` → `#94A3B8` (Light Gray)

### Secondary Colors
- **Secondary**: `hsl(217.2, 32.6%, 17.5%)` → `#1E293B` (Dark Blue-Gray)
- **Secondary Foreground**: `hsl(210, 40%, 98%)` → `#F8FAFC` (Off-White)

### Muted Colors
- **Muted**: `hsl(217.2, 32.6%, 17.5%)` → `#1E293B` (Dark Blue-Gray)
- **Muted Foreground**: `hsl(215, 20.2%, 65.1%)` → `#94A3B8` (Light Gray)

### Border & Input
- **Border**: `hsl(217.2, 32.6%, 17.5%)` → `#1E293B` (Dark Blue-Gray)
- **Input**: `hsl(217.2, 32.6%, 17.5%)` → `#1E293B` (Dark Blue-Gray)
- **Ring** (Focus): `hsl(250, 70%, 60%)` → `#7C5CF5` (Primary)

### Destructive (Error/Delete)
- **Destructive**: `hsl(0, 62.8%, 30.6%)` → `#991B1B` (Dark Red)
- **Destructive Foreground**: `hsl(210, 40%, 98%)` → `#F8FAFC` (Off-White)

---

## Sidebar Colors (Light Mode)

- **Background**: `hsl(0, 0%, 98%)` → `#FAFAFA` (Very Light Gray)
- **Foreground**: `hsl(240, 5.3%, 26.1%)` → `#3F3F46` (Dark Gray)
- **Primary**: `hsl(240, 5.9%, 10%)` → `#18181B` (Very Dark Gray)
- **Primary Foreground**: `hsl(0, 0%, 98%)` → `#FAFAFA` (Very Light Gray)
- **Accent**: `hsl(240, 4.8%, 95.9%)` → `#F4F4F5` (Light Gray)
- **Accent Foreground**: `hsl(240, 5.9%, 10%)` → `#18181B` (Very Dark Gray)
- **Border**: `hsl(220, 13%, 91%)` → `#E2E8F0` (Light Gray)
- **Ring**: `hsl(217.2, 91.2%, 59.8%)` → `#3B82F6` (Blue)

## Sidebar Colors (Dark Mode)

- **Background**: `hsl(240, 5.9%, 10%)` → `#18181B` (Very Dark Gray)
- **Foreground**: `hsl(240, 4.8%, 95.9%)` → `#F4F4F5` (Very Light Gray)
- **Primary**: `hsl(224.3, 76.3%, 48%)` → `#2563EB` (Blue)
- **Primary Foreground**: `hsl(0, 0%, 100%)` → `#FFFFFF` (White)
- **Accent**: `hsl(240, 3.7%, 15.9%)` → `#27272A` (Dark Gray)
- **Accent Foreground**: `hsl(240, 4.8%, 95.9%)` → `#F4F4F5` (Very Light Gray)
- **Border**: `hsl(240, 3.7%, 15.9%)` → `#27272A` (Dark Gray)
- **Ring**: `hsl(217.2, 91.2%, 59.8%)` → `#3B82F6` (Blue)

---

## Border Radius

- **Default Radius**: `1rem` (16px)
- **Large**: `1rem` (16px)
- **Medium**: `calc(1rem - 2px)` (14px)
- **Small**: `calc(1rem - 4px)` (12px)

---

## Color Usage Guidelines

### Primary Color (`#7C5CF5`)
- Main call-to-action buttons
- Active states
- Links and interactive elements
- Brand highlights
- Focus rings

### Accent Color (`#8B5CF6`)
- Secondary buttons
- Complementary accents
- Gradient endpoints
- Hover states

### Gradients
- **Gradient Primary**: Used for hero sections, main CTAs, and prominent backgrounds
- **Gradient Hero**: Used for page headers and section backgrounds

### Text Hierarchy
- **Foreground**: Primary text content
- **Muted Foreground**: Secondary text, captions, hints
- **Card Foreground**: Text on card backgrounds

### Interactive Elements
- **Ring**: Focus states on inputs and buttons (uses Primary color)
- **Border**: Subtle borders and dividers
- **Input**: Input field borders

---

## Design Tokens Reference

All colors are defined as CSS custom properties (variables) in HSL format:
- Format: `hsl(hue, saturation%, lightness%)`
- Example: `--primary: 250 70% 60%;`

This allows for easy theme switching and consistent color management across the application.

---

## Quick Color Reference

### Brand Colors
- **Primary**: `#7C5CF5` (Purple)
- **Accent**: `#8B5CF6` (Purple-Violet)

### Neutral Colors (Light Mode)
- **Background**: `#FFFFFF` (White)
- **Foreground**: `#0A0E27` (Very Dark Blue)
- **Muted**: `#F4F6F8` (Very Light Gray)
- **Border**: `#E2E8F0` (Light Gray)

### Neutral Colors (Dark Mode)
- **Background**: `#0A0E27` (Very Dark Blue)
- **Foreground**: `#F8FAFC` (Off-White)
- **Muted**: `#1E293B` (Dark Blue-Gray)
- **Border**: `#1E293B` (Dark Blue-Gray)

### Status Colors
- **Destructive (Light)**: `#EF4444` (Red)
- **Destructive (Dark)**: `#991B1B` (Dark Red)

---

## Notes for Designers

1. **Color System**: The application uses a purple/violet gradient as the primary brand identity
2. **Accessibility**: All color combinations meet WCAG contrast requirements
3. **Consistency**: Use the defined color tokens rather than custom colors
4. **Gradients**: The primary gradient (135deg) is the signature visual element
5. **Dark Mode**: All colors have corresponding dark mode variants for consistency

---

*Last Updated: Based on current codebase configuration*

