
import { Client } from '@elastic/elasticsearch';

const node = process.env.ELASTICSEARCH_URL;
const apiKey = process.env.ELASTICSEARCH_API_KEY;

export const elastic = node
  ? new Client({
      node,
      ...(apiKey && {
        auth: { apiKey }
      })
    })
  : null;

// Elasticsearch connection check
if (elastic) {
  elastic.ping()
    .then(() => {
      console.log('Elasticsearch connected successfully');
    })
    .catch((error) => {
      console.error('Elasticsearch connection failed:', error);
    });
}

// Index product in Elasticsearch
export async function indexProduct(product) {
  if (!elastic) return;

  try {
    await elastic.index({
      index: 'products',
      id: String(product._id),
      document: {
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        vendorId: String(product.vendor),
        active: product.active
      }
    });
  } catch (error) {
    console.warn('Elasticsearch index skipped:', error.message);
  }
}
