const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const User = require('../models/userModel')
const rateLimit = require('express-rate-limit')
require('dotenv').config('./.env')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '嘗試次數過多，請稍後再試。',
  },
})

router.post('/signIn', limiter, async function (req, res, next) {
  try {
    let { email, password } = req.body
    if (!email || !password) {
      return res.send({
        success: false,
        message: '請填寫所有必填欄位',
      })
    }

    const isUser = await User.findOne({ email }).select('+password')

    if (!isUser) {
      return res.send({
        success: false,
        message: '請輸入正確的電子郵件或密碼',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(password, isUser.password)

    if (!isPasswordCorrect) {
      return res.send({
        success: false,
        message: '請輸入正確的電子郵件或密碼',
      })
    }

    const token = jwt.sign({ id: isUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    password = undefined

    res.send({
      success: true,
      message: '登入成功',
      token,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: '伺服器錯誤，請稍後再試。',
    })
  }
})

router.post('/signUp', async function (req, res, next) {
  try {
    let { name, email, password, confirmPassword } = req.body
    const isUsed = await User.findOne({ email })
    if (isUsed) {
      return res.send({
        success: false,
        message: '電子郵件已被使用。',
      })
    }
    if (!name || !email || !password || !confirmPassword) {
      return res.send({
        success: false,
        message: '請填寫所有必填欄位。',
      })
    }
    if (!validator.isEmail(email)) {
      return res.send({
        success: false,
        message: '電子郵件格式不正確。',
      })
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/

    if (!validator.isLength(password, { min: 8 }) || !regex.test(password)) {
      return res.send({
        success: false,
        message: '密碼必須至少包含一個大寫字母、一個小寫字母、一個數字，並且長度至少為8個字元。',
      })
    }

    if (password !== confirmPassword) {
      return res.send({
        success: false,
        message: '密碼與確認密碼不匹配。',
      })
    }

    password = await bcrypt.hash(password, 12)

    await User.create({
      name,
      email,
      password,
    })

    res.send({
      success: true,
      message: '註冊成功',
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({
      success: false,
      message: '伺服器錯誤，請稍後再試。',
    })
  }
})

module.exports = router
