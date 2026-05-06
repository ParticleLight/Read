const { app, BrowserWindow } = require('electron');
console.log('app type:', typeof app);
console.log('app.whenReady:', typeof app.whenReady);
app.whenReady().then(() => {
  console.log('Ready!');
  app.quit();
});
