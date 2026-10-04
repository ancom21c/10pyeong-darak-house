const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const origin = process.env.BASE_URL || "http://localhost:8765/codex-work/";
const sources = Object.fromEntries(
  ["house-plan.html", "site-sim.html"].map((name) => [
    name,
    fs.readFileSync(path.join(root, name), "utf8"),
  ]),
);
const checks = [],
  errors = [];
function check(name, value) {
  assert(value, name);
  checks.push(name);
  console.log("PASS " + name);
}
function common(source, end) {
  return source
    .slice(source.indexOf("const DEFAULT"), source.indexOf(end))
    .trim();
}
check(
  "두 단일 HTML의 설계 모델·3D 생성·충돌 코드 일치",
  common(sources["house-plan.html"], "let selected = null") ===
    common(sources["site-sim.html"], "const stages ="),
);
for (const [name, source] of Object.entries(sources)) {
  const code = source.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  new vm.Script(code, { filename: name });
}
check("두 페이지 JavaScript 구문 검증", true);
(async () => {
  const browser = await chromium.launch({
    ...(process.env.BROWSER_PATH
      ? { executablePath: process.env.BROWSER_PATH }
      : {}),
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    const captureErrors = (p) => {
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
    };
    captureErrors(page);
    await page.goto(origin + "house-plan.html");
    await page.waitForFunction(() => window.houseApp);
    const xy = (x, z) =>
      page.evaluate(
        ({ x, z }) => {
          const svg = document.querySelector("#plan"),
            p = svg.createSVGPoint();
          p.x = x;
          p.y = z;
          const q = p.matrixTransform(svg.getScreenCTM());
          return { x: q.x, y: q.y };
        },
        { x, z },
      );

    // Rejected placement and a selection must preserve the user's redo stack.
    let a = await xy(1500, 3200),
      b = await xy(1140, 3200);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
    await page.locator("#undo").click();
    a = await xy(1500, 3200);
    await page.mouse.click(a.x, a.y);
    check(
      "가구 선택만 하면 다시 실행 이력을 유지",
      await page.locator("#redo").isEnabled(),
    );
    await page.locator("#fw").fill("4000");
    await page.locator("#fw").dispatchEvent("change");
    check(
      "벽 밖으로 나가는 크기 변경 거부·다시 실행 이력 유지",
      (await page.evaluate(
        () => houseApp.state.furniture.find((f) => f.id === "sofa").w === 2100,
      )) && (await page.locator("#redo").isEnabled()),
    );
    await page.locator("#redo").click();
    check(
      "거부된 편집 이후 다시 실행",
      await page.evaluate(
        () => houseApp.state.furniture.find((f) => f.id === "sofa").x === 1150,
      ),
    );
    await page.locator("#undo").click();

    // Dragging through the bedroom wall cannot leave furniture inside it.
    a = await xy(1800, 2200);
    b = await xy(4900, 2200);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 12 });
    await page.mouse.up();
    check(
      "가구 드래그가 일반 벽을 관통하지 않음",
      await page.evaluate(() => {
        const f = houseApp.state.furniture.find((f) => f.id === "table");
        return f.x + f.w / 2 <= 4850;
      }),
    );
    await page.locator("#undo").click();

    await page.locator("#floor").selectOption("attic");
    check(
      "다락 연결문 표시·현재 층 바닥재 목록",
      (await page.locator("#plan").textContent()).includes("연결") &&
        (await page.locator("#room option").count()) === 2,
    );
    await page.getByRole("button", { name: "3D 공간", exact: true }).click();
    await page.waitForFunction(() => houseApp.threeReady);
    await page.locator("#cut").click();
    // Orbit camera setup only; selection and movement still use real pointer events.
    await page.evaluate(() => {
      houseApp.camera.position.set(8, 18, 9);
      houseApp.camera.lookAt(5.2, 2, 0.7);
      houseApp.camera.updateMatrixWorld(true);
    });
    await page.waitForTimeout(300);
    const projection = await page.evaluate(async () => {
      const T = await import("three"),
        c = houseApp.camera,
        rect = document.querySelector("#three canvas").getBoundingClientRect();
      const f = houseApp.state.furniture.find((f) => f.id === "desk");
      const screen = (v) => {
        v.project(c);
        return {
          x: rect.left + ((v.x + 1) * rect.width) / 2,
          y: rect.top + ((1 - v.y) * rect.height) / 2,
        };
      };
      const start = screen(
        new T.Vector3(f.x / 1000, 2.57 + f.h / 1000, f.z / 1000),
      );
      const ray = new T.Raycaster();
      ray.setFromCamera(
        new T.Vector2(
          ((start.x - rect.left) / rect.width) * 2 - 1,
          (-(start.y - rect.top) / rect.height) * 2 + 1,
        ),
        c,
      );
      const hit = ray.ray.intersectPlane(
        new T.Plane(new T.Vector3(0, 1, 0), -2.57),
        new T.Vector3(),
      );
      return { start, end: screen(hit.add(new T.Vector3(0.3, 0, 0.3))) };
    });
    await page.mouse.move(projection.start.x, projection.start.y);
    await page.mouse.down();
    await page.mouse.move(projection.end.x, projection.end.y, { steps: 8 });
    await page.mouse.up();
    const desk = await page.evaluate(() =>
      houseApp.state.furniture.find((f) => f.id === "desk"),
    );
    if (!(Math.abs(desk.x - 7050) < 5 && Math.abs(desk.z - 900) < 5)) {
      console.log(
        JSON.stringify({
          projection,
          desk,
          inspector: await page.locator("#inspector").textContent(),
        }),
      );
      await page.screenshot({
        path: path.join(root, "evidence/drag-diagnostic.png"),
      });
    }
    check(
      "3D에서 가구를 직접 드래그해 설계안 변경",
      Math.abs(desk.x - 7050) < 5 && Math.abs(desk.z - 900) < 5,
    );
    await page.getByRole("button", { name: "2D 평면", exact: true }).click();
    check(
      "3D 드래그 결과가 2D에 즉시 반영",
      (
        await page.locator('[data-id="desk"]').getAttribute("transform")
      ).includes(`translate(${desk.x} ${desk.z})`),
    );
    await page.locator("#undo").click();
    check(
      "3D 가구 이동 실행 취소",
      await page.evaluate(
        () => houseApp.state.furniture.find((f) => f.id === "desk").x === 6750,
      ),
    );

    await page.getByRole("button", { name: "3D 공간", exact: true }).click();
    await page.locator("#walk").click();
    check(
      "보이드·난간 경계로 걸어 나갈 수 없음",
      await page.evaluate(
        () =>
          !houseApp.canMove(3, 2) &&
          !houseApp.canMove(4.9, 3) &&
          houseApp.canMove(5.3, 2),
      ),
    );
    await page.evaluate(() => houseApp.camera.position.set(7.4, 4.12, 1.25));
    await page.keyboard.down("d");
    try {
      await page.waitForFunction(() => houseApp.camera.position.x > 8.35, {
        timeout: 15000,
      });
    } finally {
      await page.keyboard.up("d");
    }
    check(
      "다락에서 연결문을 통과해 증축 다락으로 이동",
      await page.evaluate(
        () =>
          houseApp.camera.position.x > 8.35 && houseApp.camera.position.y > 4,
      ),
    );
    await page.screenshot({ path: path.join(root, "evidence/attic-walk.png") });
    await page.locator("#walk").click();
    await page.locator("#floor").selectOption("f1");
    await page.locator("#walk").click();
    check(
      "후면 외벽 통과 차단·주방 후문 통로 유지",
      await page.evaluate(
        () =>
          !houseApp.canMove(1, -3) &&
          houseApp.canMove(0, 1.5) &&
          !houseApp.canMove(0, 2.4),
      ),
    );
    await page.close();

    const site = await context.newPage();
    captureErrors(site);
    await site.goto(origin + "site-sim.html");
    await site.waitForFunction(() => window.siteApp?.threeReady);
    for (let n = 0; n <= 6; n++) {
      await site.locator(`[data-stage="${n}"]`).click();
      await site.waitForTimeout(950);
      const visible = await site.evaluate(() =>
        siteApp.scene
          .getObjectByName("house")
          .children.filter((g) => g.visible)
          .map((g) => g.userData.stage),
      );
      check(
        `공사 ${n}단계에 맞는 실제 건물 구성`,
        visible.every((i) => i <= n) &&
          (n === 0 ? visible.length === 0 : visible.includes(n)),
      );
    }
    check(
      "사방 담장과 열린 남쪽 진입구",
      await site.evaluate(() => {
        const g = siteApp.scene.userData.garden;
        return (
          g.children.filter((o) => o.name === "garden-fence").length === 5 &&
          Math.abs(g.userData.fenceLength - 82.4) < 0.01 &&
          g.userData.gateWidth === 3.6
        );
      }),
    );
    await site
      .locator("summary")
      .filter({ hasText: "현장 사진 · 매핑 근거" })
      .click();
    await site.locator("#photoSelect").selectOption("site-photo-16.jpg");
    await site.waitForFunction(
      () =>
        document.querySelector("#sitePhoto").complete &&
        document.querySelector("#sitePhoto").naturalWidth > 0,
    );
    check(
      "현장 사진 선택으로 실제 참고 자료 변경",
      (await site.locator("#sitePhoto").getAttribute("src")).endsWith(
        "site-photo-16.jpg",
      ),
    );
    await site.locator("#photoView").click();
    check(
      "현장 도로 쪽 시점으로 이동",
      await site.evaluate(
        () => siteApp.camera.position.x > 17 && siteApp.camera.position.y < 7,
      ),
    );
    await site.screenshot({
      path: path.join(root, "evidence/site-photo-view.png"),
    });
    await site.locator("#cinema").click();
    await site.locator("#walk").click();
    check(
      "1인칭 전환으로 순항 종료·버튼 상태 동기화",
      await site.evaluate(
        () =>
          siteApp.walk &&
          !document.querySelector("#cinema").classList.contains("active"),
      ),
    );
    await site.close();

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobile = await mobileContext.newPage();
    captureErrors(mobile);
    await mobile.goto(origin + "house-plan.html");
    await mobile.waitForFunction(() => window.houseApp);
    const touchPosition = await mobile.evaluate(() => {
      const s = document.querySelector("#plan"),
        p = s.createSVGPoint();
      p.x = 1800;
      p.y = 2200;
      const q = p.matrixTransform(s.getScreenCTM());
      return { x: q.x, y: q.y };
    });
    await mobile.touchscreen.tap(touchPosition.x, touchPosition.y);
    check(
      "모바일 터치로 가구 선택·크기 편집 표시",
      await mobile.locator("#fw").isVisible(),
    );
    await mobile.getByRole("button", { name: "3D 공간", exact: true }).tap();
    await mobile.waitForFunction(() => houseApp.threeReady);
    await mobile.locator("#walk").tap();
    check(
      "모바일 이동 버튼과 하단 도구가 겹치지 않음",
      await mobile.evaluate(() => {
        const pad = document.querySelector("#walkpad").getBoundingClientRect(),
          tools = document.querySelector("#threeTools").getBoundingClientRect();
        return (
          pad.bottom <= tools.top &&
          [...document.querySelectorAll("#walkpad button")].every(
            (b) => b.getBoundingClientRect().height >= 44,
          )
        );
      }),
    );
    await mobile.screenshot({
      path: path.join(root, "evidence/house-mobile-walk.png"),
    });
    await mobile.locator("#walk").tap();
    await mobile.getByRole("button", { name: "측정", exact: true }).tap();
    check(
      "3D에서 측정 선택 시 2D 도구로 전환",
      await mobile.evaluate(
        () =>
          !document.querySelector("#two").classList.contains("hidden") &&
          document.querySelector("#three").classList.contains("hidden"),
      ),
    );
    await mobile.close();
    await mobileContext.close();
    check("확장 검증 JavaScript·리소스 오류 없음", errors.length === 0);
    fs.writeFileSync(
      path.join(root, "evidence/geometry-verification.json"),
      JSON.stringify(
        {
          date: new Date().toISOString(),
          browser: browser.version(),
          sourceSHA256: Object.fromEntries(
            Object.entries(sources).map(([name, text]) => [
              name,
              crypto.createHash("sha256").update(text).digest("hex"),
            ]),
          ),
          checks,
          errors,
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify({ passed: checks.length, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
