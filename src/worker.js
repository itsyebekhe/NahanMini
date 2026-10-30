import { connect } from "cloudflare:sockets";

// بخش پیکربندی
let مسیر_اشتراک = "مسیر-اشتراک";
let وب_سایت_استتار;
let شناسه_تایید;
let آی_پی_های_پروکسی = ["proxyip.cmliussss.net"];
let آدرس_های_تمیز = ["openai.com"];
let رمز_عبور_مدیریت = "admin123";

let آدرس_گیت_هاب_داشبورد = "https://raw.githubusercontent.com/itsyebekhe/NahanMini/main/src/dash/index.html";
let آدرس_سی_دی_ان_داشبورد = "https://cdn.jsdelivr.net/gh/itsyebekhe/NahanMini@main/src/dash/index.html";
let آدرس_گیت_هاب_ورود = "https://raw.githubusercontent.com/itsyebekhe/NahanMini/main/src/dash/login.html";
let آدرس_سی_دی_ان_ورود = "https://cdn.jsdelivr.net/gh/itsyebekhe/NahanMini@main/src/dash/login.html";

// تفکیک کلمات کلیدی (جهت جلوگیری از شناسایی)
const تفکیک_وی۲ری = ["v2", "ray"];
const تفکیک_کلش = ["cla", "sh"];
const تفکیک_ویلس = ["vl", "ess"];

const وی۲ری = تفکیک_وی۲ری.join("");
const کلش = تفکیک_کلش.join("");
const ویلس = تفکیک_ویلس.join("");

// تبدیل فرمت کلید
const فرمت_کلید = Array.from({ length: 256 }, (_, i) => (i + 256).toString(16).slice(1));

