// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';

const API_URL = "http://www.billigi.p-e.kr:5000";

const client = axios.create({
});

const Main = () => {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-10 bg-gray-100">
      <div className="titleWrap mb-6">
        <h1 className="text-3xl font-bold">환영합니다!</h1>
        <p className="text-lg">여기에서 물건을 빌리고, 빌려줄 수 있고 분실물/습득물을 신고할 수 있습니다.</p>
      </div>
      <div className="contentWrap">
        <Link to="/login" className="button bg-blue-500 text-white px-4 py-2 rounded mr-4">로그인</Link>
        <Link to="/register" className="button bg-blue-500 text-white px-4 py-2 rounded">회원가입</Link>
      </div>
    </div>
  );
};

// ItemList 컴포넌트
const ItemList = ({ userName }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', type: 'lending' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await client.get(`${API_URL}/api/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const itemWithOwner = { 
      ...newItem, 
      ...(newItem.type === 'lending' ? { owner: userName } : { borrower: userName }) 
    };
    try {
      await client.post(`${API_URL}/api/items`, itemWithOwner);
      setNewItem({ name: '', description: '', type: 'lending' });
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleBorrow = async (e, item) => {
    e.preventDefault();

    const updatedItem = {
      status: item.type === 'lending' ? 'lent' : 'borrowed',
      borrower: item.type === 'lending' ? userName : undefined,
      owner: item.type === 'borrowing' ? userName : undefined,
    };

    try {
      await client.patch(`${API_URL}/api/items/${item._id}`, updatedItem);
      fetchItems();
    } catch (error) {
      console.error('Error borrowing item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await client.delete(`${API_URL}/api/items/${itemId}`);
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* 물품 등록 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <h2 className="text-2xl font-bold mb-4">분실물/습득물</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="물품명"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="설명"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <select
            value={newItem.type}
            onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="lending">빌려주기</option>
            <option value="borrowing">빌리기 요청</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          물품 등록
        </button>
      </form>

      {/* 물품 목록 */}
      <h2 className="text-2xl font-bold mb-4">물품 목록</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item._id} className="border p-4 rounded shadow">
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-blue-500">
              {item.type === 'lending' ? '빌려주기' : '빌리기'}
            </p>
            <p className="text-gray-400">임대인: {item.owner}</p>
            <p className="text-gray-400">임차인: {item.borrower}</p>
            <p>{item.description}</p>
            <p className="mt-2">
              상태: <span className={`${item.status === 'available' ? 'text-blue-500' : 'text-red-500'} font-bold`}>
                {item.type === 'lending' && (item.status === 'available' ? '대여 가능' : '대여 중')}
                {item.type === 'borrowing' && (item.status === 'available' ? '대여 요청 중' : '대여 중')}
              </span>
            </p>

            {item.owner === userName || item.borrower === userName ? (
              <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:text-red-700 mt-2">
                삭제
              </button>
            ) : (
              item.type === 'lending' && item.status === 'available' ? (
                <form onSubmit={(e) => handleBorrow(e, item)}>
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-3">
                    빌리기
                  </button>
                </form>
              ) : (
              <form onSubmit={(e) => handleBorrow(e, item)}>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-3">
                빌려주기
                </button>
              </form>)
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// LostFound 컴포넌트
const LostFound = ({ userName }) => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    status: 'lost',
    finder: '',
    loser: '',
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await client.get(`${API_URL}/api/lostfound`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const reportWithUser = {
      ...newReport,
      finder: newReport.status === 'found' ? userName : '',
      loser: newReport.status === 'lost' ? userName : '',
    };
    try {
      await client.post(`${API_URL}/api/lostfound`, reportWithUser);
      setNewReport({ title: '', description: '', status: '', finder: '', loser: '' });
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`${API_URL}/api/lostfound/${id}`);
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">분실물/습득물</h2>

      {/* 신고 등록 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="제목"
            value={newReport.title}
            onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="설명"
            value={newReport.description}
            onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <select
            value={newReport.status}
            onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="lost">분실</option>
            <option value="found">습득</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          신고하기
        </button>
      </form>

      {/* 신고 목록 */}
      <h2 className="text-2xl font-bold mb-4">신고 목록</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report._id} className="border p-4 rounded shadow">
            <h3 className="font-bold">{report.title}</h3>
            <p>{report.description}</p>
            <p>
              {report.status === 'lost' && <p>분실자: {report.loser}</p>}
              {report.status === 'found' && <p>습득자: {report.finder}</p>}
            </p>
            <p className="mt-2">
              상태: <span className={`text-${report.status === 'lost' ? 'red' : 'green'}-500`}>
                {report.status === 'lost' ? '분실' : '습득'}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              {new Date(report.date).toLocaleDateString()}
            </p>
            <p>{report.finder === userName || report.loser === userName ? (
                <button onClick={() => handleDelete(report._id)} className="text-red-500 hover:text-red-700 mt-2">
                  삭제
                </button>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// AuthForm 컴포넌트 (로그인 및 회원가입 기능 포함)
const AuthForm = ({ onLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const [emailValid, setEmailValid] = useState(false);
  const [pwValid, setPwValid] = useState(false);
  const [studentIdValid, setStudentIdValid] = useState(false);
  const [notAllow, setNotAllow] = useState(true);

  const isRegister = location.pathname === '/register';

  const handleEmail = (e) => {
    setEmail(e.target.value);
    const regex = 
        /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
    setEmailValid(regex.test(e.target.value));
  }

  const handlePw = (e) => {
      setPw(e.target.value);
      const regex = 
          /^(?=.*[a-zA-z])(?=.*[0-9])(?=.*[$`~!@$!%*#^?&\\(\\)\-_=+])(?!.*[^a-zA-z0-9$`~!@$!%*#^?&\\(\\)\-_=+]).{8,20}$/;
      setPwValid(regex.test(e.target.value));
  }

  const handleName = (e) => {
      setName(e.target.value);
  }

  const handleStudentId = (e) => {
      setStudentId(e.target.value);
      const regex = 
          /^(2[0-9])-(10[1-7](0[1-9]|1[0-9]|2[0-9]|30))$/;
      setStudentIdValid(regex.test(e.target.value));
  }

  const onClickConfirmButton = async () => {
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const body = isRegister 
        ? { email, password: pw, name, studentId }
        : { email, password: pw };

      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        if (isRegister) {
          alert('회원가입이 완료되었습니다.');
          navigate('/login');
        } else {
          alert(data.message);
          onLogin(data.userName);
          navigate('/billigi');
        }
      } else {
        alert(data.message || data.error);
      }
    } catch (error) {
      console.error(`Error ${isRegister ? 'registering' : 'logging in'}:`, error);
    }
  };

  useEffect(() => {
      setNotAllow(!(emailValid && pwValid && (!isRegister || (name && studentId))));
  }, [emailValid, pwValid, name, studentIdValid, studentId, isRegister]);

  return (
      <div className="flex flex-col items-center justify-start min-h-screen p-10 bg-gray-100">
          <div className='titleWrap mb-6'>
              <h2 className="text-2xl font-bold">{isRegister ? '회원가입' : '로그인'}</h2>
          </div>
          <div className="contentWrap w-full max-w-md">
              {isRegister && (
                  <>
                    <div className="inputTitle">이름</div>
                      <div className="inputWrap mb-4">
                          <input 
                              type="text"
                              className="border p-2 rounded w-full" 
                              placeholder="이름을 입력하세요"
                              value={name}
                              onChange={handleName}/>
                      </div>
                    <div className="inputTitle">학번</div>
                      <div className="inputWrap mb-4">
                          <input 
                              type="text"
                              className="border p-2 rounded w-full" 
                              placeholder="예)23-10101"
                              value={studentId}
                              onChange={handleStudentId}/>
                      </div>
                          <div className="errorMessageWrap">
                          {!studentIdValid && studentId.length > 0 && (
                              <div className="text-red-500">올바른 학번을 입력해주세요.</div>
                        )}
                    </div>
                  </>
              )}
              <div className="inputTitle">이메일 주소</div>
              <div className="inputWrap mb-4">
                  <input 
                      type="text"
                      className="border p-2 rounded w-full" 
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleEmail}/>
              </div>

              <div className="errorMessageWrap">
                  {!emailValid && email.length > 0 && (
                      <div className="text-red-500">올바른 이메일을 입력해주세요.</div>
                  )}
              </div>

              <div className="inputTitle mt-4">비밀번호</div>
              <div className="inputWrap mb-4">
                  <input 
                      type="password"
                      className="border p-2 rounded w-full" 
                      placeholder='영문, 숫자, 특수문자 포함 8자 이상'
                      value={pw}
                      onChange={handlePw}/>
              </div>

              <div className="errorMessageWrap">
                  {!pwValid && pw.length > 0 && (
                      <div className="text-red-500">영문, 숫자, 특수문자 포함 8자 이상 입력해주세요.</div>
                  )}
              </div>
          </div>
          
          <div className='buttonWrap mb-4'>
              <button 
                  onClick={onClickConfirmButton} 
                  onTouchStart={onClickConfirmButton}
                  disabled={notAllow} 
                  className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                  {isRegister ? '가입' : '로그인'}
              </button>
          </div>
          <hr className="my-4"/>
          <div className='registerWrap'>
              <div className='registerTitle'>
                  {isRegister ? (
                      <>계정이 있으신가요? <Link to="/login" className="text-blue-500">로그인하기</Link></>
                  ) : (
                      <>계정이 없으신가요? <Link to="/register" className="text-blue-500">가입하기</Link></>
                  )}
              </div>
          </div>
      </div>
  );
};

// App 컴포넌트
const App = () => {
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!userName);
  const navigate = useNavigate();

  const handleLogin = (name) => {
    setUserName(name);
    setIsLoggedIn(true);
    localStorage.setItem('userName', name);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setUserName(null);
        setIsLoggedIn(false);
        localStorage.removeItem('userName');
        alert('로그아웃되었습니다.');
        navigate('/login');
      } else {
        console.error('로그아웃 실패:', response.statusText);
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex items-center">
          <div className="flex gap-4">
            <Link to="/billigi" className="text-blue-500 hover:text-blue-700">빌리기/빌려주기</Link>
            <Link to="/bunsilmul" className="text-blue-500 hover:text-blue-700">분실물/습득물</Link>
          </div>
          <div className="flex gap-4 ml-auto">
            {isLoggedIn ? (
              <>
                <span className="text-blue-500">안녕하세요, {userName}님!</span>
                <button onClick={handleLogout} className="text-blue-500 hover:text-blue-700">로그아웃</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-blue-500 hover:text-blue-700">로그인</Link>
                <Link to="/register" className="text-blue-500 hover:text-blue-700">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<AuthForm onLogin={handleLogin} />} />
        <Route path='/register' element={<AuthForm />} />
        <Route path="/billigi" element={isLoggedIn ? <ItemList userName={userName} /> : <Navigate to="/" />} /> {/*로그인 상태 확인*/}
        <Route path="/bunsilmul" element={isLoggedIn ? <LostFound userName={userName} /> : <Navigate to="/" />} /> {/*로그인 상태 확인*/}
      </Routes>     
    </div>
  );
};

export default App;