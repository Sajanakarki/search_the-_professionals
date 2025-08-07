import { useEffect, useState } from 'react';
import './Homepage.css';
import { getUserListApi } from '../../shared/config/api';
import { useNavigate, Link } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email?: string;
}

export default function Homepage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUserListApi()
      .then((res) => setUsers(res.data.users || []))
      .catch((err) => console.error('API Error:', err));
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

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
  };

  return (
    <div className="homepage-container">
      {!selectedUser && (
        <>
          <header className="top-bar">
            <div className="nav-links">
              <Link to="/jobs" className="job-listing">Job Listing</Link>
              <Link to="/about" className="about-us">About Us</Link>
              <Link to="/contact" className="contact-us">Contact Us</Link>
              <Link to="/post-job" className="post-job">Post Job</Link>
              <Link to="/applications" className="my-applications">My Applications</Link>
              <Link to="/saved-jobs" className="saved-jobs">Saved Jobs</Link>
              <Link to="/profile-settings" className="profile-settings">Profile Settings</Link>
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </header>

          <h1 className="home-title">Welcome to Home Page</h1>
        </>
      )}

      {!selectedUser ? (
        <main>
          <section className="search-section">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-bar"
            />
            <div className="result-count">{filteredUsers.length} users found</div>
          </section>

          <section className="user-cards">
            {filteredUsers.map((user) => (
              <div key={user._id} className="user-card">
                <h3>{user.username}</h3>
                <p>{user.email || 'No email provided'}</p>
                <button onClick={() => handleViewProfile(user)}>
                  View Profile
                </button>
              </div>
            ))}
          </section>
        </main>
      ) : (
        <main className="profile-view">
          <button onClick={handleBackToList} className="back-button">Back</button>
          <h2>User Profile</h2>
          <p><strong>Username:</strong> {selectedUser.username}</p>
          <p><strong>Email:</strong> {selectedUser.email || 'No email provided'}</p>
        </main>
      )}
    </div>
  );
}
