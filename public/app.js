(() => {
  const config = window.SHOP_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);
  let products = [];
  const cart = new Map();
  let activeFilter = 'tous';
  let whatsappNumber = config.whatsappNumber || '';
  let validNumber = /^\d{8,15}$/.test(whatsappNumber);
  const money = (value) => `${new Intl.NumberFormat('fr-FR').format(value)} ${config.currency || 'HTG'}`;
  const normalizedCategory = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  document.title = `${config.shopName || 'Bel Achat'} — Électronique & beauté`;
  let name = config.shopName || 'Bel Achat';
  function updateBrand() {
    document.title = `${name} — Téléphones, parfums & soins`;
    document.querySelectorAll('.brand span:last-child').forEach((el) => {
    const words = name.trim().split(/\s+/);
    el.textContent = '';
    el.append(document.createTextNode(`${words[0] || 'Bel'} `));
    const finalWord = document.createElement('b');
    finalWord.textContent = words.slice(1).join(' ') || 'Achat';
    el.append(finalWord);
    });
  }
  updateBrand();

  function makeProductCard(product) {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    const category = normalizedCategory(product.category);
    const type = normalizedCategory(product.type);
    const typeLabels = { telephone: 'TÉLÉPHONE PORTABLE', parfum: 'PARFUM', soin: 'SOIN DE BEAUTÉ' };
    card.dataset.category = category;
    const visual = document.createElement('div');
    visual.className = `catalog-visual ${category === 'beaute' ? 'visual-beauty' : 'visual-tech'}`;
    if (product.image) {
      const img = document.createElement('img');
      img.src = product.image;
      img.alt = product.name || 'Produit Bel Achat';
      visual.append(img);
    } else {
      const icon = document.createElement('span');
      icon.textContent = type === 'telephone' ? '▣' : type === 'soin' ? '◉' : category === 'beaute' ? '✳' : '▣';
      visual.append(icon);
    }
    const label = document.createElement('span');
    label.className = 'catalog-label';
    label.textContent = typeLabels[type] || (category === 'beaute' ? 'BEAUTÉ' : 'ÉLECTRONIQUE');
    visual.append(label);
    const info = document.createElement('div');
    info.className = 'catalog-info';
    const title = document.createElement('h3');
    title.textContent = product.name || 'Produit à nommer';
    const description = document.createElement('p');
    description.textContent = product.description || 'Contacte-nous pour obtenir les détails.';
    const footer = document.createElement('div');
    footer.className = 'catalog-card-footer';
    const price = document.createElement('strong');
    price.textContent = Number(product.priceHTG) > 0 ? money(Number(product.priceHTG)) : 'Prix à confirmer';
    const add = document.createElement('button');
    add.className = 'add-product';
    add.type = 'button';
    add.textContent = 'Ajouter +';
    add.setAttribute('aria-label', `Ajouter ${product.name || 'le produit'} au panier`);
    add.addEventListener('click', () => addToCart(product));
    footer.append(price, add);
    info.append(title, description, footer);
    card.append(visual, info);
    return card;
  }

  function renderProducts() {
    const grid = $('#product-grid');
    grid.replaceChildren();
    const visible = products.filter((product) => activeFilter === 'tous' || normalizedCategory(product.category) === activeFilter);
    visible.forEach((product) => grid.append(makeProductCard(product)));
    $('#catalog-empty').hidden = visible.length > 0;
    $('#result-count').textContent = visible.length ? `${visible.length} article${visible.length === 1 ? '' : 's'}` : '';
  }

  document.querySelectorAll('.filter-chip').forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter));
  });
  document.querySelectorAll('[data-category-link]').forEach((link) => {
    link.addEventListener('click', () => setFilter(link.dataset.categoryLink));
  });
  function setFilter(filter) {
    activeFilter = filter || 'tous';
    document.querySelectorAll('.filter-chip').forEach((button) => {
      const selected = button.dataset.filter === activeFilter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderProducts();
  }

  function updateContactButton() {
    $('#contact-button').disabled = !validNumber;
    $('#contact-button').innerHTML = validNumber ? 'Nous écrire sur WhatsApp <span>↗</span>' : 'WhatsApp à configurer <span>↗</span>';
  }
  $('#contact-button').addEventListener('click', () => {
    if (validNumber) openWhatsApp(`Bonjour ${name}, j’aimerais en savoir plus sur vos téléphones, parfums et soins de beauté.`);
  });
  updateContactButton();

  const panel = $('#cart-panel');
  const openCart = () => { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('show'); };
  const closeCart = () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); $('#scrim').classList.remove('show'); };
  $('#cart-trigger').addEventListener('click', openCart);
  $('#close-cart').addEventListener('click', closeCart);
  $('#continue-shopping').addEventListener('click', closeCart);
  $('#scrim').addEventListener('click', closeCart);
  $('#checkout').addEventListener('click', () => {
    const lines = [...cart.entries()].map(([id, quantity]) => {
      const product = products.find((item) => String(item.id) === id);
      return product ? `• ${product.name} × ${quantity} — ${Number(product.priceHTG) > 0 ? money(Number(product.priceHTG) * quantity) : 'prix à confirmer'}` : '';
    }).filter(Boolean);
    if (!validNumber || !cart.size || [...cart.keys()].some((id) => !(Number(products.find((item) => String(item.id) === id)?.priceHTG) > 0))) return;
    openWhatsApp(`Bonjour ${name}, je souhaite commander :\n${lines.join('\n')}\n\nPeux-tu confirmer la disponibilité et le coût de la livraison ?`);
  });
  function addToCart(product) {
    if (!product.id) return;
    const id = String(product.id);
    cart.set(id, (cart.get(id) || 0) + 1);
    updateCart();
    openCart();
  }
  function updateCart() {
    const items = $('#cart-items');
    items.replaceChildren();
    let count = 0;
    let total = 0;
    let allPriced = true;
    for (const [id, quantity] of cart.entries()) {
      const product = products.find((item) => String(item.id) === id);
      if (!product) continue;
      count += quantity;
      const price = Number(product.priceHTG);
      if (price > 0) total += price * quantity; else allPriced = false;
      const row = document.createElement('div');
      row.className = 'cart-line';
      const thumb = document.createElement('div');
      thumb.className = `cart-thumb ${normalizedCategory(product.category) === 'beaute' ? 'visual-beauty' : 'visual-tech'}`;
      const productType = normalizedCategory(product.type);
      thumb.textContent = productType === 'telephone' ? '▣' : productType === 'soin' ? '◉' : normalizedCategory(product.category) === 'beaute' ? '✳' : '▣';
      const text = document.createElement('div');
      text.className = 'cart-line-text';
      const title = document.createElement('strong'); title.textContent = product.name || 'Produit';
      const detail = document.createElement('small'); detail.textContent = `${quantity} × ${price > 0 ? money(price) : 'Prix à confirmer'}`;
      text.append(title, detail);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-cart-item'; remove.setAttribute('aria-label', `Retirer ${product.name || 'le produit'}`); remove.textContent = '×';
      remove.addEventListener('click', () => { cart.delete(id); updateCart(); });
      row.append(thumb, text, remove);
      items.append(row);
    }
    $('#cart-count').textContent = count;
    $('#cart-empty').hidden = count > 0;
    $('#cart-total-row').hidden = count === 0;
    $('#cart-total').textContent = allPriced ? money(total) : 'À confirmer';
    $('#checkout').disabled = !(validNumber && count > 0 && allPriced);
  }
  function openWhatsApp(message) {
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  async function loadStoreData() {
    try {
      const [productResponse, settingsResponse] = await Promise.all([
        fetch('/api/products', { cache: 'no-store' }),
        fetch('/api/settings', { cache: 'no-store' })
      ]);
      if (productResponse.ok) {
        const data = await productResponse.json();
        products = Array.isArray(data.products) ? data.products : [];
      }
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        name = settings.shopName || name;
        whatsappNumber = settings.whatsappNumber || '';
        validNumber = /^\d{8,15}$/.test(whatsappNumber);
        updateBrand();
        updateContactButton();
      }
    } catch {
      // Keep the shop shell visible if its catalogue service is temporarily unavailable.
    }
    renderProducts();
    updateCart();
  }
  renderProducts();
  updateCart();
  void loadStoreData();
})();