// ورودی وب
export default {
  async fetch(درخواست, env) {
    رمز_عبور_مدیریت = env.ADMIN_PASSWORD ?? رمز_عبور_مدیریت;
    آدرس_گیت_هاب_ورود = env.LOGIN_URL ?? آدرس_گیت_هاب_ورود;
    آدرس_سی_دی_ان_ورود = env.LOGIN_CDN_URL ?? آدرس_سی_دی_ان_ورود;
    آدرس_گیت_هاب_داشبورد = env.DASH_URL ?? آدرس_گیت_هاب_داشبورد;
    آدرس_سی_دی_ان_داشبورد = env.DASH_CDN_URL ?? آدرس_سی_دی_ان_داشبورد;

    if (env.DB) {
      await مقداردهی_پایگاه_داده(env.DB);
      const رکوردها = await env.DB.prepare("SELECT key, value FROM settings").all();
      for (const سطر of رکوردها.results) {
        if (سطر.key === "مسیر_اشتراک") مسیر_اشتراک = سطر.value;
        if (سطر.key === "وب_سایت_استتار") وب_سایت_استتار = سطر.value;
        if (سطر.key === "شناسه_تایید") شناسه_تایید = سطر.value;
        if (سطر.key === "آی_پی_های_پروکسی") آی_پی_های_پروکسی = تفکیک_ارایه(سطر.value);
        if (سطر.key === "آدرس_های_تمیز") آدرس_های_تمیز = تفکیک_ارایه(سطر.value);
      }
    }

    مسیر_اشتراک = env.SUB_PATH ?? مسیر_اشتراک;
    شناسه_تایید = شناسه_تایید || ایجاد_شناسه();
    وب_سایت_استتار = env.FAKE_WEB ?? وب_سایت_استتار;
    if (env.PROXY_IP) آی_پی_های_پروکسی = تفکیک_ارایه(env.PROXY_IP);
    if (env.CLEAN_IP) آدرس_های_تمیز = تفکیک_ارایه(env.CLEAN_IP);

    const url = new URL(درخواست.url);
    const هدر_ارتقا = درخواست.headers.get("Upgrade");
    const درخواست_وب_سوکت = هدر_ارتقا == "websocket";

    const پیکربندی_مسیر = {
      وی۲ری: `/${encodeURI(مسیر_اشتراک)}/${وی۲ری}`,
      کلش: `/${encodeURI(مسیر_اشتراک)}/${کلش}`,
      تجمیع_اشتراک: `/${encodeURI(مسیر_اشتراک)}/info`,
      صفحه_ورود: `/${encodeURI(مسیر_اشتراک)}/login`,
      ای_پی_ای_ورود: `/${encodeURI(مسیر_اشتراک)}/api/login`,
      داشبورد: `/${encodeURI(مسیر_اشتراک)}/dash`,
      ای_پی_ای: `/${encodeURI(مسیر_اشتراک)}/api/settings`,
      اشتراک_عمومی: `/${encodeURI(مسیر_اشتراک)}`,
    };

    const مسیر_صحیح_است = url.pathname === پیکربندی_مسیر.وی۲ری ||
                          url.pathname === پیکربندی_مسیر.کلش ||
                          url.pathname === پیکربندی_مسیر.تجمیع_اشتراک ||
                          url.pathname === پیکربندی_مسیر.صفحه_ورود ||
                          url.pathname === پیکربندی_مسیر.ای_پی_ای_ورود ||
                          url.pathname === پیکربندی_مسیر.داشبورد ||
                          url.pathname === پیکربندی_مسیر.ای_پی_ای ||
                          url.pathname === `/${encodeURI(مسیر_اشتراک)}`;

    if (!درخواست_وب_سوکت && !مسیر_صحیح_است) {
      if (وب_سایت_استتار) {
        try {
          const targetBase = وب_سایت_استتار.startsWith('http://') || وب_سایت_استتار.startsWith('https://')
            ? وب_سایت_استتار
            : `https://${وب_سایت_استتار}`;

          const targetUrl = new URL(targetBase);
          targetUrl.pathname = url.pathname;
          targetUrl.search = url.search;

          const آبجکت_درخواست = new Request(targetUrl.toString(), {
            method: درخواست.method,
            headers: درخواست.headers,
            body: درخواست.body,
          });

          const آبجکت_پاسخ = await fetch(آبجکت_درخواست);
          return آبجکت_پاسخ;
        } catch {
          console.error(`[خطا در درخواست وب‌سایت استتار] مقصد: ${وب_سایت_استتار}`);
          return new Response(null, { status: 404 });
        }
      } else {
        return new Response(null, { status: 404 });
      }
    }

    if (!درخواست_وب_سوکت) {
      if (url.pathname === پیکربندی_مسیر.صفحه_ورود) {
        return await بارگذاری_صفحه_ورود();
      }
      else if (url.pathname === پیکربندی_مسیر.ای_پی_ای_ورود) {
        return await مدیریت_ورود(درخواست);
      }
      else if (url.pathname === پیکربندی_مسیر.داشبورد) {
        if (!بررسی_مجوز(درخواست)) {
          return Response.redirect(`${url.origin}${پیکربندی_مسیر.صفحه_ورود}`, 302);
        }
        return await بارگذاری_داشبورد();
      }
      else if (url.pathname === پیکربندی_مسیر.ای_پی_ای) {
        if (!بررسی_مجوز(درخواست)) {
          return new Response(JSON.stringify({ خطا: "عدم دسترسی" }), {
            status: 401,
            headers: { "Content-Type": "application/json;charset=utf-8" },
          });
        }
        return await مدیریت_تنظیمات(درخواست, env);
      }
      else if (url.pathname === پیکربندی_مسیر.وی۲ری) {
        return پیکربندی_وی۲ری(درخواست.headers.get("Host"));
      }
      else if (url.pathname === پیکربندی_مسیر.کلش) {
        return پیکربندی_کلش(درخواست.headers.get("Host"));
      }
      else if (url.pathname === پیکربندی_مسیر.تجمیع_اشتراک) {
        return اطلاعات_تجمیعی(درخواست.headers.get("Host"));
      }
      else if (url.pathname === پیکربندی_مسیر.اشتراک_عمومی) {
        const عامل_کاربر = درخواست.headers.get("User-Agent").toLowerCase();
        const سازنده_پیکربندی = {
          [وی۲ری]: پیکربندی_وی۲ری,
          [کلش]: پیکربندی_کلش,
          tips: رابط_راهنما,
        };
        const ابزار = Object.keys(سازنده_پیکربندی).find((ابزار) => عامل_کاربر.includes(ابزار));
        const تولید_پیکربندی = سازنده_پیکربندی[ابزار || "tips"];
        return تولید_پیکربندی(درخواست.headers.get("Host"));
      }
    }

    if (درخواست_وب_سوکت) {
      return await ارتقا_به_وب_سوکت();
    }
  },
};

// معماری اصلی اسکریپت
async function ارتقا_به_وب_سوکت() {
  const [کلاینت, رابط_وب_سوکت] = Object.values(new WebSocketPair());
  رابط_وب_سوکت.accept();
  رابط_وب_سوکت.binaryType = "arraybuffer";
  رابط_وب_سوکت.send(new Uint8Array([0, 0]));
  راه‌اندازی_خط_لوله(رابط_وب_سوکت);
  return new Response(null, { status: 101, webSocket: کلاینت });
}

