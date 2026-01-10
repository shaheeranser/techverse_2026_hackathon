import React from 'react'
import Home from '../pages/Home.jsx'
import Login from '../pages/profile/profile.jsx'
import Navbar from './Navbar.jsx'

const Index = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default Index;
