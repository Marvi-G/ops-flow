// Must be imported before the Express app: ES modules evaluate imports in order,
// and the app reads these variables as soon as it loads.
// The function runtime isn't guaranteed to set NODE_ENV, and production needs
// Secure cookies and no pretty-printed logging.
process.env.NODE_ENV ??= 'production';
// Tells src/index.ts not to call app.listen(); Netlify invokes the app per request.
process.env.NETLIFY ??= 'true';
