import { useState } from 'react'
import { BrowserRouter , Routes, Route } from "react-router-dom";
import Login from './components/Login';
import SignUp from './components/SignUp';
import LandingPage from './components/LandingPage';
import ProtectedRoute from "./ProtectedRoute"
import Logout from './components/Logout';
import ProfileForm from './components/ProfileForm';
import Appointments from './components/Appointments';
import NewAppointment from './components/NewAppointment';
import DoctorForm from './components/DoctorForm';
import Schedule from './components/Schedule';
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login/>}/>
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/' element={<ProtectedRoute allowedRoles={["patient","doctor"]}>
            <LandingPage/>
          </ProtectedRoute>}/>
        <Route path='/profile-form' element={<ProtectedRoute allowedRoles={["patient","doctor"]}>
          <ProfileForm/>
        </ProtectedRoute>}/>
        <Route path='/appointments' element={<ProtectedRoute allowedRoles={["patient"]}> 
          <Appointments/>
        </ProtectedRoute>}/>
        <Route path='/new-appointment' element={<ProtectedRoute allowedRoles={["patient"]}>
          <NewAppointment/>
        </ProtectedRoute>}/>
        <Route path='/doctor-form' element={<ProtectedRoute allowedRoles={['doctor']}>
          <DoctorForm/>
        </ProtectedRoute>}/>
        <Route path='/schedule' element={<ProtectedRoute allowedRoles={['doctor']}>
          <Schedule/>
        </ProtectedRoute>}/>
        <Route path='/logout' element={<Logout/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
