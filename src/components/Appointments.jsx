import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, MapPin, FileText, ChevronRight, PlusCircle, AlertCircle, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  
  const userId = user.uid;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const appointmentRef = collection(db, 'appointments');
        const q = query(appointmentRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const appointmentList = await Promise.all(
          snapshot.docs.map(async (info) => {
            const data = info.data();
            if (!data.doctorId) {
              return {
                id: info.id,
                doctorName: "",
                contactNumber: "",
                ...data,
              };
            }
            const nameSnap = await getDoc(doc(db, 'user-data', data.doctorId));
            return {
              id: info.id,
              doctorName: nameSnap.exists() ? nameSnap.data().fullName : "",
              contactNumber: nameSnap.exists() ? nameSnap.data().phoneNumber : "",
              ...data,
            };
          })
        );

        // Sort appointments by date (most recent first)
        appointmentList.sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB - dateA;
        });

        setAppointments(appointmentList);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch appointments');
        console.log(err);
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user.uid]);

  const handleReschedule = (appointment) => {
    // Navigate to NewAppointment with the appointment data for editing
    navigate('/new-appointment', { state: { appointment } });
  };

  const handleCancel = async (appointment) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancelling(true);
      const appointmentRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date()
      });

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointment.id 
            ? { ...apt, status: 'cancelled' } 
            : apt
        )
      );

      // If the cancelled appointment was selected, update it
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment(prev => ({ ...prev, status: 'cancelled' }));
      }

    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'attended': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar role={role}/>
        <div className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8 md:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="hidden md:block h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div>
        <Sidebar role={role} />
      </div>      

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8 md:ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Header with Menu Button */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                <p className="text-sm text-gray-600">Manage your appointments</p>
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              My Appointments
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and view your upcoming medical appointments
            </p>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500 mr-3" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Appointments List */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-4 md:p-6 border border-white/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                    Upcoming Appointments
                    <span className="ml-2 md:ml-3 text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      {appointments.length} total
                    </span>
                  </h2>
                  
                  <button 
                    onClick={() => navigate("/new-appointment")}
                    className="flex items-center gap-2 w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg md:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm md:text-base"
                  >
                    <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                    New Appointment
                  </button>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-8 md:py-16">
                    <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Calendar className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">
                      No Appointments Yet
                    </h3>
                    <p className="text-gray-600 mb-6 md:mb-8 max-w-md mx-auto text-sm md:text-base">
                      You don't have any scheduled appointments. Book your first appointment to get started.
                    </p>
                    <button 
                      onClick={() => navigate("/new-appointment")}
                      className="inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm md:text-base"
                    >
                      <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                      Schedule First Appointment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 md:space-y-6">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={() => setSelectedAppointment(appointment)}
                        className={`group cursor-pointer bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 transition-all duration-300 hover:border-blue-500 hover:shadow-xl md:hover:shadow-2xl hover:-translate-y-1 ${
                          selectedAppointment?.id === appointment.id 
                            ? 'border-blue-500 shadow-xl md:shadow-2xl ring-1 md:ring-2 ring-blue-100' 
                            : 'border-gray-100 shadow-lg'
                        } ${appointment.status === 'cancelled' ? 'opacity-75' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* Mobile Compact View */}
                            <div className="md:hidden space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-md bg-blue-50">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {appointment.createdAt
                                      ? appointment.createdAt.toDate().toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })
                                      : 'Date not yet alloted'}
                                  </span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>
                              
                              <div>
                                <h3 className="font-bold text-gray-900 text-base">
                                  {appointment.doctorName || "Doctor will be alloted"}
                                </h3>
                                <p className="text-gray-600 text-sm">{appointment.branchName}</p>
                              </div>
                            </div>

                            {/* Desktop Detailed View */}
                            <div className="hidden md:block">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-blue-50">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {appointment.createdAt
                                      ? appointment.createdAt.toDate().toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })
                                      : 'Date not yet alloted'}
                                  </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 mb-3">
                                <div className="p-2 rounded-lg bg-indigo-50">
                                  <Stethoscope className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {appointment.doctorName || "Doctor will be alloted"}
                                  </h3>
                                  <p className="text-gray-600">{appointment.branchName}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Appointment Details Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 md:top-8">
                <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-4 md:p-6 border border-gray-100">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8 pb-3 md:pb-4 border-b border-gray-200">
                    Appointment Details
                  </h3>

                  {selectedAppointment ? (
                    <div className="space-y-6 md:space-y-8">
                      {/* Doctor Info */}
                      <div>
                        <h4 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                          Doctor Information
                        </h4>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg md:rounded-xl p-3 md:p-5">
                          <h5 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                            {selectedAppointment.doctorName || "Doctor will be alloted"}
                          </h5>
                          <p className="text-gray-600 mb-2 md:mb-3 text-sm md:text-base">{selectedAppointment.branchName}</p>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div>
                        <h4 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                          Appointment Details
                        </h4>
                        <div className="space-y-3 md:space-y-4">
                          <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100">
                              <p className="text-xs md:text-sm text-gray-500">Date</p>
                              <p className="font-semibold text-gray-900 text-sm md:text-base">
                                {selectedAppointment.createdAt
                                ? selectedAppointment.createdAt.toDate().toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Date not yet alloted'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div>
                        <h4 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                          Medical Information
                        </h4>
                        <div className="space-y-3 md:space-y-4">
                          <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100">
                            <p className="text-xs md:text-sm text-gray-500">Reason for Visit</p>
                            <p className="font-semibold text-gray-900 text-sm md:text-base capitalize">{selectedAppointment.reason}</p>
                          </div>
                          <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100">
                            <p className="text-xs md:text-sm text-gray-500">Symptoms</p>
                            <p className="font-semibold text-gray-900 text-sm md:text-base capitalize">
                              {Array.isArray(selectedAppointment.symptoms) 
                                ? selectedAppointment.symptoms.join(", ") 
                                : selectedAppointment.symptoms || 'None specified'}
                            </p>
                          </div>
                          <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl border border-gray-100">
                            <p className="text-xs md:text-sm text-gray-500">Notes</p>
                            <p className="font-semibold text-gray-900 text-sm md:text-base">{selectedAppointment.notes || 'No additional notes'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact & Status */}
                      <div className="pt-4 md:pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs md:text-sm text-gray-500">Contact</p>
                            <p className="font-semibold text-gray-900 text-sm md:text-base">
                              {selectedAppointment.contactNumber || "Contact will be given"}
                            </p>
                          </div>
                          <span className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                            {selectedAppointment.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 md:py-12">
                      <div className="w-12 h-12 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Calendar className="w-6 h-6 md:w-10 md:h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm md:text-lg">
                        {appointments.length > 0 
                          ? "Select an appointment to view details" 
                          : "No appointments to display"}
                      </p>
                    </div>
                  )}

                  {selectedAppointment && selectedAppointment.status !== 'cancelled' && (
                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <button
                          onClick={() => handleReschedule(selectedAppointment)}
                          disabled={cancelling}
                          className="px-3 md:px-4 py-2 md:py-3 bg-blue-600 text-white font-semibold rounded-lg md:rounded-xl hover:bg-blue-700 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(selectedAppointment)}
                          disabled={cancelling}
                          className="px-3 md:px-4 py-2 md:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg md:rounded-xl hover:bg-gray-200 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedAppointment && selectedAppointment.status === 'cancelled' && (
                    <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-700 font-medium">This appointment has been cancelled</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;