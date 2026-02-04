const app = {
    state: {
        token: localStorage.getItem('access_token'),
        user: JSON.parse(localStorage.getItem('user')),
        currentPage: 'dashboard'
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
        this.render();
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

    render() {
        const main = document.getElementById('main-content');
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
                document.getElementById('login-form').onsubmit = (e) => {
                    e.preventDefault();
                    this.login(document.getElementById('username').value, document.getElementById('password').value);
                };
                break;
            case 'dashboard':
                main.innerHTML = `<h1>Dashboard</h1><p>Welcome back, ${this.state.user?.username}!</p>`;
                break;
            default:
                main.innerHTML = `<h1>${this.state.currentPage}</h1><p>Coming soon...</p>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
