// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link } from 'react-router-dom';

// ItemList 컴포넌트
const ItemList = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', owner: '', type: 'lending', borrower: '' });
  const [borrowerInputs, setBorrowerInputs] = useState({});
  const [lenderInputs, setLenderInputs] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/items', newItem);
      setNewItem({ name: '', description: '', owner: '', type: 'lending', borrower: '' });
      fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleBorrow = async (e, item) => {
    e.preventDefault();

    const inputValue = item.type === 'lending' ? borrowerInputs[item._id] : lenderInputs[item._id];
    if (!inputValue) {
      alert(item.type === 'lending' ? '임차인을 입력하세요.' : '임대인을 입력하세요.');
      return;
    }

    const updatedItem = {
      borrower: inputValue,
      status: item.type === 'lending' ? 'lent' : 'borrowed',
    };

    if (item.type === 'borrowing') {
      updatedItem.owner = lenderInputs[item._id];
    }


    try {
      await axios.patch(`http://localhost:5000/api/items/${item._id}`, updatedItem);

      // 입력 필드 초기화 (해당 아이템만)
      setBorrowerInputs((prevInputs) => ({ ...prevInputs, [item._id]: '' }));
      setLenderInputs((prevInputs) => ({ ...prevInputs, [item._id]: '' }));

      fetchItems();
    } catch (error) {
      console.error('Error borrowing item:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* 물품 등록 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
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
        {newItem.type === 'lending' ? (
          <div className="mb-4">
            <input
              type="text"
              placeholder="임대인"
              value={newItem.owner}
              onChange={(e) => setNewItem({ ...newItem, owner: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>
        ) : (
          <div className="mb-4">
            <input
              type="text"
              placeholder="임차인"
              value={newItem.borrower}  // 이 부분은 등록 시에는 사용되지 않지만, 일관성을 위해 남겨둡니다.
              onChange={(e) => setNewItem({ ...newItem, borrower: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>
        )}
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
            <p className='text-gray-400'>임차인: {item.borrower}</p>
            <p>{item.description}</p>
            <p className="mt-2">
              상태: <span className={`${item.status === 'available' ? 'text-blue-500' : 'text-red-500'} font-bold`}>
                {item.status === 'available' ? '대여 가능' : '대여 중'}
              </span>
            </p>

            {item.type === 'lending' && item.status === 'available' && (
              <form onSubmit={(e) => handleBorrow(e, item)}>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-3">
                  빌리기
                </button>
                <input
                  type="text"
                  placeholder="임차인"
                  value={borrowerInputs[item._id] || ''}
                  onChange={(e) => setBorrowerInputs((prevInputs) => ({ ...prevInputs, [item._id]: e.target.value }))}
                  className="border p-2 rounded mt-2 ml-3"
                  required
                />
              </form>
            )}
            {item.type === 'borrowing' && item.status === 'available' && (
              <form onSubmit={(e) => handleBorrow(e, item)}>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-3">
                  빌려주기
                </button>
                <input
                  type="text"
                  placeholder="임대인"
                  value={lenderInputs[item._id] || ''}
                  onChange={(e) => setLenderInputs((prevInputs) => ({ ...prevInputs, [item._id]: e.target.value }))}
                  className="border p-2 rounded mt-2 ml-3"
                  required
                />
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// LostFound 컴포넌트
const LostFound = () => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    status: 'lost'
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/lostfound');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/lostfound', newReport);
      setNewReport({ title: '', description: '', status: 'lost' });
      fetchReports();
    } catch (error) {
      console.error('Error creating report:', error);
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
            onChange={(e) => setNewReport({...newReport, title: e.target.value})}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="설명"
            value={newReport.description}
            onChange={(e) => setNewReport({...newReport, description: e.target.value})}
            className="border p-2 rounded w-full"
          />
        </div>
        <div className="mb-4">
          <select
            value={newReport.status}
            onChange={(e) => setNewReport({...newReport, status: e.target.value})}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report._id} className="border p-4 rounded shadow">
            <h3 className="font-bold">{report.title}</h3>
            <p>{report.description}</p>
            <p className="mt-2">
              상태: <span className={`text-${report.status === 'lost' ? 'red' : 'green'}-500`}>
                {report.status === 'lost' ? '분실' : '습득'}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              {new Date(report.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// App 컴포넌트
const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex gap-4">
          <Link to="/" className="text-blue-500 hover:text-blue-700">물품 관리</Link>
          <Link to="/lostfound" className="text-blue-500 hover:text-blue-700">분실물/습득물</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<ItemList />} />
        <Route path="/lostfound" element={<LostFound />} />
      </Routes>
    </div>
  );
};

export default App;