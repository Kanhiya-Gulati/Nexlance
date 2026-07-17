import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layout components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Toast from './components/Toast/Toast';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Public pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import SelectRole from './pages/SelectRole/SelectRole';

// Client pages
import ClientDashboard from './pages/ClientDashboard/ClientDashboard';
import CreateJob from './pages/CreateJob/CreateJob';
import EditJob from './pages/EditJob/EditJob';
import Applications from './pages/Applications/Applications';

// Freelancer pages (placeholder imports)
import FreelancerDashboard from './pages/FreelancerDashboard/FreelancerDashboard';
import BrowseJobs from './pages/BrowseJobs/BrowseJobs';
import MyApplications from './pages/MyApplications/MyApplications';
import SavedJobs from './pages/SavedJobs/SavedJobs';

// Shared pages (placeholder imports)
import JobDetail from './pages/JobDetail/JobDetail';
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/EditProfile/EditProfile';
import Chat from './pages/Chat/Chat';
import NotFound from './pages/NotFound/NotFound';

import './App.css';

/**
 * App - Main application component
 * Defines all routes and wraps them with Navbar and Footer.
 */
const App = () => {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <Toast />

      <main className="app-main">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/select-role" element={<SelectRole />} />

          {/* Client Routes */}
          <Route
            path="/dashboard/client"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/create-job"
            element={
              <ProtectedRoute role="client">
                <CreateJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/edit-job/:id"
            element={
              <ProtectedRoute role="client">
                <EditJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/applications/:jobId"
            element={
              <ProtectedRoute role="client">
                <Applications />
              </ProtectedRoute>
            }
          />

          {/* Freelancer Routes */}
          <Route
            path="/dashboard/freelancer"
            element={
              <ProtectedRoute role="freelancer">
                <FreelancerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/browse-jobs"
            element={
              <ProtectedRoute role="freelancer">
                <BrowseJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/my-applications"
            element={
              <ProtectedRoute role="freelancer">
                <MyApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/freelancer/saved-jobs"
            element={
              <ProtectedRoute role="freelancer">
                <SavedJobs />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes */}
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
