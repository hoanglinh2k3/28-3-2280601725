require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const usersImportRouter = require('./routes/usersImport');
const rolesRouter = require('./routes/roles');
const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const uploadRouter = require('./routes/upload');
const messagesRouter = require('./routes/messages'); // thêm dòng này

const app = express();

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/NNPTUD-C4')
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/users', usersImportRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/messages', messagesRouter); // thêm dòng này

// catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler trả JSON
app.use(function (err, req, res, next) {
  console.error('ERROR:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;