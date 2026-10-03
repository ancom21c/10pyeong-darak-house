// 사용: node shot.cjs <html> <out-prefix> <script-steps-json>
const { chromium } = require('/home/ancom/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
(async () => {
  const [,, file, out, stepsJson, w, h] = process.argv;
  const steps = JSON.parse(stepsJson || '[]');
  const browser = await chromium.launch({ executablePath: '/home/ancom/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: Number(w || 1440), height: Number(h || 900) } });
  const logs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + file);
  await page.waitForTimeout(2500);
  let i = 0;
  for (const s of steps) {
    if (s.eval) { try { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 2000)); } catch (e) { logs.push('EVALERR: ' + e.message); } }
    if (s.click) await page.click(s.click);
    if (s.mouse) { for (const m of s.mouse) { if (m[0] === 'move') await page.mouse.move(m[1], m[2], { steps: 6 }); if (m[0] === 'down') await page.mouse.down(); if (m[0] === 'up') await page.mouse.up(); } }
    if (s.key) await page.keyboard.press(s.key);
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.shot) { await page.screenshot({ path: `${out}-${s.shot}.png` }); i++; }
  }
  console.log(logs.slice(0, 30).join('\n') || 'no errors');
  await browser.close();
})();
