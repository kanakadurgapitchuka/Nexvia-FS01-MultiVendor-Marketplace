
import { Router } from 'express';
import mongoose from 'mongoose';

import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { auth, allow } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createUploadUrl,
  getImageKey,
  getImageObject
} from '../services/s3.js';
import { elastic } from '../config/elastic.js';

const router = Router();

// GET /api/products
// List products with search, filters, sorting and pagination
router.get('/', asyncHandler(async (req, res) => {
  const {
    q,
    category,
    sort = 'newest',
    minPrice,
    maxPrice,
    page = '1',
    limit = '12'
  } = req.query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(limit) || 12));

  const filter = { active: true };

  if (q) {
    const escapedQuery = String(q).replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

    filter.$or = [
      { name: new RegExp(escapedQuery, 'i') },
      { description: new RegExp(escapedQuery, 'i') }
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined && Number.isFinite(Number(minPrice))) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  let products;

  // Elasticsearch search
  if (q && elastic) {
    try {
      const result = await elastic.search({
        index: 'products',
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: String(q),
                  fields: ['name^3', 'description', 'category']
                }
              }
            ],
            filter: [{ term: { active: true } }]
          }
        },
        from: (pageNumber - 1) * pageSize,
        size: pageSize
      });

      const ids = result.hits.hits.map((hit) => hit._id);

      products = await Product.find({
        ...filter,
        _id: { $in: ids }
      }).populate('vendor', 'name');

      const productMap = new Map(
        products.map((product) => [String(product._id), product])
      );

      products = ids
        .map((id) => productMap.get(String(id)))
        .filter(Boolean);
    } catch {
      products = null;
    }
  }

  // MongoDB fallback
  if (!products) {
    let query = Product.find(filter).populate('vendor', 'name');

    if (sort === 'price_asc') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      query = query.sort({ price: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    products = await query
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);
  }

  res.json({ products });
}));

// GET /api/products/image?key=products/IMAGE_ID
// Stream an image from the private S3 bucket
// IMPORTANT: Keep this route before /:id
router.get('/image', asyncHandler(async (req, res) => {
  const key = await getImageKey(String(req.query.key || ''));
  const object = await getImageObject(key);

  if (!object.Body) {
    return res.status(404).json({ message: 'Image not found' });
  }

  res.setHeader(
    'Content-Type',
    object.ContentType || 'application/octet-stream'
  );

  res.setHeader('Cache-Control', 'private, max-age=300');

  object.Body.pipe(res);
}));

// POST /api/products/upload-url
// Create a temporary URL for uploading an image
router.post(
  '/upload-url',
  auth,
  allow('vendor'),
  asyncHandler(async (req, res) => {
    try {
      const result = await createUploadUrl({
        contentType: req.body.contentType
      });

      res.json(result);
    } catch (error) {
      res.status(503).json({ message: error.message });
    }
  })
);

// GET /api/products/:id
// Get one product
router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const product = await Product.findOne({
    _id: req.params.id,
    active: true
  }).populate('vendor', 'name');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ product });
}));

// POST /api/products
// Create a product
router.post(
  '/',
  auth,
  allow('vendor'),
  asyncHandler(async (req, res) => {
    if (req.user.vendorStatus !== 'approved') {
      return res.status(403).json({
        message: 'Vendor must be approved before listing products'
      });
    }

    const {
      name,
      description,
      category,
      price,
      stock,
      images = []
    } = req.body;

    if (
      !name ||
      !category ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: 'Name, category, and valid price are required'
      });
    }

    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: 'Images must be an array'
      });
    }

    let safeImages;

    try {
      safeImages = await Promise.all(
        images.map((image) => getImageKey(image))
      );
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      stock: Math.max(0, Number(stock) || 0),
      images: safeImages,
      vendor: req.user._id
    });

    try {
      if (elastic) {
        await elastic.index({
          index: 'products',
          id: String(product._id),
          document: {
            name,
            description,
            category,
            price: Number(price),
            vendorId: String(req.user._id),
            active: true
          }
        });
      }
    } catch {
      // Keep the MongoDB product even if Elasticsearch is unavailable
    }

    res.status(201).json({ product });
  })
);

// PATCH /api/products/:id
// Update a product
router.patch(
  '/:id',
  auth,
  allow('vendor', 'admin'),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (
      req.user.role !== 'admin' &&
      !product.vendor.equals(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not your product' });
    }

    for (const key of [
      'name',
      'description',
      'category',
      'active'
    ]) {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    }

    if (req.body.images !== undefined) {
      if (!Array.isArray(req.body.images)) {
        return res.status(400).json({
          message: 'Images must be an array'
        });
      }

      try {
        product.images = await Promise.all(
          req.body.images.map((image) => getImageKey(image))
        );
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    for (const key of ['price', 'stock']) {
      if (
        req.body[key] !== undefined &&
        Number.isFinite(Number(req.body[key])) &&
        Number(req.body[key]) >= 0
      ) {
        product[key] = Number(req.body[key]);
      }
    }

    await product.save();

    try {
      if (elastic) {
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
      }
    } catch {
      // Ignore Elasticsearch errors
    }

    res.json({ product });
  })
);

// DELETE /api/products/:id
// Archive a product
router.delete(
  '/:id',
  auth,
  allow('vendor', 'admin'),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (
      req.user.role !== 'admin' &&
      !product.vendor.equals(req.user._id)
    ) {
      return res.status(403).json({ message: 'Not your product' });
    }

    product.active = false;
    await product.save();

    res.json({ message: 'Product archived' });
  })
);

// GET /api/products/:id/reviews
// Get product reviews
router.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const reviews = await Review.find({
      product: req.params.id
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  })
);

export default router;
