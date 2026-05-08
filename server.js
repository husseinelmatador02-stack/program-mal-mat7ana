const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'mat7ana-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // غيرها لـ true لما نستخدم HTTPS
}));

// كلمة السر (غيرها لكلمة سر قوية)
const PASSWORD = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // هذا hash لكلمة "123456"

// الصفحة الرئيسية (Login)
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/dashboard');
  } else {
    res.render('login');
  }
});

// تسجيل الدخول
app.post('/login', async (req, res) => {
  const { password } = req.body;
  
  const isMatch = await bcrypt.compare(password, PASSWORD);
  
  if (isMatch) {
    req.session.loggedIn = true;
    res.redirect('/dashboard');
  } else {
    res.send('كلمة السر خاطئة! <a href="/">العودة</a>');
  }
});

// لوحة التحكم (البرنامج الرئيسي)
app.get('/dashboard', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/');
  }
  res.render('dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 البرنامج شغال على: http://localhost:${PORT}`);
});
