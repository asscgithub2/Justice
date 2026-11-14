const KEY = 'hatake-yori-michi-products';
const CART_KEY = 'hatake-yori-michi-cart';

function readProducts() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
}
function saveProducts(products) {
  localStorage.setItem(KEY, JSON.stringify(products));
}
function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function esc(v) {
  return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 出品者フォーム＆出品管理処理
const form = document.getElementById('product-form');
const sellerList = document.getElementById('seller-product-list');

function renderSellerProducts() {
  if (!sellerList) return;
  const all = readProducts();
  if (!all.length) {
    sellerList.innerHTML = '<p class="manage-empty">বর্তমানে বিক্রয়ের জন্য কোনো পণ্য তালিকাভুক্ত নেই।</p>';
    return;
  }

  sellerList.innerHTML = all.map(p => {
    const isPreorder = p.saleType === 'preorder';
    const badgeHtml = isPreorder
      ? '<span class="badge preorder">📅প্রি-অর্ডার </span>'
      : '<span class="badge now">🌱 এখনই কেনার জন্য উপলব্ধ</span>';
    const dateLabel = isPreorder ? 'নির্ধারিত তারিখ' : 'শুরুর তারিখ';

    return `
      <div class="manage-item">
        <div class="manage-info">
          <div class="manage-title">
            ${badgeHtml}
            <strong>${esc(p.crop)}</strong>
          </div>
          <p class="manage-meta">
            ¥${Number(p.price).toLocaleString('ja-JP')} ／ ${dateLabel}：${esc(p.startDate)}
          </p>
        </div>
        <button type="button" class="btn-delete" data-id="${p.id}">মুছে ফেলুন</button>
      </div>
    `;
  }).join('');
}

if (form) {
  const date = form.elements.startDate;
  const now = new Date();
  date.min = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const dateLabel = document.getElementById('date-label-text');
  form.querySelectorAll('input[name="saleType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (dateLabel) {
        dateLabel.textContent = radio.value === 'preorder' ? 'চালান/ফসল তোলার সময়সূচী' : 'ফসল কাটার দিন';
      }
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const fd = new FormData(form);
    const saleType = fd.get('saleType') || 'now';
    const item = {
      id: Date.now(),
      saleType: saleType,
      crop: String(fd.get('crop')).trim(),
      startDate: fd.get('startDate'),
      price: Number(fd.get('price')),
      memo: String(fd.get('memo') || '').trim()
    };
    const all = readProducts();
    all.unshift(item);
    saveProducts(all);
    alert(saleType === 'preorder'
      ? 'আমি তালিকাটিকে একটি প্রি-অর্ডার আইটেম হিসেবে নিবন্ধন করেছি।'
      : 'আমি আপনার তালিকাভুক্তির তথ্য নিবন্ধন করেছি। এটি এখন ক্রেতাদের জন্য পণ্যের তালিকায় প্রদর্শিত হবে।');
    location.href = 'buyer.html';
  });
}

if (sellerList) {
  sellerList.addEventListener('click', e => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const target = readProducts().find(p => p.id === id);
    if (!target) return;

    if (!confirm(`「${target.crop}」আপনি কি এটি মুছে ফেলতে চান?\n（এটি ক্রেতার পণ্যের তালিকা থেকেও সরিয়ে দেওয়া হবে।）`)) {
      return;
    }

    // 商品一覧から削除
    const updatedProducts = readProducts().filter(p => p.id !== id);
    saveProducts(updatedProducts);

    // カート内に同じ商品が入っていた場合も削除
    const updatedCart = readCart().filter(item => item.id !== id);
    saveCart(updatedCart);

    renderSellerProducts();
  });

  renderSellerProducts();
}

