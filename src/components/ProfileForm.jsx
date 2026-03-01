import { doc, setDoc } from 'firebase/firestore';
import React, { useState, useEffect, use } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileForm = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    phoneNumber: '',
    height: '',
    weight: '',
    address: ''
  });
  const navigate=useNavigate();
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const {user}=useAuth();

  useEffect(() => {
    if (formData.dateOfBirth) {
      calculateAge(formData.dateOfBirth);
    } else {
      setAge('');
    }
  }, [formData.dateOfBirth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    if (calculatedAge >= 0 && !isNaN(calculatedAge)) {
      setAge(`${calculatedAge} years`);
    } else {
      setAge('');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    
    if (validateForm()) {
      await setDoc(doc(db,"user-data",user.uid),formData);
      setShowModal(true);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      fullName: '',
      gender: '',
      dateOfBirth: '',
      bloodGroup: '',
      phoneNumber: '',
      height: '',
      weight: '',
      address: ''
    });
    setAge('');
    setErrors({});
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8 md:mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              User Profile
            </h1>
            <p className="text-gray-600">
              Fill in your details below. Fields marked with * are mandatory.
            </p>
            <div className="w-20 h-1 bg-blue-500 mx-auto mt-4 rounded-full"></div>
          </header>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="md:flex">
              {/* Left side - Form */}
              <div className="md:w-2/3 p-6 md:p-8">
                <form onSubmit={handleSubmit} id="profileForm">
                  {/* Full Name */}
                  <div className="mb-6 fade-in">
                    <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2 required">
                      Full Name
                    </label>
                    <div className="relative">
                      
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Enter your full legal name</p>
                  </div>

                  {/* Gender and Date of Birth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Gender */}
                    <div className="fade-in">
                      <label className="block text-gray-700 font-medium mb-2 required">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['male', 'female', 'other'].map((genderOption) => (
                          <label
                            key={genderOption}
                            className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer
                              transition duration-200
                              ${formData.gender === genderOption
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:bg-blue-50'}
                              ${errors.gender ? 'border-red-500' : ''}
                            `}
                          >
                            {/* HIDDEN RADIO */}
                            <input
                              type="radio"
                              name="gender"
                              value={genderOption}
                              checked={formData.gender === genderOption}
                              onChange={handleChange}
                              className="hidden"
                            />

                            {/* TEXT */}
                            <span className="capitalize font-medium">
                              {genderOption}
                            </span>
                          </label>
                        ))}
                      </div>

                      {errors.gender && (
                        <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
                      )}
                    </div>

                    {/* Date of Birth */}
                    <div className="fade-in">
                      <label htmlFor="dateOfBirth" className="block text-gray-700 font-medium mb-2 required">
                        Date of Birth
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-calendar-alt text-gray-400"></i>
                        </div>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
                      )}
                      <div className="text-sm text-blue-600 font-medium mt-2">
                        {age && `Age: ${age}`}
                      </div>
                    </div>
                  </div>

                  {/* Blood Group and Phone Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Blood Group */}
                    <div className="fade-in">
                      <label htmlFor="bloodGroup" className="block text-gray-700 font-medium mb-2 required">
                        Blood Group
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-tint text-gray-400"></i>
                        </div>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.bloodGroup ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none`}
                        >
                          <option value="" disabled>Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <i className="fas fa-chevron-down text-gray-400"></i>
                        </div>
                      </div>
                      {errors.bloodGroup && (
                        <p className="text-red-500 text-sm mt-1">{errors.bloodGroup}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="fade-in">
                      <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2 required">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-phone text-gray-400"></i>
                        </div>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Height and Weight (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Height */}
                    <div className="fade-in">
                      <label htmlFor="height" className="block text-gray-700 font-medium mb-2">
                        <span>Height</span>
                        <span className="text-gray-500 text-sm font-normal"> (optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-ruler-vertical text-gray-400"></i>
                        </div>
                        <input
                          type="number"
                          id="height"
                          name="height"
                          value={formData.height}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          placeholder="e.g., 175"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">cm</span>
                        </div>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="fade-in">
                      <label htmlFor="weight" className="block text-gray-700 font-medium mb-2">
                        <span>Weight</span>
                        <span className="text-gray-500 text-sm font-normal"> (optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i className="fas fa-weight text-gray-400"></i>
                        </div>
                        <input
                          type="number"
                          id="weight"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          min="0"
                          step="0.1"
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          placeholder="e.g., 68.5"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">kg</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-8 fade-in">
                    <label htmlFor="address" className="block text-gray-700 font-medium mb-2 required">
                      Address
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3">
                        <i className="fas fa-home text-gray-400"></i>
                      </div>
                      <textarea
                        id="address"
                        name="address"
                        rows="3"
                        value={formData.address}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                        placeholder="Enter your full address"
                      ></textarea>
                    </div>
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Include street, city, state, and zip code
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-300 transform hover:-translate-y-1"
                    >
                      <i className="fas fa-save mr-2"></i>Save Profile
                    </button>
                    
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-300"
                    >
                      <i className="fas fa-redo mr-2"></i>Reset Form
                    </button>
                  </div>
                </form>
              </div>

              {/* Right side - Preview */}
              <div className="md:w-1/3 bg-gradient-to-b from-blue-50 to-indigo-50 p-6 md:p-8 border-t md:border-t-0 md:border-l border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <i className="fas fa-eye mr-2 text-blue-500"></i>Profile Preview
                </h3>
                
                <div className="space-y-4 text-gray-700">
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-4xl mb-3 shadow-lg">
                      <i className="fas fa-user"></i>
                    </div>
                    <p className="text-gray-500 italic">
                      {formData.fullName ? 'Your profile details' : 'Your profile details will appear here'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Full Name</p>
                      <p className="font-medium truncate">
                        {formData.fullName || '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Gender</p>
                      <p className="font-medium">
                        {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Date of Birth</p>
                      <p className="font-medium">
                        {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Age</p>
                      <p className="font-medium">{age || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Blood Group</p>
                      <p className="font-medium">{formData.bloodGroup || '-'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Phone</p>
                      <p className="font-medium truncate">
                        {formData.phoneNumber || '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg col-span-2">
                      <p className="text-gray-500 text-xs">Address</p>
                      <p className="font-medium truncate">
                        {formData.address || '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Height</p>
                      <p className="font-medium">
                        {formData.height ? `${formData.height} cm` : '-'}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-500 text-xs">Weight</p>
                      <p className="font-medium">
                        {formData.weight ? `${formData.weight} kg` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-100 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                    <i className="fas fa-info-circle mr-2"></i>Information
                  </h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Height and Weight</span> are optional fields. 
                    All other fields are required to save your profile.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-8 text-center text-gray-500 text-sm">
            <p>User Profile Form • All required fields must be filled before saving</p>
          </footer>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Profile Saved!</h3>
              <p className="text-gray-600 mb-6">
                Your profile has been successfully saved.
              </p>
              <button
                onClick={() => 
                  {
                    navigate("/");
                  }}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileForm;