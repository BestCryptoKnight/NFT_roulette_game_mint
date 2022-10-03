import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';


import Home from './pages/home/home';
import Roulette from './pages/roulette/roulette';
import Header from './component/header/header';
import Swap from './pages/swap/swap';
import PageNotFound from './pages/page_not_found/page_not_found';
// require('dotenv').config();

// import WebContext from './context';
function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="*" element=<PageNotFound /> />
        <Route path="/" element=<Home /> />
        <Route path="swap" element=<Swap /> />
        <Route path="roulette/:id" element=<Roulette /> />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
