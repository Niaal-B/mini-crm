const app = {
    state: {
        token: localStorage.getItem('access_token'),
        user: JSON.parse(localStorage.getItem('user')),
        currentPage: 'dashboard',
        organizations: [],
        contacts: [],
        products: [],
        orders: [],
    },

    init() {
        console.log('App initialization...');
        this.renderNav();
        if (!this.state.token) {
            this.navigate('login');
        } else {
            this.navigate('dashboard');
        }
    },

    navigate(page) {
        this.state.currentPage = page;
        if (page === 'organizations') this.loadOrganizations();
        else if (page === 'contacts') {
            this.api('/api/organizations/').then(res => res.json()).then(data => {
                this.state.organizations = data;
                this.loadContacts();
            });
        }
        else if (page === 'products') this.loadProducts();
        else if (page === 'orders') this.loadOrders();
        else this.render();
    },

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                this.state.token = data.access;
                this.state.user = data.user;
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.renderNav();
                this.navigate('dashboard');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            const errorEl = document.getElementById('login-error');
            if (errorEl) {
                errorEl.textContent = error.message;
                errorEl.style.display = 'block';
            }
        }
    },

    logout() {
        localStorage.clear();
        this.state.token = null;
        this.state.user = null;
        this.renderNav();
        this.navigate('login');
    },

    renderNav() {
        const navLinks = document.getElementById('nav-links');
        if (this.state.token) {
            navLinks.innerHTML = `
                <a onclick="app.navigate('dashboard')">Dashboard</a>
                <a onclick="app.navigate('organizations')">Organizations</a>
                <a onclick="app.navigate('contacts')">Contacts</a>
                <a onclick="app.navigate('products')">Products</a>
                <a onclick="app.navigate('orders')">Orders</a>
                <a onclick="app.logout()">Logout (${this.state.user.username})</a>
            `;
        } else {
            navLinks.innerHTML = `<a onclick="app.navigate('login')">Login</a>`;
        }
    },

    async api(url, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(url, options);
        if (response.status === 401 && this.state.token) {
            this.logout();
            return;
        }
        return response;
    },

    async loadOrganizations() {
        const res = await this.api('/api/organizations/');
        if (res && res.ok) {
            this.state.organizations = await res.json();
            this.render();
        }
    },

    async loadContacts() {
        const res = await this.api('/api/contacts/');
        if (res && res.ok) {
            this.state.contacts = await res.json();
            this.render();
        }
    },

    async createOrganization(data) {
        const res = await this.api('/api/organizations/', 'POST', data);
        if (res && res.ok) {
            this.navigate('organizations');
        }
    },

    async createContact(data) {
        const res = await this.api('/api/contacts/', 'POST', data);
        if (res && res.ok) {
            this.navigate('contacts');
        }
    },

    async loadProducts() {
        const res = await this.api('/api/products/');
        if (res && res.ok) {
            this.state.products = await res.json();
            this.render();
        }
    },

    async createProduct(data, sizes) {
        const res = await this.api('/api/products/', 'POST', data);
        if (res && res.ok) {
            const product = await res.json();
            for (const size of sizes) {
                await this.api(`/api/products/${product.id}/sizes/`, 'POST', size);
            }
            this.navigate('products');
        }
    },

    async loadOrders() {
        const res = await this.api('/api/orders/');
        if (res && res.ok) {
            this.state.orders = await res.json();
            this.render();
        }
    },

    async createOrder(data) {
        const res = await this.api('/api/orders/', 'POST', data);
        if (res && res.ok) {
            const order = await res.json();
            this.showOrderSummary(order);
        }
    },

    showOrderSummary(order) {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card">
                <h2>Order Created: ${order.order_no}</h2>
                <table class="table" style="margin: 1rem 0;">
                    <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>${order.items.map(i => `<tr><td>${i.product_name}</td><td>$${i.unit_price}</td><td>${i.qty}</td><td>$${i.line_total}</td></tr>`).join('')}</tbody>
                </table>
                <h3 style="text-align:right">Grand Total: $${order.order_total}</h3>
                <div class="flex-end" style="margin-top:2rem">
                    <button class="btn btn-primary" style="width:auto" onclick="app.navigate('orders')">Back to Orders</button>
                </div>
            </div>
        `;
    },

    render() {
        const main = document.getElementById('main-content');
        if (!main) return;

        switch (this.state.currentPage) {
            case 'login':
                main.innerHTML = `
                    <div class="auth-card">
                        <h2>Login</h2>
                        <div id="login-error" class="error-message"></div>
                        <form id="login-form">
                            <div class="form-group">
                                <label>Username</label>
                                <input type="text" id="username" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" id="password" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </form>
                    </div>
                `;
                const loginForm = document.getElementById('login-form');
                if (loginForm) {
                    loginForm.onsubmit = (e) => {
                        e.preventDefault();
                        this.login(document.getElementById('username').value, document.getElementById('password').value);
                    };
                }
                break;
            case 'dashboard':
                main.innerHTML = `<h1>Dashboard</h1><p>Welcome back, ${this.state.user?.username}!</p>`;
                break;
            case 'organizations':
                main.innerHTML = `
                    <div class="flex-between">
                        <h1>Organizations</h1>
                        <button class="btn btn-primary" style="width: auto;" onclick="app.showOrgForm()">Add Organization</button>
                    </div>
                    <div id="org-list">
                        <table class="table">
                            <thead><tr><th>Name</th><th>GST No</th><th>Address</th></tr></thead>
                            <tbody>${this.state.organizations.map(o => `<tr><td>${o.name}</td><td>${o.gst_no || '-'}</td><td>${o.address || '-'}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                `;
                break;
            case 'contacts':
                main.innerHTML = `
                    <div class="flex-between">
                        <h1>Contacts</h1>
                        <button class="btn btn-primary" style="width: auto;" onclick="app.showContactForm()">Add Contact</button>
                    </div>
                    <div id="contact-list">
                        <table class="table">
                            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Organization</th></tr></thead>
                            <tbody>${this.state.contacts.map(c => `<tr><td>${c.first_name} ${c.last_name}</td><td>${c.email}</td><td>${c.phone}</td><td>${c.organization_name}</td></tr>`).join('')}</tbody>
                        </table>
                    </div>
                `;
                break;
            case 'products':
                main.innerHTML = `
                    <div class="flex-between">
                        <h1>Products</h1>
                        <button class="btn btn-primary" style="width: auto;" onclick="app.showProductForm()">Add Product</button>
                    </div>
                    <div id="product-list">
                        <table class="table">
                            <thead><tr><th>Name</th><th>SKU</th><th>Base Price</th><th>Offer %</th><th>Sizes</th></tr></thead>
                            <tbody>${this.state.products.map(p => `
                                <tr>
                                    <td>${p.name}</td>
                                    <td>${p.sku}</td>
                                    <td>$${p.base_price}</td>
                                    <td>${p.offer_percent}%</td>
                                    <td>${p.sizes.map(s => `${s.size_name}: $${s.price}`).join(', ') || '-'}</td>
                                </tr>
                            `).join('')}</tbody>
                        </table>
                    </div>
                `;
                break;
            case 'orders':
                main.innerHTML = `
                    <div class="flex-between">
                        <h1>Orders</h1>
                        <button class="btn btn-primary" style="width: auto;" onclick="app.showOrderForm()">Create Order</button>
                    </div>
                    <div id="order-list">
                        <table class="table">
                            <thead><tr><th>Order No</th><th>Contact</th><th>Date</th></tr></thead>
                            <tbody>${this.state.orders.map(o => `
                                <tr style="cursor:pointer" onclick="app.loadOrderDetail(${o.id})">
                                    <td>${o.order_no}</td>
                                    <td>${o.contact_name}</td>
                                    <td>${new Date(o.created_at).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}</tbody>
                        </table>
                    </div>
                `;
                break;
            default:
                main.innerHTML = `<h1>${this.state.currentPage}</h1><p>Coming soon...</p>`;
        }
    },

    async loadOrderDetail(id) {
        const res = await this.api(`/api/orders/${id}/`);
        if (res && res.ok) {
            const order = await res.json();
            const main = document.getElementById('main-content');
            main.innerHTML = `
                <div class="card">
                    <h2>Order Details: ${order.order_no}</h2>
                    <p><strong>Contact:</strong> ${order.contact_name}</p>
                    <table class="table" style="margin: 1rem 0;">
                        <thead><tr><th>Product</th><th>Size</th><th>Price</th><th>Qty</th><th>Total</th></tr></thead>
                        <tbody>${order.items.map(i => `<tr><td>${i.product_name}</td><td>${i.size_name}</td><td>$${i.unit_price}</td><td>${i.qty}</td><td>$${i.line_total}</td></tr>`).join('')}</tbody>
                    </table>
                    <div class="flex-end">
                        <button class="btn btn-primary" style="width:auto" onclick="app.navigate('orders')">Back</button>
                    </div>
                </div>
            `;
        }
    },

    async showOrderForm() {
        const main = document.getElementById('main-content');
        // Load dependencies
        const [orgsRes, prodRes] = await Promise.all([this.api('/api/organizations/'), this.api('/api/products/')]);
        const organizations = await orgsRes.json();
        const products = await prodRes.json();
        this.state.products = products;

        main.innerHTML = `
            <div class="card">
                <h2>Create Order</h2>
                <form id="order-form">
                    <div class="form-group">
                        <label>Select Contact</label>
                        <select id="o-contact" class="form-control" required>
                            <option value="">Select Contact</option>
                        </select>
                    </div>

                    <div style="margin-top: 2rem;">
                        <span style="font-weight:600">Line Items</span>
                        <div id="item-rows" style="margin-top:0.5rem"></div>
                        <button type="button" class="btn" style="background:#f1f5f9; padding:0.5rem 1rem; margin-top:0.5rem" onclick="app.addItemRow()">+ Add Item</button>
                    </div>

                    <div id="order-summary" style="margin-top:2rem; text-align:right">
                        <h3>Total: $0.00</h3>
                    </div>

                    <div class="flex-end">
                        <button type="button" class="btn" style="background:#ccc" onclick="app.navigate('orders')">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="width:auto">Place Order</button>
                    </div>
                </form>
            </div>
        `;

        // Populate contacts
        this.api('/api/contacts/').then(res => res.json()).then(contacts => {
            const select = document.getElementById('o-contact');
            contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.first_name} ${c.last_name}`;
                select.appendChild(opt);
            });
        });

        this.addItemRow();
        document.getElementById('order-form').onsubmit = (e) => {
            e.preventDefault();
            const rows = document.querySelectorAll('.item-row');
            const items = Array.from(rows).map(row => ({
                product_id: parseInt(row.querySelector('.i-prod').value),
                size_name: row.querySelector('.i-size').value,
                qty: parseInt(row.querySelector('.i-qty').value),
                customization: row.querySelector('.i-cust').value
            })).filter(i => i.product_id && i.size_name);

            this.createOrder({
                contact: parseInt(document.getElementById('o-contact').value),
                items: items
            });
        };
    },

    addItemRow() {
        const container = document.getElementById('item-rows');
        const row = document.createElement('div');
        row.className = 'card item-row';
        row.style.padding = '1rem';
        row.style.marginBottom = '1rem';
        row.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Product</label>
                    <select class="form-control i-prod" required onchange="app.onOrderProductChange(this)">
                        <option value="">Select Product</option>
                        ${this.state.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Size</label>
                    <select class="form-control i-size" required onchange="app.updateOrderTotal()">
                        <option value="">Select Size</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" class="form-control i-qty" value="1" min="1" required onchange="app.updateOrderTotal()">
                </div>
                <div class="form-group">
                    <label>Customization</label>
                    <input type="text" class="form-control i-cust">
                </div>
            </div>
            <div class="flex-between" style="margin-bottom:0">
                <span class="item-price-info" style="font-size:0.875rem; color:var(--text-muted)"></span>
                <button type="button" class="btn" style="background:#fee2e2; color:#ef4444; padding:0.5rem" onclick="this.parentElement.parentElement.remove(); app.updateOrderTotal()">Remove</button>
            </div>
        `;
        container.appendChild(row);
    },

    onOrderProductChange(select) {
        const row = select.parentElement.parentElement.parentElement;
        const productId = select.value;
        const sizeSelect = row.querySelector('.i-size');
        sizeSelect.innerHTML = '<option value="">Select Size</option>';

        if (productId) {
            const product = this.state.products.find(p => p.id == productId);
            if (product) {
                // Add sizes
                product.sizes.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.size_name;
                    opt.dataset.price = s.price;
                    opt.textContent = `${s.size_name} ($${s.price})`;
                    sizeSelect.appendChild(opt);
                });
                // Add base price option as fallback
                const opt = document.createElement('option');
                opt.value = "Default";
                opt.dataset.price = product.base_price;
                opt.textContent = `Default ($${product.base_price})`;
                sizeSelect.appendChild(opt);
            }
        }
        this.updateOrderTotal();
    },

    updateOrderTotal() {
        let total = 0;
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(row => {
            const prodId = row.querySelector('.i-prod').value;
            const sizeSelect = row.querySelector('.i-size');
            const qty = parseInt(row.querySelector('.i-qty').value) || 0;
            const priceInfo = row.querySelector('.item-price-info');

            if (prodId && sizeSelect.value) {
                const product = this.state.products.find(p => p.id == prodId);
                const sizeOpt = sizeSelect.options[sizeSelect.selectedIndex];
                let price = parseFloat(sizeOpt.dataset.price);

                if (product && product.offer_percent > 0) {
                    price = price * (1 - product.offer_percent / 100);
                }

                total += price * qty;
                priceInfo.textContent = `Unit Price: $${price.toFixed(2)} (Subtotal: $${(price * qty).toFixed(2)})`;
            } else {
                priceInfo.textContent = '';
            }
        });
        const summary = document.getElementById('order-summary');
        if (summary) summary.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;
    },

    showOrgForm() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card">
                <h2>Create Organization</h2>
                <form id="org-form">
                    <div class="form-group"><label>Name</label><input type="text" id="org-name" class="form-control" required></div>
                    <div class="form-group"><label>Address</label><textarea id="org-address" class="form-control"></textarea></div>
                    <div class="form-group"><label>GST No</label><input type="text" id="org-gst" class="form-control"></div>
                    <div class="flex-end">
                        <button type="button" class="btn" onclick="app.navigate('organizations')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('org-form').onsubmit = (e) => {
            e.preventDefault();
            this.createOrganization({
                name: document.getElementById('org-name').value,
                address: document.getElementById('org-address').value,
                gst_no: document.getElementById('org-gst').value
            });
        };
    },

    showContactForm() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card">
                <h2>Create Contact</h2>
                <form id="contact-form">
                    <div class="form-row">
                        <div class="form-group"><label>First Name</label><input type="text" id="c-fname" class="form-control" required></div>
                        <div class="form-group"><label>Last Name</label><input type="text" id="c-lname" class="form-control" required></div>
                    </div>
                    <div class="form-group"><label>Email</label><input type="email" id="c-email" class="form-control" required></div>
                    <div class="form-group"><label>Phone</label><input type="text" id="c-phone" class="form-control" required></div>
                    <div class="form-group">
                        <label>Organization</label>
                        <select id="c-org" class="form-control" required>
                            <option value="">Select Organization</option>
                            ${this.state.organizations.map(o => `<option value="${o.id}">${o.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex-end">
                        <button type="button" class="btn" onclick="app.navigate('contacts')">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('contact-form').onsubmit = (e) => {
            e.preventDefault();
            this.createContact({
                first_name: document.getElementById('c-fname').value,
                last_name: document.getElementById('c-lname').value,
                email: document.getElementById('c-email').value,
                phone: document.getElementById('c-phone').value,
                organization: document.getElementById('c-org').value
            });
        };
    },

    showProductForm() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="card">
                <h2>Create Product</h2>
                <form id="product-form">
                    <div class="form-row">
                        <div class="form-group"><label>Name</label><input type="text" id="p-name" class="form-control" required></div>
                        <div class="form-group"><label>SKU</label><input type="text" id="p-sku" class="form-control" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Base Price</label><input type="number" step="0.01" id="p-price" class="form-control" required></div>
                        <div class="form-group"><label>Offer Percent</label><input type="number" id="p-offer" class="form-control" value="0"></div>
                    </div>
                    
                    <div style="margin-top: 1.5rem;">
                        <span style="font-weight:600">Size Prices</span>
                        <div id="size-rows" style="margin-top:0.5rem"></div>
                        <button type="button" class="btn" style="background:#f1f5f9; padding:0.5rem 1rem; margin-top:0.5rem" onclick="app.addSizeRow()">+ Add Size</button>
                    </div>

                    <div class="flex-end">
                        <button type="button" class="btn" style="background:#ccc" onclick="app.navigate('products')">Cancel</button>
                        <button type="submit" class="btn btn-primary" style="width:auto">Save Product</button>
                    </div>
                </form>
            </div>
        `;
        this.addSizeRow();
        document.getElementById('product-form').onsubmit = (e) => {
            e.preventDefault();
            const sizeRows = document.querySelectorAll('.size-row');
            const sizes = Array.from(sizeRows).map(row => ({
                size_name: row.querySelector('.s-name').value,
                price: row.querySelector('.s-price').value
            })).filter(s => s.size_name && s.price);

            this.createProduct({
                name: document.getElementById('p-name').value,
                sku: document.getElementById('p-sku').value,
                base_price: document.getElementById('p-price').value,
                offer_percent: document.getElementById('p-offer').value
            }, sizes);
        };
    },

    addSizeRow() {
        const container = document.getElementById('size-rows');
        const row = document.createElement('div');
        row.className = 'form-row size-row';
        row.style.marginBottom = '0.5rem';
        row.innerHTML = `
            <input type="text" placeholder="Size (e.g. S, M, L)" class="form-control s-name" required>
            <div style="display:flex; gap:0.5rem">
                <input type="number" step="0.01" placeholder="Price" class="form-control s-price" required>
                <button type="button" class="btn" style="background:#fee2e2; color:#ef4444; padding:0 0.75rem" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        container.appendChild(row);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
