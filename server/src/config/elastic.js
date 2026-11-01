import { Client } from '@elastic/elasticsearch';
export const elastic = process.env.ELASTICSEARCH_URL ? new Client({node:process.env.ELASTICSEARCH_URL}) : null;
export async function indexProduct(product){
  if(!elastic) return;
  try { await elastic.index({index:'products',id:String(product._id),document:{name:product.name,description:product.description,category:product.category,price:product.price,vendorId:String(product.vendor),active:product.active}}); } catch(e){ console.warn('Elasticsearch index skipped:',e.message); }
}