async function راه‌اندازی_خط_لوله(رابط_وب_سوکت) {
  let رابط_تی‌سی‌پی;
  let داده_اولیه = true;
  let صف_پردازش = Promise.resolve();
  let داده_انتقالی;

  رابط_وب_سوکت.addEventListener("message", (event) => {
    صف_پردازش = صف_پردازش.then(async () => {
      if (داده_اولیه) {
        داده_اولیه = false;
        await تجزیه_هدر_ویلس(event.data);
      } else {
        await داده_انتقالی.write(event.data);
      }
    });
  });

  async function تجزیه_هدر_ویلس(داده_ویلس) {
    if (بررسی_کلید_ویلس(new Uint8Array(داده_ویلس.slice(1, 17))) !== شناسه_تایید) {
      return;
    }

    const موقعیت_داده = new Uint8Array(داده_ویلس)[17];
    const شاخص_پورت = 18 + موقعیت_داده + 1;
    const بافر_پورت = داده_ویلس.slice(شاخص_پورت, شاخص_پورت + 2);
    const پورت_مقصد = new DataView(بافر_پورت).getUint16(0);

    const شاخص_آدرس = شاخص_پورت + 2;
    const بافر_آدرس = new Uint8Array(داده_ویلس.slice(شاخص_آدرس, شاخص_آدرس + 1));
    const نوع_آدرس = بافر_آدرس[0];

    let طول_آدرس = 0;
    let آدرس_مقصد = "";
    let شاخص_اطلاعات_آدرس = شاخص_آدرس + 1;

    switch (نوع_آدرس) {
      case 1:
        طول_آدرس = 4;
        آدرس_مقصد = new Uint8Array(داده_ویلس.slice(شاخص_اطلاعات_آدرس, شاخص_اطلاعات_آدرس + طول_آدرس)).join(".");
        break;
      case 2:
        طول_آدرس = new Uint8Array(داده_ویلس.slice(شاخص_اطلاعات_آدرس, شاخص_اطلاعات_آدرس + 1))[0];
        شاخص_اطلاعات_آدرس += 1;
        آدرس_مقصد = new TextDecoder().decode(داده_ویلس.slice(شاخص_اطلاعات_آدرس, شاخص_اطلاعات_آدرس + طول_آدرس));
        break;
      case 3:
        طول_آدرس = 16;
        const dataView = new DataView(داده_ویلس.slice(شاخص_اطلاعات_آدرس, شاخص_اطلاعات_آدرس + طول_آدرس));
        const ipv6 = [];
        for (let i = 0; i < 8; i++) {
          ipv6.push(dataView.getUint16(i * 2).toString(16));
        }
        آدرس_مقصد = ipv6.join(":");
        break;
      default:
        return;
    }

    const نوشتن_داده_اولیه = داده_ویلس.slice(شاخص_اطلاعات_آدرس + طول_آدرس);

     try {
      رابط_تی‌سی‌پی = connect({ hostname: آدرس_مقصد, port: پورت_مقصد });
      await رابط_تی‌سی‌پی.opened;
    } catch {
      const پروکسی_انتخابی = آی_پی_های_پروکسی[Math.floor(Math.random() * آی_پی_های_پروکسی.length)] || "proxyip.cmliussss.net";
      const [آدرس_آی_پی_پروکسی, پورت_آی_پی_پروکسی = پورت_مقصد] = پروکسی_انتخابی.split(":");
      رابط_تی‌سی‌پی = connect({ hostname: آدرس_آی‌پی_پروکسی, port: Number(پورت_آی_پی_پروکسی) });
      await رابط_تی‌سی‌پی.opened;
    }

    ایجاد_خط_انتقال(نوشتن_داده_اولیه);
  }

  function بررسی_کلید_ویلس(arr, offset = 0) {
    const uuid = (فرمت_کلید[arr[offset + 0]] + فرمت_کلید[arr[offset + 1]] + فرمت_کلید[arr[offset + 2]] + فرمت_کلید[arr[offset + 3]] + "-" + فرمت_کلید[arr[offset + 4]] + فرمت_کلید[arr[offset + 5]] + "-" + فرمت_کلید[arr[offset + 6]] + فرمت_کلید[arr[offset + 7]] + "-" + فرمت_کلید[arr[offset + 8]] + فرمت_کلید[arr[offset + 9]] + "-" + فرمت_کلید[arr[offset + 10]] + فرمت_کلید[arr[offset + 11]] + فرمت_کلید[arr[offset + 12]] + فرمت_کلید[arr[offset + 13]] + فرمت_کلید[arr[offset + 14]] + فرمت_کلید[arr[offset + 15]]).toLowerCase();
    return uuid;
  }

  async function ایجاد_خط_انتقال(نوشتن_داده_اولیه) {
    داده_انتقالی = رابط_تی‌سی‌پی.writable.getWriter();

    if (نوشتن_داده_اولیه?.byteLength > 0) {
      await داده_انتقالی.write(نوشتن_داده_اولیه);
    }

    رابط_تی‌سی‌پی.readable.pipeTo(
      new WritableStream({
        write(chunk) {
          رابط_وب_سوکت.send(chunk);
        },
      })
    );
  }
}

