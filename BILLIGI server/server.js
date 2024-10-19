const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // .env 파일 로드
// 앱 생성
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());

// MongoDB 연결
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('MongoDB Atlas에 연결되었습니다.'))
  .catch((err) => console.error('MongoDB 연결 실패:', err));

// Item 모델 정의
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: {type: String, required: true},
  borrower: {type:String, required: false},
  status: { type: String, enum: ['available', 'borrowed'], default: 'available' },
});

const Item = mongoose.model('Item', ItemSchema);

// LostFound 모델 정의
const LostFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['lost', 'found'], required: true },
  date: { type: Date, default: Date.now },
  // reporter 필드 제거
});

const LostFound = mongoose.model('LostFound', LostFoundSchema);

// 아이템 관련 라우트
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  const newItem = new Item({
    name: req.body.name,
    description: req.body.description,
    owner: req.body.owner,
    borrower: req.body.borrower,
    status: req.body.status || 'available',
  });
  try {
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 분실물/습득물 관련 라우트
app.get('/api/lostfound', async (req, res) => {
  try {
    const reports = await LostFound.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lostfound', async (req, res) => {
  const newReport = new LostFound({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
  });
  try {
    const savedReport = await newReport.save();
    res.json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));
