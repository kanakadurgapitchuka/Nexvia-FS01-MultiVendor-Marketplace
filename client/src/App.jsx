
import React, { useEffect, useState } from 'react';
import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, UserRound, Store, LayoutDashboard,
  LogOut, Package, Plus, ShoppingCart, ClipboardList
} from 'lucide-react';
import { api } from './api.js';

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [sortOrder, setSortOrder] = useState('default');
  const [notice, setNotice] = useState('');
  const nav = useNavigate();

  async function load() {
    try {
      const r = await api.get('/products', { params: { q } });
      setProducts(r.data.products || []);
    } catch (e) {
      setNotice(e.response?.data?.message || 'Could not load products.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function search(e) {
    e.preventDefault();
    await load();
  }

  async function add(p) {
    if (!user) {
      nav('/login');
      return;
    }
    try {
      await api.post('/cart/items', {
        productId: p._id,
        quantity: 1
      });
      setCartCount(c => c + 1);
      setNotice('Added to cart');
    } catch (e) {
      setNotice(e.response?.data?.message || 'Could not add to cart');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    nav('/');
  }

  return (
    <div className="app">
<header className="topbar">
  <Link to="/" className="brand">
    <span className="brand-icon">
      <ShoppingBag size={21} />
    </span>
    <span>
      Nexvia<span className="brand-light">Market</span>
    </span>
  </Link>

  <form className="search" onSubmit={search}>
    <Search size={18} />
    <input
      value={q}
      onChange={e => setQ(e.target.value)}
      placeholder="Search products, categories..."
    />
    <button>Search</button>
  </form>

  <nav>
    <Link to="/cart">
      <ShoppingCart size={18} /> Cart {cartCount || ''}
    </Link>

    {user ? (
      <>
        <span className="hello">Hi, {user.name}</span>

        <Link to="/orders">
          <ClipboardList size={18} /> My Orders
        </Link>

        {user.role === 'vendor' && (
          <Link to="/vendor">
            <Store size={18} /> Vendor
          </Link>
        )}

        {user.role === 'admin' && (
          <Link to="/admin">
            <LayoutDashboard size={18} /> Admin
          </Link>
        )}

        <button className="link-button" onClick={logout}>
          <LogOut size={17} /> Sign out
        </button>
      </>
    ) : (
      <Link to="/login">
        <UserRound size={18} /> Sign in
      </Link>
    )}
  </nav>
</header>

      <main>
        <Routes>
          <Route path="/" element={
            <>
            
              <section className="hero">
                <div>
                  <span className="eyebrow">ONE MARKETPLACE. MANY SELLERS.</span>
                  <h1>Find something<br /><em>worth keeping.</em></h1>
                  <p>Discover products from independent vendors in one simple marketplace.</p>
                  <a className="primary" href="#products">
                    Explore products <ShoppingBag size={17} />
                  </a>
                </div>
                <div className="hero-art">
                  <div className="orb orb1" />
                  <div className="orb orb2" />
                  <div className="art-card">
                    <Package size={64} />
                    <span>Discover more</span>
                  </div>
                </div>
              </section>

              <div className="section-heading" id="products">
                <div>
                  <span className="eyebrow">CURATED FOR YOU</span>
                  <h2>Shop the marketplace</h2>
                </div>
                <span className="muted">{products.length} products</span>
              </div>

              {notice && <div className="notice">{notice}</div>}
              <div className="sort-bar">
  <label>
    Sort by:
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
    >
      <option value="default">Default</option>
      <option value="low-high">Price: Low to High</option>
      <option value="high-low">Price: High to Low</option>
      <option value="name">Name: A to Z</option>
    </select>
  </label>
</div>

              <section className="products">
                {[...products]
  .sort((a, b) => {
    if (sortOrder === 'low-high') return a.price - b.price;
    if (sortOrder === 'high-low') return b.price - a.price;
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    return 0;
  })
  .map(p => (
                  <article className="product-card" key={p._id}>
                    <div className="product-image">
                      {p.images?.[0] ? (
  <img
    src={`http://localhost:5000/api/products/image?key=${encodeURIComponent(
      p.images[0].startsWith('https://')
        ? new URL(p.images[0]).pathname.slice(1)
        : p.images[0]
    )}`}
    alt={p.name}
  />
) : (
  <Package size={45} />
)}
                      <span>{p.category}</span>
                    </div>
                    <div className="product-info">
                      <h3>{p.name}</h3>
                      <p>{p.description || 'Thoughtfully selected from our marketplace.'}</p>
                      <div className="product-bottom">
                        <strong>₹{Number(p.price).toLocaleString('en-IN')}</strong>
                        <button aria-label="Add to cart" onClick={() => add(p)}>
                          <Plus size={18} />
                        </button>
                      </div>
                      <small>Sold by {p.vendor?.name || 'Marketplace vendor'}</small>
                    </div>
                  </article>
                ))}
              </section>

              {!products.length && (
                <div className="empty">
                  <Package size={34} />
                  <h3>No products found yet</h3>
                  <p>Once vendors add products, they will appear here.</p>
                </div>
              )}
            </>
          } />

          <Route path="/login" element={
  <Auth onAuth={u => { setUser(u); nav('/'); }} />
} />

<Route path="/cart" element={<Cart />} />

<Route path="/orders" element={<MyOrders />} />
          <Route path="/vendor" element={<Vendor user={user} />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer>
        <span>© 2026 Nexvia Market</span>
        <span>Built for the FS-01 marketplace capstone</span>
      </footer>
    </div>
  );
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api.post(`/auth/${mode}`, form);
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      onAuth(r.data.user);
    } catch (e) {
      setError(e.response?.data?.message || 'Request failed');
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">WELCOME TO NEXVIA</span>
        <h2>{mode === 'login' ? 'Good to see you.' : 'Create your account.'}</h2>
        <p className="muted">
          {mode === 'login' ? 'Sign in to continue shopping.' : 'Join customers and vendors on one marketplace.'}
        </p>

        {mode === 'register' && (
          <label>Full name
            <input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </label>
        )}

        <label>Email address
          <input type="email" required value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>Password
          <input type="password" minLength="8" required value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} />
        </label>

        {error && <div className="error">{error}</div>}
        <button className="primary full">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="switch"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already registered? Sign in'}
        </button>
      </form>
    </div>
  );
}


function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function loadOrders() {
    try {
      const response = await api.get('/orders/my');
      setOrders(response.data.orders || response.data);
    } catch (error) {
      setMsg(error.response?.data?.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Download PDF invoice
  async function downloadInvoice(order) {
    try {
      setMsg('Generating invoice...');

      const response = await api.get(
        `/invoices/${order._id}.pdf`,
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], {
        type: 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `invoice-${order._id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setMsg('Invoice downloaded successfully!');
    } catch (error) {
      setMsg('Unable to download invoice. Please try again.');
    }
  }

  async function payExistingOrder(order) {
    try {
      setMsg('Opening Razorpay payment...');

      const paymentResponse = await api.post('/payments/razorpay/order', {
        orderId: order._id
      });

      const { keyId, razorpayOrder } = paymentResponse.data;

      if (!window.Razorpay) {
        setMsg('Razorpay did not load. Please refresh the page.');
        return;
      }

      const checkout = new window.Razorpay({
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Nexvia Market',
        description: `Payment for order ${order._id}`,
        order_id: razorpayOrder.id,

        handler: async (response) => {
          try {
            await api.post('/payments/razorpay/verify', {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setMsg('Payment successful!');
            window.location.reload();
          } catch (error) {
            setMsg(
              error.response?.data?.message ||
              'Payment verification failed.'
            );
          }
        },

        modal: {
          ondismiss: () => {
            setMsg('Payment cancelled. Your order is still pending.');
          }
        },

        theme: { color: '#101828' }
      });

      checkout.on('payment.failed', async (response) => {
        try {
          const failedOrderId = response.error?.metadata?.order_id;
          const failedPaymentId = response.error?.metadata?.payment_id;

          if (!failedOrderId) {
            setMsg('Payment failed. Please check My Orders.');
            return;
          }

          await api.post('/payments/razorpay/failure', {
            orderId: order._id,
            razorpay_order_id: failedOrderId,
            razorpay_payment_id: failedPaymentId
          });

          setMsg('Payment failed. Please check your order status.');
          window.location.reload();
        } catch (error) {
          setMsg(
            error.response?.data?.message ||
            'Payment failed, but the status could not be updated.'
          );
        }
      });

      checkout.open();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Unable to start payment. Please try again.'
      );
    }
  }

  return (
    <section className="content-page">
      <span className="eyebrow">YOUR PURCHASES</span>
      <h1>My Orders</h1>
      <p className="muted">
        View your order history and payment status.
      </p>

      {loading && <p>Loading your orders...</p>}

      {msg && <div className="notice">{msg}</div>}

      {!loading && orders.length === 0 && !msg && (
        <div className="empty">
          <Package size={34} />
          <h3>No orders yet</h3>
          <p>Your placed orders will appear here.</p>
          <Link className="primary" to="/">
            Continue shopping
          </Link>
        </div>
      )}

      {orders.map(order => (
        <article className="cart-row" key={order._id}>
          <div>
            <h3>Order #{order._id}</h3>

            <p>
              Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}
            </p>

            {order.items?.map((item, index) => (
              <p key={`${order._id}-${index}`}>
                {item.name} × {item.quantity}
              </p>
            ))}

            <p>
              Order status: <strong>{order.status}</strong>
            </p>

            <p>
              Payment status: <strong>{order.paymentStatus}</strong>
            </p>
          </div>

          <strong>
            ₹{Number(order.total || 0).toLocaleString('en-IN')}
          </strong>

          <button
            type="button"
            className="primary"
            onClick={() => downloadInvoice(order)}
          >
            Download Invoice
          </button>

          {order.paymentStatus === 'pending' && (
            <button
              className="primary"
              onClick={() => payExistingOrder(order)}
            >
              Pay Now
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

function Cart() {
  const [data, setData] = useState({ items: [], total: 0 });
  const [msg, setMsg] = useState('');
  const [coupon, setCoupon] = useState('');

  async function load() {
    try {
      const r = await api.get('/cart');
      setData(r.data);
    } catch (e) {
      setMsg(
        e.response?.data?.message ||
        'Please sign in to view your cart.'
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Increase or decrease quantity
  async function updateQuantity(productId, quantity) {
    try {
      if (quantity < 1) {
        await removeItem(productId);
        return;
      }

      await api.patch(`/cart/items/${productId}`, {
        quantity
      });

      await load();
      setMsg('');
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Unable to update quantity.'
      );
    }
  }

  // Remove product from cart
  async function removeItem(productId) {
    try {
      await api.delete(`/cart/items/${productId}`);
      await load();
      setMsg('Product removed from cart.');
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Unable to remove product.'
      );
    }
  }

  // Checkout and Razorpay payment
  async function checkout() {
    let order;

    try {
      setMsg('Creating your order...');

      const orderResponse = await api.post('/orders/checkout', {
        couponCode: coupon || undefined
      });

      order = orderResponse.data.order;

      const paymentResponse = await api.post(
        '/payments/razorpay/order',
        {
          orderId: order._id
        }
      );

      const { keyId, razorpayOrder } = paymentResponse.data;

      if (!window.Razorpay) {
        setMsg(
          'Razorpay Checkout did not load. Refresh the page and try again.'
        );
        return;
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Nexvia Market',
        description: `Payment for order ${order._id}`,
        order_id: razorpayOrder.id,

        handler: async function (response) {
          try {
            setMsg('Verifying payment...');

            await api.post('/payments/razorpay/verify', {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setMsg(
              `Payment successful! Order ID: ${order._id}`
            );

            setData({ items: [], total: 0 });
          } catch (error) {
            setMsg(
              error.response?.data?.message ||
              'Payment verification failed.'
            );
          }
        },

        modal: {
          ondismiss: function () {
            setMsg(
              `Payment cancelled or closed. Order ID: ${order._id}. Payment is still pending.`
            );
          }
        },

        theme: {
          color: '#101828'
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
        setMsg(
          response.error?.description ||
          `Payment failed. Order ID: ${order._id}.`
        );
      });

      razorpay.open();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Checkout failed. Please check your order and try again.'
      );
    }
  }

  return (
    <section className="content-page">
      <span className="eyebrow">YOUR SELECTION</span>
      <h1>Shopping cart</h1>

      {data.items.map(item => (
        <div className="cart-row" key={item.product._id}>
          <div>
            <strong>{item.product.name}</strong>

            <p>
              ₹{Number(item.product.price).toFixed(2)} each
            </p>

            <div className="cart-quantity">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    item.product._id,
                    item.quantity - 1
                  )
                }
              >
                −
              </button>

              <strong>{item.quantity}</strong>

              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    item.product._id,
                    item.quantity + 1
                  )
                }
              >
                +
              </button>

              <button
                type="button"
                onClick={() => removeItem(item.product._id)}
              >
                Remove
              </button>
            </div>
          </div>

          <strong>
            ₹{Number(item.lineTotal).toFixed(2)}
          </strong>
        </div>
      ))}

      {data.items.length > 0 && (
        <>
          <label>
            Coupon code
            <input
              value={coupon}
              onChange={e => setCoupon(e.target.value)}
              placeholder="Optional coupon"
            />
          </label>

          <h2>
            Total: ₹{Number(data.total).toFixed(2)}
          </h2>

          <button
            className="primary"
            onClick={checkout}
          >
            Create order
          </button>
        </>
      )}

      {msg && <div className="notice">{msg}</div>}

      {!data.items.length && (
        <p className="muted">
          Your cart is empty, or sign in to load it.
        </p>
      )}
    </section>
  );
}

function Vendor({ user }) {
  const [status, setStatus] = useState(user?.vendorStatus || '');
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Home',
    price: '',
    stock: '',
    images: []
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [myProducts, setMyProducts] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const loadMyOrders = async () => {
  try {
    const response = await api.get('/orders/vendor');
    setMyOrders(response.data.orders || []);
  } catch (error) {
    console.error('Failed to load vendor orders:', error);
  }
};
  const updateOrderStatus = async (orderId, status) => {
  try {
    await api.patch(`/orders/${orderId}/status`, { status });
    setMsg(`Order updated to ${status}`);
    await loadMyOrders();
  } catch (error) {
    setMsg(
      error.response?.data?.message ||
      'Could not update order status.'
    );
  }
};
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  async function loadMyProducts() {
    try {
      const response = await api.get('/products', {
        params: { limit: 50 }
      });

      const allProducts = response.data.products || [];
      const myId = String(user?._id || user?.id || '');

      const mine = allProducts.filter((product) => {
        const vendorId = String(
          product.vendor?._id || product.vendor || ''
        );
        return myId && vendorId === myId;
      });

      setMyProducts(mine);
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Could not load products.'
      );
    }
  }

  useEffect(() => {
    if (user) {
      loadMyProducts();
      loadMyOrders();
    }
  }, [user]);

  async function apply() {
    try {
      const response = await api.post('/vendors/apply');
      setStatus(response.data.vendorStatus);
      setMsg(
        response.data.message ||
        'Vendor application submitted.'
      );
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Could not submit vendor application.'
      );
    }
  }

  async function uploadImage(file) {
    if (!file) {
      throw new Error('Please select an image.');
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Choose a JPG, PNG, or WebP image.');
    }

    const response = await api.post('/products/upload-url', {
      contentType: file.type
    });

    const { uploadUrl, key } = response.data;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Image upload failed. Please try again.');
    }

    return key;
  }

  async function create(e) {
    e.preventDefault();
    setMsg('');

    try {
      setUploading(true);
      const key = await uploadImage(imageFile);

      await api.post('/products', {
        ...form,
        images: [key]
      });

      setMsg('Product and image saved successfully!');

      setForm({
        name: '',
        description: '',
        category: 'Home',
        price: '',
        stock: '',
        images: []
      });

      setImageFile(null);
      e.target.reset();
      await loadMyProducts();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        error.message ||
        'Could not save product.'
      );
    } finally {
      setUploading(false);
    }
  }

  async function updateImage(e) {
    e.preventDefault();
    if (!editingProduct) return;

    setMsg('');

    try {
      setUploading(true);
      const key = await uploadImage(editImageFile);

      await api.patch(`/products/${editingProduct._id}`, {
        images: [key]
      });

      setMsg(`Image updated for ${editingProduct.name}!`);
      setEditingProduct(null);
      setEditImageFile(null);
      await loadMyProducts();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        error.message ||
        'Could not update product image.'
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setMsg('');

    try {
      await api.delete(`/products/${product._id}`);

      setMsg(`${product.name} deleted successfully!`);

      if (editingProduct?._id === product._id) {
        setEditingProduct(null);
        setEditImageFile(null);
      }

      await loadMyProducts();
    } catch (error) {
      setMsg(
        error.response?.data?.message ||
        'Could not delete product. Check the backend API.'
      );
    }
  }

  if (!user) {
    return (
      <div className="content-page">
        <h1>Vendor workspace</h1>
        <p>Please sign in first.</p>
      </div>
    );
  }

  return (
    <section className="content-page">
      <span className="eyebrow">SELL WITH NEXVIA</span>
      <h1>Vendor workspace</h1>

      <p className="muted">
        Status: {status || 'not applied'}
      </p>

      <button
        type="button"
        className="secondary"
        onClick={apply}
      >
        Apply to become a vendor
      </button>

      {(status === 'approved' || user.role === 'vendor') && (
        <>
          <form
            className="auth-card product-form"
            onSubmit={create}
          >
            <h2>Add a product</h2>

            {[
              ['name', 'Product name'],
              ['description', 'Description'],
              ['category', 'Category'],
              ['price', 'Price (INR)'],
              ['stock', 'Stock quantity']
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required={key !== 'description'}
                  type={
                    ['price', 'stock'].includes(key)
                      ? 'number'
                      : 'text'
                  }
                  min={
                    ['price', 'stock'].includes(key)
                      ? '0'
                      : undefined
                  }
                  value={form[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]: e.target.value
                    })
                  }
                />
              </label>
            ))}

            <label>
              Product image (JPG, PNG, or WebP)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) =>
                  setImageFile(e.target.files?.[0] || null)
                }
              />
            </label>

            {imageFile && (
              <p className="muted">
                Selected: {imageFile.name}
              </p>
            )}

            <button
              type="submit"
              className="primary"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Save product'}
            </button>
          </form>

          <div className="my-products">
            <h2>My products</h2>

            {myProducts.length === 0 && (
              <p className="muted">
                No products found for this account.
              </p>
            )}

            {myProducts.map((product) => (
              <div className="cart-row" key={product._id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingProduct(product);
                    setEditImageFile(null);
                  }}
                >
                  Update image
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => deleteProduct(product)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="my-products">
  <h2>Vendor Orders</h2>

  {myOrders.length === 0 && (
    <p className="muted">No orders received yet.</p>
  )}

  {myOrders.map((order) => (
    <div className="cart-row" key={order._id}>
      <div>
        <strong>Order #{order._id.slice(-6)}</strong>
        <p>Status: {order.status}</p>
        <p>Payment: {order.paymentStatus}</p>

        {order.items.map((item) => (
  <p key={item._id || item.product}>
    {item.name} × {item.quantity}
  </p>
))}

{order.paymentStatus === 'paid' && (
  <>
    {order.status === 'placed' && (
      <button
        type="button"
        onClick={() => updateOrderStatus(order._id, 'packed')}
      >
        Mark as Packed
      </button>
    )}

    {order.status === 'packed' && (
      <button
        type="button"
        onClick={() => updateOrderStatus(order._id, 'shipped')}
      >
        Mark as Shipped
      </button>
    )}

    {order.status === 'shipped' && (
      <button
        type="button"
        onClick={() => updateOrderStatus(order._id, 'delivered')}
      >
        Mark as Delivered
      </button>
    )}
  </>
)}
      </div>
    </div>
  ))}
</div>
      

          {editingProduct && (
            <form
              className="auth-card product-form"
              onSubmit={updateImage}
            >
              <h2>Update product image</h2>

              <p>
                Product: <strong>{editingProduct.name}</strong>
              </p>

              <label>
                Choose new image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  onChange={(e) =>
                    setEditImageFile(
                      e.target.files?.[0] || null
                    )
                  }
                />
              </label>

              {editImageFile && (
                <p className="muted">
                  Selected: {editImageFile.name}
                </p>
              )}

              <button
                type="submit"
                className="primary"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Save new image'}
              </button>

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingProduct(null);
                  setEditImageFile(null);
                }}
              >
                Cancel
              </button>
            </form>
          )}
        </>
      )}

      {msg && <div className="notice">{msg}</div>}
    </section>
  );
}

function Admin() {
  const [data, setData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState('');

 async function loadData() {
  try {
    const [analytics, pending, allOrders] = await Promise.all([
      api.get('/admin/analytics'),
      api.get('/vendors/pending'),
      api.get('/orders/admin')
    ]);

    setData(analytics.data);
    setVendors(pending.data);
    setOrders(allOrders.data.orders || []);
    setMsg('');
  } catch (e) {
    setMsg(e.response?.data?.message || 'Could not load admin data');
  }
}

  useEffect(() => { loadData(); }, []);

  async function approveVendor(id) {
    try {
      await api.patch(`/vendors/${id}/status`, { status: 'approved' });
      setMsg('Vendor approved successfully!');
      await loadData();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Could not approve vendor');
    }
  }

  return (
    <section className="content-page">
      <span className="eyebrow">OPERATIONS</span>
      <h1>Admin analytics</h1>

      {data && (
        <div className="stats">
          {Object.entries(data).map(([key, value]) => (
            <div className="stat" key={key}>
              <span>{key.replace(/[A-Z]/g, m => ' ' + m).toUpperCase()}</span>
              <strong>{key === 'paidRevenue' ? `₹${value}` : value}</strong>
            </div>
          ))}
        </div>
      )}

      <h2>All Orders</h2>

{orders.length === 0 && (
  <p className="muted">No orders found.</p>
)}

{orders.map((order) => (
  <div className="cart-row" key={order._id}>
    <div>
      <strong>Order #{order._id.slice(-6)}</strong>
      <p>Status: {order.status}</p>
      <p>Payment: {order.paymentStatus}</p>
      <p>Total: ₹{order.total}</p>

      {order.items.map((item, index) => (
        <p key={item._id || index}>
          {item.name} × {item.quantity}
        </p>
      ))}
    </div>
  </div>
))}

      <h2>Pending vendor applications</h2>
      {vendors.length === 0 && <p className="muted">No pending vendor applications.</p>}

      {vendors.map(vendor => (
        <div className="cart-row" key={vendor._id}>
          <div><strong>{vendor.name}</strong><p>Application pending</p></div>
          <button className="primary" onClick={() => approveVendor(vendor._id)}>Approve</button>
        </div>
      ))}

      {msg && <div className="notice">{msg}</div>}
    </section>
  );
}
          
export default App;
