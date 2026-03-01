import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  ChevronRight,
  MapPin,
  User,
  Thermometer,
  MessageSquare,
  X,
  Edit3
} from 'lucide-react';

const NewAppointment = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentToEdit = location.state?.appointment || null;
  
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [currentSymptom, setCurrentSymptom] = useState('');
  const symptomsInputRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    reason: '',
    notes: ''
  });

  // Load appointment data for editing
  useEffect(() => {
    if (appointmentToEdit) {
      setFormData({
        reason: appointmentToEdit.reason || '',
        notes: appointmentToEdit.notes || ''
      });
      setSymptoms(appointmentToEdit.symptoms || []);
      // We'll need to find and set the branch after branches are loaded
    }
  }, [appointmentToEdit]);

  // Set selected branch after branches are loaded (for editing)
  useEffect(() => {
    if (appointmentToEdit && branches.length > 0) {
      const branch = branches.find(b => b.id === appointmentToEdit.branchId);
      if (branch) {
        setSelectedBranch(branch);
      }
    }
  }, [branches, appointmentToEdit]);

  // Fetch branches from Firebase
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const branchesRef = collection(db, 'branch');
        const snapshot = await getDocs(branchesRef);
        const branchesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const userRef = doc(db, 'user-data', user.uid);
        const userSnap = await getDoc(userRef);
        setUserData(userSnap.data());
        setBranches(branchesList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again.');
        setLoading(false);
      }
    };

    fetchBranches();
  }, [user.uid]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSymptomInputChange = (e) => {
    setCurrentSymptom(e.target.value);
  };

  const handleSymptomKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSymptom();
    } else if (e.key === 'Backspace' && currentSymptom === '' && symptoms.length > 0) {
      removeSymptom(symptoms.length - 1);
    }
  };

  const addSymptom = () => {
    const trimmedSymptom = currentSymptom.trim();
    if (trimmedSymptom && !symptoms.includes(trimmedSymptom)) {
      setSymptoms([...symptoms, trimmedSymptom]);
      setCurrentSymptom('');
    }
  };

  const removeSymptom = (index) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  // Function to get next appointment number
  const getNextAppointmentNumber = async () => {
    const counterRef = doc(db, 'counters', 'appointments');
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let nextNumber = 1;
        
        if (counterDoc.exists()) {
          nextNumber = (counterDoc.data().lastNumber || 0) + 1;
          transaction.update(counterRef, { lastNumber: nextNumber });
        } else {
          transaction.set(counterRef, { lastNumber: 1 });
        }
        
        return nextNumber;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting next appointment number:', error);
      throw new Error('Failed to generate appointment number');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBranch) {
      setError('Please select a branch first');
      return;
    }

    if (!formData.reason.trim() || symptoms.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Get next appointment number for new appointments
      let appointmentNumber = null;
      if (!appointmentToEdit) {
        appointmentNumber = await getNextAppointmentNumber();
      }
      const docRef = doc(db, "user-data", user.uid);
      const snapshot = await getDoc(docRef);
      const data = snapshot.data();
      const appointmentData = {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || '',
        fullName: data.fullName || '',
        branchId: selectedBranch.id,
        branchName: selectedBranch.brname,
        reason: formData.reason,
        symptoms: symptoms,
        notes: formData.notes,
        status: appointmentToEdit ? appointmentToEdit.status : 'pending',
        updatedAt: new Date(),
        doctorId: appointmentToEdit?.doctorId || ""
      };

      // Add appointment number for new appointments
      if (appointmentNumber) {
        appointmentData.appointmentNumber = appointmentNumber;
      }

      // If it's an edit, preserve the createdAt date
      if (appointmentToEdit) {
        appointmentData.createdAt = appointmentToEdit.createdAt;
        appointmentData.doctorId = appointmentToEdit.doctorId;
        // Preserve the existing appointment number
        if (appointmentToEdit.appointmentNumber) {
          appointmentData.appointmentNumber = appointmentToEdit.appointmentNumber;
        }
      } else {
        appointmentData.createdAt = new Date();
      }

      if (appointmentToEdit) {
        // Update existing appointment
        const appointmentRef = doc(db, 'appointments', appointmentToEdit.id);
        await updateDoc(appointmentRef, appointmentData);
        console.log('Appointment updated with ID:', appointmentToEdit.id);
        setSuccess(true);
        
        // Navigate back to appointments after 2 seconds
        setTimeout(() => {
          navigate('/appointments');
        }, 2000);
      } else {
        // Create new appointment
        const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
        console.log('Appointment saved with ID:', docRef.id, 'Appointment Number:', appointmentNumber);
        setSuccess(true);
        
        // Reset form for new appointment
        setFormData({
          reason: '',
          notes: ''
        });
        setSymptoms([]);
        setCurrentSymptom('');
        setSelectedBranch(null);
      }
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Failed to save appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div>
          <Sidebar role={role} />
        </div> 
        <div className="flex-1 min-h-screen ml-0 md:ml-64 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="h-32 bg-gray-200 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div>
        <Sidebar role={role} />
      </div> 
      <div className="flex-1 min-h-screen ml-0 md:ml-64 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Success Message */}
          {success && (
            <div className="mb-8 animate-slide-down">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-green-800">
                      {appointmentToEdit ? 'Appointment Updated Successfully!' : 'Appointment Booked Successfully!'}
                    </h3>
                    <p className="text-green-700 mt-1">
                      {appointmentToEdit 
                        ? 'Your appointment has been updated. You\'ll receive a confirmation email shortly.'
                        : 'Your appointment request has been submitted. You\'ll receive a confirmation email shortly.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {appointmentToEdit ? 'Reschedule Appointment' : 'Book Your Appointment'}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {appointmentToEdit 
                ? 'Update your appointment details below'
                : 'Select your preferred branch and provide details about your medical needs'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {!appointmentToEdit && (
            <div className="mb-12">
              <div className="flex items-center justify-center">
                <div className={`flex items-center ${selectedBranch ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${selectedBranch ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="ml-2 font-semibold">Select Branch</span>
                </div>
                
                <div className={`w-24 h-1 mx-4 ${selectedBranch ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                
                <div className={`flex items-center ${'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${'border-gray-300'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="ml-2 font-semibold">Appointment Details</span>
                </div>
              </div>
            </div>
          )}

          {!selectedBranch && !appointmentToEdit ? (
            /* Branch Selection Section (only for new appointments) */
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                  <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                  Select Your Preferred Branch
                </h2>
                <p className="text-gray-600">Choose the medical facility that's most convenient for you</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch)}
                    className={`group cursor-pointer transform transition-all duration-300 hover:-translate-y-2 ${
                      selectedBranch?.id === branch.id 
                        ? 'ring-4 ring-blue-500 ring-opacity-30' 
                        : 'hover:shadow-2xl'
                    }`}
                  >
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl overflow-hidden relative">
                      {/* Selected Indicator */}
                      {selectedBranch?.id === branch.id && (
                        <div className="absolute top-4 right-4">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Branch Circle */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials(branch.brname)}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                          {branch.brname}
                        </h3>
                        <p className="text-gray-600 text-center text-sm mb-4 line-clamp-2">
                          {branch.description}
                        </p>
                      </div>

                      {/* Select Button */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                          onClick={() => handleBranchSelect(branch)}
                          className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            selectedBranch?.id === branch.id
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 group-hover:from-blue-100 group-hover:to-indigo-100'
                          }`}
                        >
                          {selectedBranch?.id === branch.id ? 'Selected' : 'Select This Branch'}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Appointment Form Section */
            <div className="animate-slide-down">
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      <Stethoscope className="w-6 h-6 text-blue-600 mr-2" />
                      {appointmentToEdit ? 'Update Appointment Details' : `Appointment Details for ${selectedBranch?.brname}`}
                    </h2>
                    <p className="text-gray-600">Please provide details about your medical needs</p>
                  </div>
                  {!appointmentToEdit && (
                    <button
                      onClick={() => setSelectedBranch(null)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Change Branch
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Selected Branch Card */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg sticky top-8">
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mr-4">
                        {getInitials(selectedBranch?.brname || appointmentToEdit?.branchName)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedBranch?.brname || appointmentToEdit?.branchName}</h3>
                        <p className="text-gray-600 text-sm">{selectedBranch?.description || 'Medical Facility'}</p>
                      </div>
                    </div>
                    
                    {/* Appointment Number for editing */}
                    {appointmentToEdit && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-gray-600">Appointment Number</p>
                        <p className="font-bold text-xl text-gray-800">#{appointmentToEdit.appointmentNumber || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Form */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
                      {/* User Info */}
                      {user && (
                        <div className="mb-8">
                          <div className="flex items-center mb-4">
                            <User className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">Your Information</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-semibold text-gray-900">{userData?.fullName || 'Not provided'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-semibold text-gray-900">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Medical Details */}
                      <div className="space-y-6">
                        {/* Reason for Appointment */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-blue-600 mr-2" />
                              Reason for Appointment *
                            </div>
                          </label>
                          <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleInputChange}
                            placeholder="Describe the main reason for your visit..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-300 bg-gray-50 focus:bg-white"
                            rows="3"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Be specific about what you'd like to discuss with the doctor
                          </p>
                        </div>

                        {/* Symptoms - Array Input */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <div className="flex items-center">
                              <Thermometer className="w-4 h-4 text-red-600 mr-2" />
                              Symptoms *
                              <span className="ml-2 text-xs font-normal text-gray-500">
                                ({symptoms.length} added)
                              </span>
                            </div>
                          </label>
                          
                          {/* Symptoms Input */}
                          <div className="relative">
                            <input
                              ref={symptomsInputRef}
                              type="text"
                              value={currentSymptom}
                              onChange={handleSymptomInputChange}
                              onKeyDown={handleSymptomKeyDown}
                              placeholder="Enter a symptom and press Enter or comma..."
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-300 bg-gray-50 focus:bg-white"
                            />
                            <div className="absolute right-3 top-3">
                              <button
                                type="button"
                                onClick={addSymptom}
                                disabled={!currentSymptom.trim()}
                                className={`px-3 py-1 text-sm font-medium rounded-lg transition-all ${
                                  currentSymptom.trim()
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          
                          {/* Symptoms Tags Display */}
                          {symptoms.length > 0 && (
                            <div className="mt-4">
                              <div className="flex flex-wrap gap-2">
                                {symptoms.map((symptom, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-full px-4 py-2 group hover:from-red-100 hover:to-orange-100 transition-all duration-300"
                                  >
                                    <span className="text-red-700 font-medium">{symptom}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeSymptom(index)}
                                      className="ml-1 p-0.5 rounded-full hover:bg-red-200 transition-colors duration-200 group-hover:visible"
                                      aria-label={`Remove ${symptom}`}
                                    >
                                      <X className="w-3.5 h-3.5 text-red-600 hover:text-red-800" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <p className="text-xs text-gray-500">
                                  Press Enter or comma to add. Click × to remove. Backspace to remove last.
                                </p>
                                {symptoms.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setSymptoms([])}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                                  >
                                    <X className="w-3 h-3" />
                                    Clear all
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            List each symptom separately. Include duration and severity if applicable.
                          </p>
                        </div>

                        {/* Additional Notes */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 text-yellow-600 mr-2" />
                              Additional Notes
                            </div>
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="Any additional information or special requests..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-300 bg-gray-50 focus:bg-white"
                            rows="2"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="mt-10 pt-8 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={submitting}
                          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl ${
                            submitting
                              ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                          } text-white flex items-center justify-center gap-3`}
                        >
                          {submitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              {appointmentToEdit ? (
                                <>
                                  <Edit3 className="w-5 h-5" />
                                  Update Appointment
                                </>
                              ) : (
                                <>
                                  <Calendar className="w-5 h-5" />
                                  Book Appointment Now
                                </>
                              )}
                            </>
                          )}
                        </button>
                        
                        <p className="text-center text-gray-500 text-sm mt-4">
                          By {appointmentToEdit ? 'updating' : 'booking'} this appointment, you agree to our terms of service.
                          You'll receive a confirmation email shortly.
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAppointment;