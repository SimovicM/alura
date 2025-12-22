// Script to seed coupons into Firestore
const fetch = globalThis.fetch || require('node-fetch');

const FIRESTORE_API_KEY = 'AIzaSyAdeQrlo5zwhLiPmHqO45MxK9wXTNGRL4I';
const PROJECT_ID = 'aluratapes';
const COLLECTION = 'coupons';

const coupons = [
  { code: 'WELCOME5', percent: 5, active: true },
  // Secret admin coupon — keep active false so it won't be usable by customers unless you enable it
  { code: 'SECRET100', percent: 100, active: false }
];

async function addCoupon(coupon) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${FIRESTORE_API_KEY}`;
  const body = {
    fields: {
      code: { stringValue: coupon.code },
      percent: { integerValue: String(coupon.percent) },
      active: { booleanValue: !!coupon.active },
      createdAt: { timestampValue: new Date().toISOString() }
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to add coupon: ${res.status} ${text}`);
  }

  return res.json();
}

(async () => {
  try {
    console.log(`Seeding ${coupons.length} coupons...`);
    for (const c of coupons) {
      const added = await addCoupon(c);
      console.log(`Added coupon: ${c.code} (${c.percent}%) active=${c.active}`);
    }
    console.log('Coupons seeded.');
  } catch (err) {
    console.error('Error seeding coupons:', err);
    process.exit(1);
  }
})();