// 購入者ページ（商品一覧＆カート処理）
const list = document.getElementById('product-list');
if (list) {
  const all = readProducts();
  if (!all.length) {
    list.innerHTML = '<div class="empty"><strong>এখনো কোনো পণ্য নিবন্ধিত হয়নি।</strong>যখন কোনো বিক্রেতা তাদের ফসল নিবন্ধন করবেন, তখন সেগুলো এখানে প্রদর্শিত হবে।</div>';
  } else {
    list.innerHTML = all.map(p => {
      const isPreorder = p.saleType === 'preorder';
      const badgeHtml = isPreorder
        ? '<span class="badge preorder">📅 প্রি-অর্ডার</span>'
        : '<span class="badge now">🌱 অবিলম্বে ক্রয়ের জন্য উপলব্ধ</span>';
      const dateText = isPreorder ? `প্রেরণ/ফসল তোলার তারিখ：${esc(p.startDate)}` : `ফসল কাটার দিন：${esc(p.startDate)}`;
      const btnText = isPreorder ? 'সংরক্ষণ' : 'ক্রয়';

      return `
        <article class="product">
          <div class="photo">🌿</div>
          <div class="info">
            <div class="card-top">
              ${badgeHtml}
            </div>
            <h3>${esc(p.crop)}</h3>
            <p class="memo">${esc(p.memo || '')}</p>
            <p class="date">${dateText}</p>
            <div class="price-row">
              <div class="price">¥${Number(p.price).toLocaleString('ja-JP')}</div>
              <button type="button" class="btn buy-btn ${isPreorder ? 'preorder-btn' : ''}" data-id="${p.id}">${btnText}</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  const cartCountEl = document.getElementById('cart-count');
  const cartModal = document.getElementById('cart-modal');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');

  function renderCart() {
    const cart = readCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (cartCountEl) cartCountEl.textContent = totalCount;
    if (cartTotalEl) cartTotalEl.textContent = `¥${totalPrice.toLocaleString('ja-JP')}`;
    if (!cartItemsEl) return;

    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="cart-empty">আপনার কার্টে কোনো আইটেম নেই।</p>';
      return;
    }

    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${item.saleType === 'preorder' ? '【সংরক্ষণ】' : ''}${esc(item.crop)}</strong>
          <span>¥${Number(item.price).toLocaleString('ja-JP')} × ${item.qty}টুকরো</span>
        </div>
        <div class="cart-item-ctrl">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}">＋</button>
          <button type="button" class="del-btn" data-action="del" data-id="${item.id}">মুছে ফেলুন</button>
        </div>
      </div>
    `).join('');
  }

  list.addEventListener('click', e => {
    const btn = e.target.closest('.buy-btn');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const product = readProducts().find(p => p.id === id);
    if (!product) return;

    const cart = readCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        crop: product.crop,
        price: Number(product.price),
        saleType: product.saleType || 'now',
        qty: 1
      });
    }
    saveCart(cart);
    renderCart();

    const originalText = btn.textContent;
    btn.textContent = 'যোগ করা হয়েছে';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 800);
  });

  cartItemsEl?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    let cart = readCart();
    const index = cart.findIndex(item => item.id === id);
    if (index === -1) return;

    if (action === 'inc') cart[index].qty += 1;
    if (action === 'dec') {
      cart[index].qty -= 1;
      if (cart[index].qty <= 0) cart.splice(index, 1);
    }
    if (action === 'del') cart.splice(index, 1);

    saveCart(cart);
    renderCart();
  });

  document.getElementById('open-cart')?.addEventListener('click', () => {
    renderCart();
    cartModal.hidden = false;
  });
  document.getElementById('close-cart')?.addEventListener('click', () => { cartModal.hidden = true; });
  document.getElementById('close-cart-bg')?.addEventListener('click', () => { cartModal.hidden = true; });

  document.getElementById('clear-cart')?.addEventListener('click', () => {
    saveCart([]);
    renderCart();
  });

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    const cart = readCart();
    if (!cart.length) {
      alert('আপনার কার্টে কোনো আইটেম নেই।');
      return;
    }
    alert('আপনার অর্ডারের জন্য ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে।');
    saveCart([]);
    renderCart();
    cartModal.hidden = true;
  });

  renderCart();
}