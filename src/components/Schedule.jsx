import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  getDoc
} from 'firebase/firestore';
import { Clock, Users, CheckCircle, XCircle, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar'; // Adjust the import path based on your project structure

const Schedule = () => {
  const { user, role, loading } = useAuth();
  const [dailyLimit, setDailyLimit] = useState('');
  const [showLimitInput, setShowLimitInput] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [currentAppointmentIndex, setCurrentAppointmentIndex] = useState(0);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [todayStats, setTodayStats] = useState({
    total: 0,
    attended: 0,
    pending: 0
  });
  const [doctorInfo,setDoctorInfo]=useState({});

  // Check if doctor has an active schedule for today
    useEffect(() => {
    const fetchDoctorData = async () => {
        if (user && role === 'doctor') {
        await checkTodaySchedule();

        const doctorQuery = query(
            collection(db, 'user-data'),
            where('uid', '==', user.uid)
        );

        const snapshot = await getDocs(doctorQuery);

        if (!snapshot.empty) {
            setDoctorInfo(snapshot.docs[0].data());
        }
        }
    };

    fetchDoctorData();
    }, [user, role]);

  const checkTodaySchedule = async () => {
    try {
      setLoadingData(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const scheduleQuery = query(
        collection(db, 'doctorSchedules'),
        where('doctorId', '==', user.uid),
        where('date', '>=', today),
        orderBy('date', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(scheduleQuery);
      
      if (!snapshot.empty) {
        const schedule = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };
        
        // Check if schedule is from today
        const scheduleDate = schedule.date.toDate();
        scheduleDate.setHours(0, 0, 0, 0);
        
        if (scheduleDate.getTime() === today.getTime()) {
          setDoctorSchedule(schedule);
          setShowLimitInput(false);
          
          // Check if all appointments are attended
          const allAttended = schedule.appointmentIds.every(id => 
            schedule.completedAppointments?.includes(id)
          );
          
          if (allAttended) {
            setShowLimitInput(true);
            setDoctorSchedule(null);
          } else {
            await fetchScheduledAppointments(schedule.appointmentIds, schedule.completedAppointments || []);
          }
        } else {
          setShowLimitInput(true);
        }
      } else {
        setShowLimitInput(true);
      }
    } catch (err) {
      console.error('Error checking schedule:', err);
      setError('Failed to check today\'s schedule');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchScheduledAppointments = async (appointmentIds, completedIds) => {
    try {
      setLoadingData(true);
      const appointmentsData = [];
      
      for (const id of appointmentIds) {
        const appointmentDoc = await getDoc(doc(db, 'appointments', id));
        if (appointmentDoc.exists()) {
          appointmentsData.push({
            id: appointmentDoc.id,
            ...appointmentDoc.data()
          });
        }
      }
      
      // Sort by appointment number
      appointmentsData.sort((a, b) => a.appointmentNumber - b.appointmentNumber);
      
      setAppointments(appointmentsData);
      
      // Find first non-attended appointment
      const pendingIndex = appointmentsData.findIndex(apt => 
        !completedIds.includes(apt.id)
      );
      setCurrentAppointmentIndex(pendingIndex !== -1 ? pendingIndex : 0);
      
      // Update stats
      setTodayStats({
        total: appointmentsData.length,
        attended: completedIds.length,
        pending: appointmentsData.length - completedIds.length
      });
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAppointmentsByNumber = async (dailyLimitValue) => {
    try {
        setLoadingData(true);
        setError('');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Query pending appointments
        const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('status', '==', 'pending'),
        orderBy('appointmentNumber'),
        limit(parseInt(dailyLimitValue))  // Changed from 'limit' to 'dailyLimitValue'
        );

        const snapshot = await getDocs(appointmentsQuery);
        const appointmentsList = [];
        const appointmentIds = [];

        snapshot.forEach((doc) => {
        appointmentsList.push({
            id: doc.id,
            ...doc.data()
        });
        appointmentIds.push(doc.id);
        });

        if (appointmentsList.length === 0) {
        setError('No pending appointments found');
        return;
        }

        setAppointments(appointmentsList);
        setCurrentAppointmentIndex(0);

        // Create doctor schedule
        const scheduleData = {
        doctorId: user.uid,
        doctorEmail: user.email,
        date: today,
        appointmentIds: appointmentIds,
        completedAppointments: [],
        dailyLimit: parseInt(dailyLimitValue), // Changed here too
        createdAt: serverTimestamp(),
        status: 'active'
        };

        const scheduleDoc = await addDoc(collection(db, 'doctorSchedules'), scheduleData);
        
        setDoctorSchedule({
        id: scheduleDoc.id,
        ...scheduleData
        });

        // Update appointments with doctorId
        for (const apt of appointmentsList) {
        const appointmentRef = doc(db, 'appointments', apt.id);
        await updateDoc(appointmentRef, {
            doctorId: user.uid,
            status: 'appointed',
            scheduledAt: serverTimestamp()
        });
        }

        setTodayStats({
        total: appointmentsList.length,
        attended: 0,
        pending: appointmentsList.length
        });

        setShowLimitInput(false);
        setSuccess(`Successfully scheduled ${appointmentsList.length} appointments`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
        
    } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to fetch appointments');
    } finally {
        setLoadingData(false);
    }
    };
  const handleAttendAppointment = async () => {
    if (!appointments[currentAppointmentIndex] || !doctorSchedule) return;

    try {
      setLoadingData(true);
      const currentAppointment = appointments[currentAppointmentIndex];
      
      // Update appointment status
      const appointmentRef = doc(db, 'appointments', currentAppointment.id);
      await updateDoc(appointmentRef, {
        status: 'attended',
        attendedAt: serverTimestamp()
      });

      // Update doctor schedule
      const scheduleRef = doc(db, 'doctorSchedules', doctorSchedule.id);
      const updatedCompleted = [...(doctorSchedule.completedAppointments || []), currentAppointment.id];
      
      await updateDoc(scheduleRef, {
        completedAppointments: updatedCompleted
      });

      // Update local state
      setDoctorSchedule({
        ...doctorSchedule,
        completedAppointments: updatedCompleted
      });

      setTodayStats(prev => ({
        ...prev,
        attended: prev.attended + 1,
        pending: prev.pending - 1
      }));

      // Move to next appointment if available
      if (currentAppointmentIndex < appointments.length - 1) {
        setCurrentAppointmentIndex(currentAppointmentIndex + 1);
      } else {
        // All appointments attended
        setSuccess('All appointments for today are completed!');
        setShowLimitInput(true);
        setDoctorSchedule(null);
        setAppointments([]);
      }

    } catch (err) {
      console.error('Error attending appointment:', err);
      setError('Failed to mark appointment as attended');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSkipAppointment = () => {
    if (currentAppointmentIndex < appointments.length - 1) {
      setCurrentAppointmentIndex(currentAppointmentIndex + 1);
    }
  };

  const handleSubmitLimit = (e) => {
    e.preventDefault();
    if (dailyLimit && parseInt(dailyLimit) > 0) {
      fetchAppointmentsByNumber(dailyLimit);
    } else {
      setError('Please enter a valid number');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (role !== 'doctor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">This page is only accessible to doctors.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <Sidebar role={role} />
      
      {/* Main Content - with dynamic margin based on sidebar state */}
      <div className="flex-1 transition-all duration-300 lg:ml-64">
        {/* Header with welcome message */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Schedule Management</h1>
              <p className="text-sm text-gray-600">Welcome back, Dr. {doctorInfo.fullName || user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with padding */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative flex items-center">
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-4 text-red-700 hover:text-red-900"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="flex-1">{success}</span>
              <button 
                onClick={() => setSuccess('')}
                className="ml-4 text-green-700 hover:text-green-900"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          )}

          {/* Daily Limit Input */}
          {showLimitInput && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Set Daily Patient Limit</h2>
              </div>
              <form onSubmit={handleSubmitLimit} className="space-y-4">
                <div>
                  <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of patients you can attend today
                  </label>
                  <input
                    type="number"
                    id="dailyLimit"
                    min="1"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter number of patients"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition duration-200 shadow-lg"
                >
                  Start Schedule
                </button>
              </form>
            </div>
          )}

          {/* Today's Stats */}
          {!showLimitInput && doctorSchedule && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">Today's Progress</h3>
                </div>
                <span className="text-sm text-gray-500">
                  Limit: {doctorSchedule.dailyLimit} patients
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{todayStats.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{todayStats.attended}</p>
                  <p className="text-sm text-gray-600">Attended</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{todayStats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          )}

          {/* Current Appointment */}
          {!showLimitInput && appointments.length > 0 && currentAppointmentIndex < appointments.length && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Progress Bar */}
              <div className="bg-gray-200 h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 transition-all duration-300"
                  style={{ width: `${((currentAppointmentIndex + 1) / appointments.length) * 100}%` }}
                ></div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">
                    Appointment {currentAppointmentIndex + 1} of {appointments.length}
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    #{appointments[currentAppointmentIndex].appointmentNumber}
                  </span>
                </div>

                {/* Appointment Details */}
                <div className="space-y-4 mb-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-medium text-gray-800">{appointments[currentAppointmentIndex].fullName}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Contact Email</p>
                    <p className="font-medium text-gray-800">{appointments[currentAppointmentIndex].userEmail}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Branch</p>
                    <p className="font-medium text-gray-800">{appointments[currentAppointmentIndex].branchName || 'Not specified'}</p>
                  </div>

                  {appointments[currentAppointmentIndex].reason && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Reason</p>
                      <p className="font-medium text-gray-800 capitalize">{appointments[currentAppointmentIndex].reason}</p>
                    </div>
                  )}

                  {appointments[currentAppointmentIndex].symptoms?.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {appointments[currentAppointmentIndex].symptoms.map((symptom, index) => (
                          <span 
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {appointments[currentAppointmentIndex].notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Notes</p>
                      <p className="font-medium text-gray-800">{appointments[currentAppointmentIndex].notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAttendAppointment}
                    disabled={loadingData}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-5 w-5 inline-block mr-2" />
                    Mark as Attended
                  </button>
                  
                  {currentAppointmentIndex < appointments.length - 1 && (
                    <button
                      onClick={handleSkipAppointment}
                      className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Multiple Appointments */}
          {!showLimitInput && appointments.length > 1 && (
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentAppointmentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentAppointmentIndex === 0}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md text-gray-600 hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setCurrentAppointmentIndex(prev => Math.min(appointments.length - 1, prev + 1))}
                disabled={currentAppointmentIndex === appointments.length - 1}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow-md text-gray-600 hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </button>
            </div>
          )}

          {/* No Appointments Message */}
          {!showLimitInput && appointments.length === 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Today</h3>
              <p className="text-gray-600">You have no pending appointments scheduled for today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;