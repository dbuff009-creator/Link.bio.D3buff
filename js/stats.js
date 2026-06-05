const COUNT_API = 'https://countapi.mileshilliard.com/api/v1';

function counterKey(namespace, key) {
  return `${namespace}-${key}`;
}

async function countGet(namespace, key) {
  const res = await fetch(`${COUNT_API}/get/${counterKey(namespace, key)}`);
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.value) || 0;
}

async function countHit(namespace, key) {
  const res = await fetch(`${COUNT_API}/hit/${counterKey(namespace, key)}`);
  if (!res.ok) return 0;
  const data = await res.json();
  return Number(data.value) || 0;
}

function hashIp(ip) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

async function getVisitorIp() {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return data.ip;
}

/**
 * Реальный счётчик (CountAPI successor):
 * - unique = новые IP (каждый IP один раз)
 * - views  = все заходы (для подсказки)
 */
async function trackVisit(counterConfig) {
  const ns = counterConfig.namespace;

  try {
    let ip = null;
    try {
      ip = await getVisitorIp();
    } catch {
      return { views: 0, unique: 0, ip: null, offline: true };
    }

    const ipKey = `visitor-${hashIp(ip)}`;
    const alreadyVisited = await countGet(ns, ipKey);

    if (alreadyVisited === 0) {
      await countHit(ns, 'unique');
      await countHit(ns, ipKey);
    }

    const views = await countHit(ns, 'views');
    const unique = await countGet(ns, 'unique');

    return { views, unique, ip };
  } catch {
    return { views: 0, unique: 0, ip: null, offline: true };
  }
}
