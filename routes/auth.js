const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        res.status(400).json({ error: '회원가입 실패', message: error.message });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        // HS256 알고리즘을 사용하여 토큰 생성
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h', algorithm: 'HS256' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: '로그인 실패', error: error.message });
    }
});

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: '토큰이 없습니다.' });

    // 토큰 검증 시에도 알고리즘을 명시적으로 설정할 수 있습니다.
    jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, user) => {
        if (err) return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        req.user = user;
        next();
    });
};

module.exports = { router, authenticateToken };