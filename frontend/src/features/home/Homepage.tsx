import { useEffect, useState } from 'react';
import './Homepage.css';
import { getUserListApi } from '../../shared/config/api';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email?: string;
  CreatedAt?: string;
}

export default function Homepage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getUserListApi()
      .then((res) => {
        console.log('Fetched users:', res.data.users);
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.error('API Error:', err);
      });
  }, []);

  const filteredUsers = search.trim()
    ? users.filter((user) =>
        user.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="homepage-container">
      <div className="top-bar">
        <button onClick={handleProfile} className="profile-button">
          Profile
        </button>

        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <h1 className="home-title">Welcome to Home Page</h1>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      <div className="result-count">{filteredUsers.length} users found</div>

      <div className="user-cards">
        {filteredUsers.map((user) => (
          <div key={user._id} className="user-card">
            <h3>{user.username}</h3>
            <p>{user.email || 'No email provided'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
