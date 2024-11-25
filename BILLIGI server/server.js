const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config(); 
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// CORS 설정
const corsOptions = {
   origin: ['http://localhost:3000', 'http://www.billigi.p-e.kr', 'http://www.billigi.p-e.kr:8181'],
   credentials: true,
};
app.use(cors(corsOptions));

// 미들웨어 설정
app.use(bodyParser.json());
app.use(express.json());

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DB_URI || process.env.Login_DB_URI }),
  cookie: { secure: false }
}));

// MongoDB 연결
mongoose.connect(process.env.DB_URI || process.env.Login_DB_URI)
  .then(() => console.log('MongoDB Atlas에 연결되었습니다.'))
  .catch((err) => console.error('MongoDB 연결 실패:', err));

// User 모델 정의
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
});

const User = mongoose.model('User', UserSchema);

// Item 모델 정의
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: String, required: false },
  borrower: { type: String, required: false },
  status: { type: String, enum: ['available', 'borrowed'], required: true },
  type: { type: String, enum: ['borrowing', 'lending'], required: true },
}); 

const Item = mongoose.model('Item', ItemSchema);

// LostFound 모델 정의
const LostFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['lost', 'found'], required: true },
  date: { type: Date, default: Date.now },
  finder: { type: String, required: false },
  loser: { type: String, required: false },
});

const LostFound = mongoose.model('LostFound', LostFoundSchema);

function getClientIp(req) {
  const ip = req.ip || req.connection.remoteAddress;
  if (ip.startsWith('::ffff:')) {
    return ip.slice(7);
  }
  return ip;
}

// 회원가입 라우트
app.post('/auth/register', async (req, res) => {
  console.log(`${getClientIp(req)} 회원가입 요청:`, req.body);
  const { email, password, name, studentId } = req.body;

  try {
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name, studentId });

    // 새로운 사용자 저장
    await newUser.save();
    console.log(`${getClientIp(req)} 회원가입 성공: ${email}`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 11000) {
      console.log(`${getClientIp(req)} 회원가입 실패: 이메일 이미 존재 (${email})`);
      res.status(400).json({ error: 'Email already exists' });
    } else {
      console.log(`${getClientIp(req)} 회원가입 실패: ${error.message}`);
      res.status(500).json({ error: 'Error registering user' });
    }
  }
});

// 로그인 라우트
app.post('/auth/login', async (req, res) => {
  console.log(`${getClientIp(req)} 로그인 요청:`, req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`${getClientIp(req)} 로그인 실패: 사용자 없음 (${email})`);
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`${getClientIp(req)} 로그인 실패: 비밀번호 불일치 (${email})`);
      return res.status(400).json({ message: 'Invalid password' });
    }

    // 세션에 사용자 정보 저장
    req.session.userId = user._id;
    req.session.userName = user.name;

    console.log(`${getClientIp(req)} 로그인 성공: ${email}`);
    res.status(200).json({ message: 'Login successful', userName: user.name });
  } catch (error) {
    console.log(`${getClientIp(req)} 로그인 실패: ${error.message}`);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// 로그아웃 라우트
app.post('/auth/logout', (req, res) => {
  console.log(`${getClientIp(req)} 로그아웃 요청`);
  req.session.destroy((err) => {
    if (err) {
      console.log(`${getClientIp(req)} 로그아웃 실패: ${err.message}`);
      return res.status(500).json({ error: 'Error logging out' });
    }
    console.log(`${getClientIp(req)} 로그아웃 성공`);
    res.status(200).json({ message: 'Logout successful' });
  });
});

// 아이템 관련 라우트
app.get('/api/items', async (req, res) => {
  console.log(`${getClientIp(req)} 아이템 조회 요청`);
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/items', async (req, res) => {
  console.log(`${getClientIp(req)} 아이템 추가 요청:`, req.body);
  const { name, description, type, owner, borrower } = req.body;
  
  const newItem = new Item({
    name: name,
    description: description,
    type: type,
    status: 'available',
    owner: type === 'lending' ? owner : undefined,
    borrower: type === 'borrowing' ? borrower : undefined,
  });

  try {
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/items/:id', async (req, res) => {
  console.log(`${getClientIp(req)} 아이템 수정 요청 (ID: ${req.params.id}):`, req.body);
  try {
    const updateFields = { status: req.body.status };

    if (req.body.borrower) {
      updateFields.borrower = req.body.borrower;
    }
    if (req.body.owner) {
      updateFields.owner = req.body.owner;
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  console.log(`${getClientIp(req)} 아이템 삭제 요청 (ID: ${req.params.id})`);
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 분실물/습득물 관련 라우트
app.get('/api/lostfound', async (req, res) => {
  console.log(`${getClientIp(req)} 분실물/습득물 조회 요청`);
  try {
    const reports = await LostFound.find();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/lostfound', async (req, res) => {
  console.log(`${getClientIp(req)} 분실물/습득물 추가 요청:`, req.body);
  const newReport = new LostFound({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    finder: req.body.finder,
    loser: req.body.loser,
  });
  try {
    const savedReport = await newReport.save();
    res.json(savedReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/lostfound/:id', async (req, res) => {
  console.log(`${getClientIp(req)} 분실물/습득물 삭제 요청 (ID: ${req.params.id})`);
  try {
    const deletedReport = await LostFound.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 서버 시작
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`));