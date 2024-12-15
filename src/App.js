// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NoMatch from './components/nomatch/noMatch';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import AboutUs from './components/AboutUs';
import Menu from "./components/menu";  
import Dashboard from "./components/Dashboard";  
import { AddItem, EditItem, ItemList } from './components/CrudTest'; 
import { AddSponsor, EditSponsor, SponsorList } from './components/sponsor'; 
<<<<<<< HEAD
import ContactForm from './components/contactus';
=======
import ContactForm from './components/ContactForm';
import { AddParticipant, EditParticipant, ParticipantList } from './components/Participant'; 
>>>>>>> 2c1a62a28611a6b6d60b819dca99eb111728f568
import "./App.css"

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
    
          <Route path="ItemList" element={<ItemList />} />
          <Route path="/add" element={<AddItem />} />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/menu" element={<Menu />} />
  
          <Route path="/items" element={<ItemList />} />
          <Route path="/add" element={<AddItem />} /> 
          <Route path="/edit/:id" element={<EditItem />} /> 

          {/* Sponsor Routes */}
          <Route path="/sponsors" element={<SponsorList />} />
          <Route path="/add-sponsor" element={<AddSponsor />} />
          <Route path="/edit-sponsor/:id" element={<EditSponsor />} />

<<<<<<< HEAD
=======
          {/* Post Routes */}
          <Route path="/posts" element={<PostList />} />
          <Route path="/add-post" element={<AddPost />} />
          <Route path="/edit-post/:id" element={<EditPost />} />

          {/* Feedback Routes */}
          <Route path="/feedback" element={<FeedbackList />} /> 
          <Route path="/add-feedback" element={<AddFeedback />} /> 
          <Route path="/edit-feedback/:id" element={<EditFeedback />} /> 

           {/* Participant Routes (Added for Participants) */}
          <Route path="/participants" element={<ParticipantList />} /> 
          { <Route path="/add-participant" element={<AddParticipant />} /> }
          { <Route path="/edit-participant/:id" element={<EditParticipant />}/>}

>>>>>>> 2c1a62a28611a6b6d60b819dca99eb111728f568
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactForm />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Authentication Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route path="*" element={<NoMatch />} /> {/* Për rrugët e paidentifikuara */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
