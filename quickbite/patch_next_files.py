import os

base = r"c:\Users\kisho\OneDrive\Desktop\quickbite\quickbite"

# 1. Update layout.js
layout_path = os.path.join(base, "src", "app", "layout.js")
with open(layout_path, "r", encoding="utf-8") as f:
    layout = f.read()

if "import { AuthProvider } from '@/context/AuthContext';" not in layout:
    layout = layout.replace("import { AppProvider } from '@/context/AppContext';", "import { AppProvider } from '@/context/AppContext';\nimport { AuthProvider } from '@/context/AuthContext';")
    layout = layout.replace("<AppProvider>", "<AuthProvider>\n          <AppProvider>")
    layout = layout.replace("</AppProvider>", "</AppProvider>\n        </AuthProvider>")

    with open(layout_path, "w", encoding="utf-8") as f:
        f.write(layout)

# 2. Update page.js
page_path = os.path.join(base, "src", "app", "page.js")
new_page = """'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import HomePage from '@/components/pages/HomePage';
import MenuPage from '@/components/pages/MenuPage';
import CartPage from '@/components/pages/CartPage';
import OrdersPage from '@/components/pages/OrdersPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import ProfilePage from '@/components/pages/ProfilePage';
import VendorDashboard from '@/components/pages/VendorDashboard';
import BudgetPage from '@/components/pages/BudgetPage';
import Toast from '@/components/Toast';

import LoginPage from '@/components/pages/LoginPage';
import RegisterPage from '@/components/pages/RegisterPage';
import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage';
import VendorChangePasswordPage from '@/components/pages/VendorChangePasswordPage';

export default function Page() {
  const { isLoggedIn, role, isLoading, mustChangePassword } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const navigate = (page, data) => {
    if (page === 'menu' && data) {
      setSelectedOutlet(data);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigate={navigate} />;
      case 'menu':
        return <MenuPage outlet={selectedOutlet} navigate={navigate} showToast={showToast} />;
      case 'cart':
        return <CartPage navigate={navigate} showToast={showToast} />;
      case 'orders':
        return <OrdersPage navigate={navigate} />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage navigate={navigate} />;
      case 'budget':
        return <BudgetPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <div className="spinner" style={{ borderColor: 'rgba(252, 128, 25, 0.2)', borderTopColor: '#FC8019', width: '40px', height: '40px', borderWidth: '4px' }}></div>
        <h2 style={{ color: '#FC8019', marginTop: '16px', fontWeight: 'bold' }}>QuickBite</h2>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (authPage === 'register') return <RegisterPage navigate={setAuthPage} />;
    if (authPage === 'forgot') return <ForgotPasswordPage navigate={setAuthPage} />;
    return <LoginPage navigate={setAuthPage} />;
  }

  if (isLoggedIn && role === 'vendor' && mustChangePassword) {
    return <VendorChangePasswordPage />;
  }

  if (isLoggedIn && role === 'vendor') {
    return <VendorDashboard showToast={showToast} />;
  }

  return (
    <>
      <Navbar currentPage={currentPage} navigate={navigate} />
      <main className="main-content">
        <div className="page-enter">
          {renderPage()}
        </div>
      </main>
      {role === 'student' && <MobileNav currentPage={currentPage} navigate={navigate} />}
      <Toast toasts={toasts} />
    </>
  );
}
"""
with open(page_path, "w", encoding="utf-8") as f:
    f.write(new_page)

# 3. Append to globals.css
css_path = os.path.join(base, "src", "app", "globals.css")
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

new_css = """
.auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg); }
.auth-card { background: var(--bg-white); border-radius: var(--radius-lg); padding: 32px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); }
.auth-logo { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 28px; font-size: 1.4rem; font-weight: 700; color: var(--primary); }
.auth-title { font-size: 1.3rem; font-weight: 700; margin-bottom: 6px; text-align: center; }
.auth-subtitle { color: var(--text-secondary); font-size: 0.85rem; text-align: center; margin-bottom: 24px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
.form-input { width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 0.9rem; background: var(--bg-white); color: var(--text); outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: var(--primary); }
.form-input.error { border-color: var(--red); }
.input-wrapper { position: relative; }
.input-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1rem; }
.error-box { background: var(--red-bg); color: var(--red); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }
.success-box { background: var(--green-bg); color: var(--green); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 0.82rem; margin-bottom: 14px; }
.auth-link { color: var(--primary); font-weight: 600; cursor: pointer; background: none; border: none; font-size: inherit; }
.auth-divider { text-align: center; color: var(--text-muted); font-size: 0.82rem; margin: 16px 0; }
.otp-inputs { display: flex; gap: 8px; justify-content: center; margin: 20px 0; }
.otp-input { width: 44px; height: 52px; border: 2px solid var(--border); border-radius: var(--radius); text-align: center; font-size: 1.3rem; font-weight: 700; color: var(--text); outline: none; transition: border-color 0.2s; }
.otp-input:focus { border-color: var(--primary); }
.password-strength { height: 4px; border-radius: 2px; margin-top: 6px; transition: all 0.3s; }
.field-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
.field-error { font-size: 0.75rem; color: var(--red); margin-top: 4px; }
.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
"""
if ".auth-container" not in css_content:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write(new_css)
print("Updated structural config correctly.")
