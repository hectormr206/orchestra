I need to improve the `ProgressBar.tsx` file to prevent width fluctuations. The key issue is that the percentage text changes width as it goes from "1%" to "100%", causing the entire bar to shift. I'll use `padStart(3, ' ')` to ensure the percentage always takes up 3 characters (e.g., "  1%", " 50%", "100%").

However, I need permission to edit the file. The changes I'll make are:

1. Use `padStart(3, ' ')` on the percentage to fix its width at 3 characters
2. Ensure spacing between label and bar is consistent
3. Keep the total visual width stable regardless of percentage value

Would you like me to proceed with these changes to stabilize the progress bar width?