// تابع ایجاد UUID
function ایجاد_شناسه() {
  const بیست_کاراکتر = Array.from(new TextEncoder().encode(مسیر_اشتراک))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 20)
    .padEnd(20, "0");

  const هشت_کاراکتر_اول = بیست_کاراکتر.slice(0, 8);
  const دوازده_کاراکتر_آخر = بیست_کاراکتر.slice(-12);

  return `${هشت_کاراکتر_اول}-0000-4000-8000-${دوازده_کاراکتر_آخر}`;
}

// صفحه اشتراک
async function رابط_راهنما() {
  const صفحه_راهنما = `
<title>اشتراک-${مسیر_اشتراک}</title>
<style>
  body {
    font-size: 25px;
    text-align: center;
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
    direction: rtl;
    font-family: sans-serif;
  }
</style>
<strong>لطفاً لینک را در ${کلش} یا ${وی۲ری} وارد کنید</strong>
`;

  return new Response(صفحه_راهنما, {
    status: 200,
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

function پیکربندی_وی۲ری(hostName) {
  const لیست_آدرس_ها = hostName.endsWith('.pages.dev') ? آدرس_های_تمیز : [hostName, ...آدرس_های_تمیز];
  const پیکربندی_ها = [...new Set(لیست_آدرس_ها)].map((آدرس) => {
    return `${ویلس}://${شناسه_تایید}@${آدرس}:443?encryption=none&security=tls&sni=${hostName}&fp=chrome&type=ws&host=${hostName}#${encodeURIComponent(آدرس)}`;
  });

  return new Response(پیکربندی_ها.join("\n"));
}

function پیکربندی_کلش(hostName) {
  const لیست_آدرس_ها = hostName.endsWith('.pages.dev') ? آدرس_های_تمیز : [hostName, ...آدرس_های_تمیز];
  const گره_های_منحصر = [...new Set(لیست_آدرس_ها)];

  const بخش_پروکسی_ها = گره_های_منحصر.map((آدرس) => `
- name: ${آدرس}
  type: ${ویلس}
  server: ${آدرس}
  port: 443
  uuid: ${شناسه_تایید}
  udp: true
  tls: true
  sni: ${hostName}
  network: ws
  ws-opts:
    headers:
      Host: ${hostName}
      User-Agent: Chrome`).join("\n");

  const پروکسی_های_انتخابی = گره_های_منحصر.map((آدرس) => `    - ${آدرس}`).join("\n");

  const محتوای_پیکربندی = `
proxies:
${بخش_پروکسی_ها}

proxy-groups:
- name: لیست پروکسی‌ها
  type: select
  proxies:
${پروکسی_های_انتخابی}

rules:
  - GEOSITE,cn,DIRECT
  - GEOIP,CN,DIRECT,no-resolve
  - MATCH,لیست پروکسی‌ها
`;

  return new Response(محتوای_پیکربندی);
}

// بارگذاری داشبورد از گیت‌هاب و مدیریت تنظیمات
async function بارگذاری_داشبورد() {
  const منابع = [آدرس_گیت_هاب_داشبورد, آدرس_سی_دی_ان_داشبورد];

  for (const منبع of منابع) {
    if (!منبع) continue;
    try {
      const پاسخ = await fetch(منبع);
      if (پاسخ.ok) {
        const html = await پاسخ.text();
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html;charset=utf-8" },
        });
      }
    } catch (خطا) {
      console.error(`[خطا در دریافت داشبورد از ${منبع}]: ${خطا.message}`);
    }
  }

  return new Response("Failed to load dashboard from GitHub or jsDelivr.", {
    status: 502,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

async function مدیریت_تنظیمات(درخواست, env) {
  if (درخواست.method === "GET") {
    const داده = {
      مسیر_اشتراک,
      وب_سایت_استتار: وب_سایت_استتار || "",
      شناسه_تایید,
      آی_پی_های_پروکسی,
      آدرس_های_تمیز,
    };
    return new Response(JSON.stringify(داده), {
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
  }

  if (درخواست.method === "POST") {
    try {
      const ورودی = await درخواست.json();

      if (ورودی.مسیر_اشتراک) مسیر_اشتراک = ورودی.مسیر_اشتراک;
      if (ورودی.وب_سایت_استتار !== undefined) وب_سایت_استتار = ورودی.وب_سایت_استتار;
      if (ورودی.شناسه_تایید) شناسه_تایید = ورودی.شناسه_تایید;
      if (ورودی.آی_پی_های_پروکسی) آی_پی_های_پروکسی = تفکیک_ارایه(ورودی.آی_پی_های_پروکسی);
      if (ورودی.آدرس_های_تمیز) آدرس_های_تمیز = تفکیک_ارایه(ورودی.آدرس_های_تمیز);

      if (env.DB) {
        await env.DB.batch([
          env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("مسیر_اشتراک", مسیر_اشتراک),
          env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("وب_سایت_استتار", وب_سایت_استتار),
          env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("شناسه_تایید", شناسه_تایید),
          env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("آی_پی_های_پروکسی", آی_پی_های_پروکسی.join("\n")),
          env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind("آدرس_های_تمیز", آدرس_های_تمیز.join("\n")),
        ]);
      }

      return new Response(JSON.stringify({ موفقیت: true }), {
        headers: { "Content-Type": "application/json;charset=utf-8" },
      });
    } catch {
      return new Response(JSON.stringify({ موفقیت: false, پیام: "خطا در پردازش اطلاعات" }), {
        status: 400,
        headers: { "Content-Type": "application/json;charset=utf-8" },
      });
    }
  }

  return new Response(null, { status: 405 });
}

// بارگذاری صفحه ورود از گیت‌هاب یا jsDelivr
async function بارگذاری_صفحه_ورود() {
  const منابع = [آدرس_گیت_هاب_ورود, آدرس_سی_دی_ان_ورود];
  for (const منبع of منابع) {
    if (!منبع) continue;
    try {
      const پاسخ = await fetch(منبع);
      if (پاسخ.ok) {
        const html = await پاسخ.text();
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html;charset=utf-8" },
        });
      }
    } catch (خطا) {
      console.error(`[خطا در دریافت صفحه ورود از ${منبع}]: ${خطا.message}`);
    }
  }
  return new Response("Failed to load login page from GitHub or jsDelivr.", {
    status: 502,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  });
}

// پردازش درخواست ورود و احراز هویت
async function مدیریت_ورود(درخواست) {
  if (درخواست.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  try {
    const { password } = await درخواست.json();
    if (password === رمز_عبور_مدیریت) {
      const توکن = btoa(رمز_عبور_مدیریت);
      return new Response(JSON.stringify({ موفقیت: true, توکن }), {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          "Set-Cookie": `admin_token=${توکن}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        },
      });
    }
    return new Response(JSON.stringify({ موفقیت: false, پیام: "رمز عبور نادرست است" }), {
      status: 401,
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
  } catch {
    return new Response(JSON.stringify({ موفقیت: false, پیام: "درخواست نامعتبر است" }), {
      status: 400,
      headers: { "Content-Type": "application/json;charset=utf-8" },
    });
  }
}

// اعتبارسنجی کوکی یا هدر دسترسی
function بررسی_مجوز(درخواست) {
  const توکن_صحیح = btoa(رمز_عبور_مدیریت);
  const هدر_احراز = درخواست.headers.get("Authorization");
  if (هدر_احراز === `Bearer ${توکن_صحیح}`) {
    return true;
  }
  const کوکی = درخواست.headers.get("Cookie") || "";
  return کوکی.includes(`admin_token=${توکن_صحیح}`);
}

// مقداردهی اولیه جدول تنظیمات در دیتابیس D1
async function مقداردهی_پایگاه_داده(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `).run();
}

// تفکیک ورودی رشته‌ای یا آرایه‌ای به لیست تمیز
function تفکیک_ارایه(ورودی) {
  if (Array.isArray(ورودی)) return ورودی;
  if (typeof ورودی === "string") {
    return ورودی.split(/[\r\n,]+/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}