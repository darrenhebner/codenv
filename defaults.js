/**
 * Default content for editors and preview
 * This is the single source of truth for default content in the application
 */
export const DEFAULTS = {
  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="/preview/styles.css">
</head>
<body>
  <h1>Welcome to your new project</h1>
  <p>Start editing to see your changes in the preview.</p>
  
  <script src="/preview/script.js" defer></script>
</body>
</html>`,

  css: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  color: #333;
}

h1 {
  margin-bottom: 1rem;
  color: #0066cc;
}`,

  javascript: `// This script runs in the preview
console.log('Script loaded and ready!');

// Add your code here
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
});`,

  // HTML fragment used in the preview fallback page
  previewHTML: `<h1>Welcome to your project</h1>
<p>Start editing in the main window to see your changes here.</p>`
};