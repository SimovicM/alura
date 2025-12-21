// Simple script to seed 5 placeholder products into Firestore using REST API
// Run: node scripts/seed-products.js

const fetch = globalThis.fetch || require('node-fetch');

const FIRESTORE_API_KEY = 'AIzaSyAdeQrlo5zwhLiPmHqO45MxK9wXTNGRL4I';
const PROJECT_ID = 'aluratapes';
const COLLECTION = 'products';

function randomName() {
  return `Design ${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function addProduct(product) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${FIRESTORE_API_KEY}`;
  const body = {
    fields: {
      name: { stringValue: product.name },
      imageUrl: { stringValue: product.imageUrl },
      price: { integerValue: String(product.price) },
      preorder: { booleanValue: product.preorder },
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
    throw new Error(`Failed to add product: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data;
}

(async () => {
  try {
    console.log('Seeding 5 placeholder products...');
    for (let i = 0; i < 5; i++) {
      const prod = {
        name: randomName(),
        imageUrl: '',
        price: 200,
        preorder: true
      };
      const added = await addProduct(prod);
      console.log('Added:', added.name || added.documents || added);
    }
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
})();