# Canvas Tape Customizer Implementation

## Overview
This document explains the custom tape preview feature that allows customers to upload, customize, and preview their designs on athletic tape.

## Feature Summary
- ✅ **Image Upload**: Users can upload images (PNG, JPG, etc.)
- ✅ **Canvas-Based Editor**: HTML5 Canvas for real-time rendering
- ✅ **Drag to Move**: Click/touch and drag the design to reposition
- ✅ **Zoom/Scale**: Increase or decrease design size
- ✅ **Rotate**: Rotate design in 15° increments
- ✅ **Mask Clipping**: Design automatically clips to printable tape area
- ✅ **PNG Export**: Download final composed design as PNG
- ✅ **Mobile Support**: Works on desktop (mouse) and mobile (touch)
- ✅ **TypeScript**: Fully typed with proper interfaces

## Files Added/Modified

### New Components
- **`src/components/TapeCustomizer.tsx`** - Main canvas-based customizer component
  - Canvas rendering with transform (translate, scale, rotate)
  - Image upload handling
  - Drag interaction (mouse + touch)
  - Zoom/rotation controls
  - PNG export functionality

### Modified Components
- **`src/components/Configurator.tsx`** - Integrated TapeCustomizer
- **`src/App.tsx`** - Updated pricing to CZK
- **`src/components/Cart.tsx`** - Updated to display CZK
- **`src/components/Checkout.tsx`** - Updated to display CZK

### Assets
- **`src/assets/tape/tape-base.png`** - Tape mockup overlay
- **`src/assets/tape/tape-mask.png`** - Black/white mask (white = printable area)

## How It Works

### 1. Canvas Rendering
The component uses HTML5 Canvas with a fixed internal resolution (1200x600px) that scales responsively:

```typescript
// Render order:
1. Clear canvas
2. Draw user image with transform (translate, scale, rotate)
3. Apply mask using globalCompositeOperation = 'destination-in'
4. Draw tape-base overlay on top
```

### 2. Image Upload
When user uploads an image:
- File is read as data URL
- Image is auto-fitted to canvas (scaled to 60% of canvas size)
- Centered on canvas
- User can then drag, zoom, rotate

### 3. Drag Interaction
- Supports both mouse (desktop) and touch (mobile) events
- Calculates pointer position relative to canvas
- Updates transform.x and transform.y as user drags
- Canvas rerenders automatically when transform changes

### 4. Export
- `canvas.toDataURL('image/png')` generates final PNG
- Data URL is passed to parent component via `onDesign Change` callback
- Used for cart thumbnail and final order submission
- Can also be downloaded directly by user

## Replacing Placeholder Assets

The current tape assets are AI-generated placeholders. To use your real assets:

1. **Tape Base (`tape-base.png`)**:
   - Should be a tape mockup with semi-transparency
   - Shows tape edge/borders
   - This is drawn ON TOP of the user's design
   - Recommended size: 1200x600px or similar aspect ratio

2. **Tape Mask (`tape-mask.png`)**:
   - Black and white image
   - **White areas** = where user's design will show (printable area)
   - **Black areas** = non-printable (masked out)
   - Must match dimensions of tape-base
   - Example: Rectangle with white center, black borders

Replace files at:
```
src/assets/tape/tape-base.png
src/assets/tape/tape-mask.png
```

## Testing Locally

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to configurator**:
   - Go to http://localhost:5173
   - Scroll to "Design Your Tape" section

3. **Test features**:
   - Upload an image
   - Drag to move it around
   - Click zoom in/out buttons
   - Click rotate button
   - Export PNG to download

4. **Test mobile**:
   - Use browser dev tools to emulate mobile
   - Touch drag should work
   - Controls should be accessible

## Integration with Order System

The customizer exports the final design in two ways:

1. **Data URL** (via `onDesignChange` callback):
   ```typescript
   <TapeCustomizer onDesignChange={(dataUrl) => {
     // dataUrl is the final PNG as base64
     // Can be stored in state, sent to backend, etc.
   }} />
   ```

2. **File object** (via `onImageFile` callback):
   ```typescript
   <TapeCustomizer onImageFile={(file) => {
     // Original uploaded file
     // Used for ImgBB upload on checkout
   }} />
   ```

Currently, the imageFile is uploaded to ImgBB when the order is placed (in Checkout component).

## Pricing Update

Changed from USD to CZK:
- **Price per roll**: 250 Kč
- Updated in: App.tsx, Configurator.tsx, Cart.tsx, Checkout.tsx
- All prices now display as "Kč" instead of "$"

## TypeScript Types

The component uses proper TypeScript types:

```typescript
interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TapeCustomizerProps {
  onDesignChange?: (dataUrl: string | null) => void;
  onImageFile?: (file: File | null) => void;
}
```

Canvas types are properly typed:
- `CanvasRenderingContext2D`
- `HTMLCanvasElement`
- `HTMLImageElement`
- `React.MouseEvent<HTMLCanvasElement>`
- `React.TouchEvent<HTMLCanvasElement>`

## Future Enhancements

Possible improvements:
1. **Fine rotation**: Add slider for precise degree control
2. **Multiple designs**: Allow 2+ images on one tape
3. **Templates**: Pre-made layout templates
4. **Text tool**: Add text directly on canvas
5. **Filters**: Apply filters to uploaded images
6. **Undo/Redo**: Canvas state history

## Build & Deploy

No special build steps required:
```bash
npm run build
```

The canvas component works in all modern browsers.

## Support

For issues:
1. Check browser console for errors
2. Verify tape assets are loaded (Network tab)
3. Test with different image types/sizes
4. Ensure canvas is visible (check CSS)
