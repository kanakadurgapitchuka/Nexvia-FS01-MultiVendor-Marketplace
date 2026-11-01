
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { elastic } from '../config/elastic.js';
import Product from '../models/Product.js';

async function reindexProducts() {
  try {
    if (!elastic) {
      throw new Error('Elasticsearch is not configured');
    }

    await connectDB();

    const products = await Product.find({}).lean();

    if (products.length === 0) {
      console.log('No products found in MongoDB.');
      return;
    }

    await elastic.indices.create(
      { index: 'products' },
      { ignore: [400] }
    );

    const operations = products.flatMap((product) => [
      {
        index: {
          _index: 'products',
          _id: String(product._id)
        }
      },
      {
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price,
        vendorId: String(product.vendor),
        active: product.active
      }
    ]);

    const result = await elastic.bulk({
      refresh: true,
      operations
    });

    if (result.errors) {
      console.log('Some products could not be indexed.');
      console.log(
        result.items.filter((item) => item.index?.error)
      );
    }

    console.log(`MongoDB products found: ${products.length}`);
    console.log(`Elasticsearch indexed: ${
      result.items.filter((item) => item.index?.result !== 'error').length
    }`);
  } catch (error) {
    console.error('Reindex failed:', error.message);
  } finally {
    if (elastic) await elastic.close();
    await (await import('mongoose')).default.disconnect();
  }
}

reindexProducts();
