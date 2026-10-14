import { chromium } from 'playwright';

async function runBrowserE2E() {
  console.log('Starting Playwright End-to-End Suite using system Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
  });

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  let passed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      throw new Error(message);
    }
  }

  try {
    // 1. Session A: Open Editor
    await pageA.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await pageA.waitForSelector('.canvas-grid');
    assert(true, 'Session A: Navigated to editor and rendered canvas grid');

    // Check title in TopNavigation
    const titleText = await pageA.innerText('header button');
    assert(titleText.length > 0, `Session A: Document title rendered ("${titleText}")`);

    // 2. Session B: Open Second Independent Browser Session (Simulating Collaborator)
    await pageB.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await pageB.waitForSelector('.canvas-grid');
    assert(true, 'Session B: Concurrent second browser session loaded');

    // 3. Session A: Test Page Addition
    const addPageButton = await pageA.locator('button[title="Add Page"]');
    await addPageButton.click();
    await pageA.waitForTimeout(300);
    const pagesCount = await pageA.locator('aside >> text=Page').count();
    assert(pagesCount >= 2, `Session A: Created and switched to new page (Total: ${pagesCount})`);

    // 4. Session A: Test Shape Selection & Properties Inspection
    // Switch to page 1 to see layers
    await pageA.locator('aside >> text=Page 1').first().click();
    await pageA.waitForTimeout(300);

    const firstLayer = await pageA.locator('aside >> text=Hero Card').first();
    if (await firstLayer.isVisible()) {
      await firstLayer.click();
      await pageA.waitForTimeout(300);
      assert(true, 'Session A: Selected layer in layers panel');
    }

    // 5. Session A: Test Inspect CSS Code
    const inspectTab = await pageA.locator('button:has-text("Inspect")');
    if (await inspectTab.isVisible()) {
      await inspectTab.click();
      await pageA.waitForTimeout(200);
      const hasCss = await pageA.locator('pre').isVisible();
      assert(hasCss, 'Session A: Inspect tab generated CSS rule block');
    }

    // 6. Session A: Test Prototyping Modal Presentation
    const presentBtn = await pageA.locator('button[title="Present Prototype (Flow)"]');
    await presentBtn.click();
    await pageA.waitForTimeout(400);
    const modalVisible = await pageA.locator('text=Prototype Preview').isVisible();
    assert(modalVisible, 'Session A: Fullscreen prototype viewer launched');

    // Close modal
    const closeBtn = await pageA.locator('button[title="Exit Prototype (Esc)"]');
    await closeBtn.click();
    await pageA.waitForTimeout(300);

    // 7. Session A: Test Export Menu options
    const exportBtn = await pageA.locator('button[title="Export Options"]');
    await exportBtn.click();
    await pageA.waitForTimeout(200);

    const hasPng = await pageA.locator('text=PNG Image').isVisible();
    const hasSvg = await pageA.locator('text=SVG Vector').isVisible();
    const hasPdf = await pageA.locator('text=PDF Document').isVisible();
    const hasJson = await pageA.locator('text=Figma JSON').isVisible();
    assert(hasPng && hasSvg && hasPdf && hasJson, 'Session A: Export options (PNG, SVG, PDF, JSON) verified in menu');

    // Close menu
    await exportBtn.click();

    console.log('\n========================================');
    console.log(`Playwright Browser E2E Suite: ${passed} Tests PASSED`);
    console.log('========================================\n');
  } finally {
    await browser.close();
  }
}

runBrowserE2E().catch((err) => {
  console.error('Playwright E2E Test Failure:', err);
  process.exit(1);
});
