// Simple script to seed 5 placeholder products into Firestore using REST API
// Run: node scripts/seed-products.js

const fetch = globalThis.fetch || require('node-fetch');

const FIRESTORE_API_KEY = 'AIzaSyAdeQrlo5zwhLiPmHqO45MxK9wXTNGRL4I';
const PROJECT_ID = 'aluratapes';
const COLLECTION = 'products';

// Sample products with image filenames
// Upload image files to /public folder with these exact names:
const sampleProducts = [
  { name: 'Alura Black', imageUrl: 'alurablack.png', price: 7.99, preorder: true },  // Save as: alurablack.png
  { name: 'Alura White', imageUrl: 'alurawhite.png', price: 7.99, preorder: true },  // Save as: alurawhite.png
  { name: 'Cross Black', imageUrl: 'crossblack.png', price: 7.99, preorder: true },  // Save as: crossblack.png
  { name: 'Cross White', imageUrl: 'crosswhite.png', price: 7.99, preorder: true }   // Save as: crosswhite.png
];

async function addProduct(product) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${FIRESTORE_API_KEY}`;
  const body = {
    fields: {
      name: { stringValue: product.name },
      imageUrl: { stringValue: product.imageUrl },
      price: { doubleValue: String(product.price) },
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
    console.log(`Seeding ${sampleProducts.length} products with image filenames...`);
    for (const prod of sampleProducts) {
      const added = await addProduct(prod);
      console.log(`Added: ${prod.name} (${prod.imageUrl})`);
    }
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Error seeding products:', err);
    process.exit(1);
  }
})();