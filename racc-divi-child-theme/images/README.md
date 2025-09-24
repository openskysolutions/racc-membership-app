# Add RACC Logo Images

Place your RACC logo files here:

## Required Files
- `racc-logo.png` - Light theme logo (for light backgrounds)
- `racc-logo-dark.png` - Dark theme logo (for dark backgrounds)

## Recommended Specifications
- **Format**: PNG with transparent background
- **Size**: 200-300px wide, maintain aspect ratio
- **Resolution**: 72-150 DPI for web
- **File size**: Keep under 100KB for optimal loading

## Usage
These logos will be automatically used by the theme:
- Upload through **WordPress Customizer → Site Identity**
- Theme will automatically switch between light/dark variants
- Logos appear in header and footer sections

## File Naming
The theme looks for these specific filenames:
```
images/
├── racc-logo.png      (light version)
└── racc-logo-dark.png (dark version)
```

If you have different filenames, update the references in `functions.php`.