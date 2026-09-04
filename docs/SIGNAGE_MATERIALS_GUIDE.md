# Signage Materials & Multi-Material Pricing Guide

## Overview

The "Signage Materials" system is a **flexible multi-material pricing engine** that works for ANY product requiring multiple materials or components. Despite the name, it is not limited to signage products.

## What It Does

This system allows admins to:
1. Define material categories (e.g., Base Materials, Illumination, Fabrication)
2. Add materials with pricing per unit (per m², per meter, per piece, etc.)
3. Link any product to its required materials via "Signage Configs"
4. Use the calculator to get instant multi-material pricing for clients

## Supported Product Types

The system works for any product that requires multiple materials:

| Product Type | Example Materials |
|--------------|-------------------|
| **2D Signs (Mabango ya 2D)** | Acrylic sheet, vinyl print, mounting hardware, standoffs |
| **3D Signs (Mabango ya 3D)** | Acrylic letters, LED strips, power supply, wiring, transformers |
| **Banners & Vinyl** | Vinyl material, grommets, poles, carrying case |
| **Roll-up Banners** | Banner fabric, retractable stand, base, zippered case |
| **Business Cards** | Paper stock (80-350 gsm), coating, lamination, packaging |
| **Acrylic Signs** | Acrylic sheet (3mm/6mm), laser cutting, standoffs, wall mounts |
| **Brochures & Flyers** | Paper stock, folding, saddle stitching |
| **Posters** | Paper/canvas, mounting, framing |
| **Stickers & Labels** | Vinyl/adhesive material, die cutting, backing paper |
| **Any custom product** | Define your own materials and quantities |

## How to Use

### Step 1: Create Material Categories

Go to **Signage Materials** > Click "Add Category"

Examples:
- **Base Materials** - The main material for the product
- **Illumination** - LED strips, neon, backlit components
- **Fabrication** - CNC cutting, assembly, finishing
- **Installation** - Wall mounting, electrical wiring, brackets
- **Packaging** - Boxes, protective wrapping, labels

### Step 2: Add Materials

Go to **Signage Materials** > Click "Add Material"

For each material, specify:
- **Category** - Which category it belongs to
- **Name** - e.g., "Acrylic 6mm", "LED Strip White", "Wall Mount Bracket"
- **Unit** - m², meter, piece, kg, roll, etc.
- **Price per Unit** - Cost to charge the client (e.g., TZS 45,000/m²)
- **Cost per Unit** - Internal cost (for your tracking)

### Step 3: Create a Product Config

Go to **Signage Configs** > Click "New Config"

1. Select the product (e.g., "3D LED Sign", "Banner", "Business Cards")
2. Give it a name (e.g., "3D LED Sign Config")
3. Add materials from the catalog
4. Set default quantities for each material

### Step 4: Use the Calculator

When a client selects a product with a materials config:
1. The calculator shows "Materials & Quantities" section
2. Adjust quantities for each material
3. See real-time pricing breakdown
4. Get total = Base Price + Materials Total

## Example: 3D LED Sign

**Materials:**
- Acrylic 6mm: 2 pieces x TZS 45,000 = TZS 90,000
- LED Strip White: 5 meters x TZS 15,000 = TZS 75,000
- Power Supply 12V: 1 piece x TZS 8,000 = TZS 8,000
- Wall Mount Bracket: 2 pieces x TZS 5,000 = TZS 10,000
- Assembly Labor: 1 piece x TZS 20,000 = TZS 20,000

**Materials Total:** TZS 203,000

**Base Price (from price rules):** TZS 150,000

**Client Total:** TZS 353,000

## Example: Business Cards

**Materials:**
- Paper 300gsm: 10 sheets x TZS 500 = TZS 5,000
- Coating: 10 sheets x TZS 200 = TZS 2,000
- Packaging Box: 1 box x TZS 1,000 = TZS 1,000

**Materials Total:** TZS 8,000

**Base Price (from price rules):** TZS 25,000 (100 cards)

**Client Total:** TZS 33,000

## Key Features

1. **Flexible** - Works for any product, not just signage
2. **Dynamic** - Admins can add/change materials without code changes
3. **Real-time** - Calculator shows instant pricing as quantities change
4. **Scalable** - Add unlimited materials and products
5. **Trackable** - Cost per unit for internal profitability tracking

## API Endpoints

- `GET /api/signage-material-categories` - List categories
- `GET /api/signage-materials` - List all materials
- `GET /api/signage-configs` - List all product configs
- `GET /api/signage-configs/:id` - Get config with materials
- `GET /api/signage-configs/by-product/:productId` - Get config for calculator

## Notes

- The "Signage" prefix is historical -- the system is a general-purpose multi-material engine
- Materials can be reused across multiple products
- Default quantities in configs speed up the calculator workflow
- The system integrates seamlessly with the existing price rules for base pricing
