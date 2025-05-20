import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './components/pages/Dashboard'
import NotebookEditor from './components/pages/NotebookEditor'
import Login from './components/pages/Login'
import Profile from './components/pages/Profile'
import NotFound from './components/pages/NotFound'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

 npm 