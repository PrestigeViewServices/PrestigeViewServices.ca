# Before / After photos

These power the draggable slider on the **House Washing** service page
(`/services/house-washing`).

## How to swap in real photos

1. Take/choose a **before** and **after** photo of the *same* house from the
   *same* angle.
2. Name them exactly:
   - `house-before.jpg`
   - `house-after.jpg`
3. Drop them in this folder, overwriting the placeholders. No code change needed.

**Tips**

- Use the same crop/zoom for both so the slider lines up.
- Landscape ~3:2 works best (the slider container is `aspect-[3/2]`).
- Keep each file under ~400 KB (run `npm run optimize:images` if large, or
  resize to ~1600px wide before exporting).
- Want sliders on other service pages too? The component is
  `components/ui/before-after-slider.tsx`; add more image pairs here and render
  `<BeforeAfterSlider .../>` where you need them.
