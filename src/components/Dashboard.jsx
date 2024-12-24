
import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Sponsors from './sponsor';
import Participants from './Participant';
import Items from "./CrudTest";


const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [editPost, setEditPost] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);
  
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/contact');
      const data = await response.json();
      setContacts(data); 
      setLoading(false);
    } catch (err) {
      console.error('Gabim gjatë marrjes së mesazheve:', err);
      setError('Pati një gabim gjatë marrjes së mesazheve.');
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await fetch(`http://localhost:5000/contact/${id}`, { method: 'DELETE' });
      setMessages(messages.filter((message) => message.id !== id));
    } catch (err) {
      console.error('Gabim gjatë fshirjes së mesazhit:', err);
      setError('Pati një gabim gjatë fshirjes së mesazhit.');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/posts');
      const data = await response.json();
      console.log('Fetched posts:', data);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const deletePost = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/posts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log(`Postimi me ID ${id} u fshi me sukses`);
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
      } else {
        const result = await response.json();
        console.error('Gabim gjatë fshirjes së postimit:', result);
      }
    } catch (error) {
      console.error('Gabim gjatë lidhjes me serverin për fshirjen e postimit:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || (!editPost && !imageFile)) {
      setError('Ju lutem plotësoni të gjitha fushat dhe ngarkoni një imazh.');
      return;
    }
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    const requestOptions = {
      method: editPost ? 'PUT' : 'POST',
      body: formData,
    };

    const url = editPost
      ? `http://localhost:5000/posts/${editPost.id}`
      : 'http://localhost:5000/posts';

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const result = await response.json();
        console.error('Error submitting post:', result);
        setError('Dështoi shtimi i postimit. Ju lutem kontrolloni të dhënat.');
        return;
      }

      const result = await response.json();

      if (editPost) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === result.id ? result : post))
        );
      } else {
        setPosts((prevPosts) => [...prevPosts, result]);
      }

      setEditPost(null);
      setTitle('');
      setContent('');
      setImageFile(null);
      setPreviewImage('');
    } catch (error) {
      console.error('Error submitting post:', error);
      setError('Gabim gjatë lidhjes me serverin.');
    }
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setTitle(post.title);
    setContent(post.content);
    setPreviewImage(post.image ? `http://localhost:5000/uploads/${post.image}` : '');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    setPreviewImage(file ? URL.createObjectURL(file) : '');
  };

  return (
    <div className="flex font-sans">
      <div className="w-64 bg-gray-800 text-white p-6 min-h-screen flex flex-col">
        <h2 className="text-center text-2xl mb-8 text-gray-200">Admin Panel</h2>
        <a
          href="#posts"
          onClick={() => setActiveTab('posts')}
          className={`block py-2 px-4 mb-4 rounded ${activeTab === 'posts' ? 'bg-teal-400' : 'hover:bg-teal-600'}`}
        >
          Posts
        </a>
        <a
          href="#contacts"
          onClick={() => setActiveTab('contacts')}
          className={`block py-2 px-4 mb-4 rounded ${activeTab === 'contacts' ? 'bg-teal-400' : 'hover:bg-teal-600'}`}
        >
          Contact Messages
        </a>
        <a
          href="#sponsors"
          onClick={() => setActiveTab('sponsors')}
          className={`block py-2 px-4 mb-4 rounded ${activeTab === 'sponsors' ? 'bg-teal-400' : 'hover:bg-teal-600'}`}
        >
          Sponsors
        </a>
        <a
          href="#participants"
          onClick={() => setActiveTab('participants')}
          className={`block py-2 px-4 mb-4 rounded ${activeTab === 'participants' ? 'bg-teal-400' : 'hover:bg-teal-600'}`}
        >
          Participants
        </a>
        <a
          href="#items"
          onClick={() => setActiveTab('items')}
          className={`block py-2 px-4 mb-4 rounded ${activeTab === 'items' ? 'bg-teal-400' : 'hover:bg-teal-600'}`}
        >
          Conferences
        </a>
      </div>

      <div className="flex-1 p-6 bg-gray-100">
        <h1 className="text-4xl text-center mb-8 text-gray-800">Dashboard</h1>

        {activeTab === 'posts' && (
          <div id="posts">
            <h2 className="text-2xl mb-6">Posts</h2>
            <form onSubmit={handlePostSubmit} className="max-w-xl mx-auto">
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              <input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 mb-4 border rounded-md"
              />
              <textarea
                placeholder="Post Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full p-3 mb-4 border rounded-md"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-3 mb-4"
              />
              {previewImage && (
                <div className="mb-4">
                  <img src={previewImage} alt="Preview" className="w-full h-auto rounded-md" />
                </div>
              )}
             <button
  type="submit"
  className="w-full py-3 px-6 bg-blue-500 text-white rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 active:bg-blue-700"
>
  {editPost ? 'Save Post' : 'Add Post'}
</button>
            </form>

            <div className="mt-8">
              <h3 className="text-xl mb-4">Post List</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-200 p-4 rounded-md shadow-lg">
                    <h4 className="text-xl mb-2">{post.title}</h4>
                    <img
                      src={`http://localhost:5000/uploads/${post.image}`}
                      alt="Post"
                      className="w-full h-48 object-cover mb-2 rounded-md"
                    />
                    <p className="text-sm mb-4">{post.content}</p>
                    <button
                      onClick={() => handleEditPost(post)}
                      className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 mb-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div id="contacts">
            <h2 className="text-2xl mb-6">Contact Messages</h2>
            <div className="mt-8">
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : (
                contacts.map((message) => (
                  <div key={message.id} className="bg-gray-200 p-4 rounded-md shadow-lg mb-4">
                    <p><strong>Name:</strong> {message.name}</p>
                    <p><strong>Email:</strong> {message.email}</p>
                    <p><strong>Message:</strong> {message.message}</p>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-2"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sponsors' && (
          <div id="sponsors">
            <h2 className="text-2xl mb-6">Sponsors</h2>
            <Sponsors />
          </div>
        )}

        {activeTab === 'participants' && (
          <div id="participants">
            <h2 className="text-2xl mb-6">Participants</h2>
            <Participants />
          </div>
        )}

        {activeTab === 'items' && (
          <div id="items">
            <h2 className="text-2xl mb-6">Conferences</h2>
            <Items />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
