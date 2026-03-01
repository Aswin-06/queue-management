import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const DoctorForm = () => {
  const { user, role } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dateOfBirth: '',
    about: '',
    branch: '',
    qualifications: [],
    yearsOfExperience: '',
    languagesSpoken: [],
    phoneNumber: '',
    uid:'',
  });

  const [newQualification, setNewQualification] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [branchOptions, setBranchOptions] = useState([]);
  const navigate=useNavigate();
  // Language options
  const languageOptions = [
    'Tamil',
    'Malayalam',
    'English',
    'Spanish',
    'French',
    'German',
    'Mandarin',
    'Arabic',
    'Hindi',
    'Russian',
    'Portuguese',
    'Japanese'
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        
        const branchesRef = collection(db, 'branch');
        const snapshot = await getDocs(branchesRef);
        const branchesList = [];
        snapshot.docs.forEach(item => {
          branchesList.push(item.data().brname);
        });
        setBranchOptions(branchesList);
      } catch (error) {
        console.log(error);
      }
    };
    fetchBranch();
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add qualification
  const addQualification = () => {
    if (newQualification.trim() && !formData.qualifications.includes(newQualification.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()]
      }));
      setNewQualification('');
    }
  };

  // Remove qualification
  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  // Add language
  const addLanguage = (language) => {
    if (!formData.languagesSpoken.includes(language)) {
      setFormData(prev => ({
        ...prev,
        languagesSpoken: [...prev.languagesSpoken, language]
      }));
    }
  };

  // Remove language
  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languagesSpoken: prev.languagesSpoken.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      const doctorData = {
        ...formData,
        uid: user.uid
      };
      await setDoc(doc(db,"user-data",user.uid),doctorData);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
    // Add your form submission logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar role={role} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        isMobile 
          ? sidebarOpen 
            ? 'ml-0' 
            : 'ml-0'
          : 'lg:ml-64'
      }`}>
        <div className="p-4 md:p-6 lg:p-8">
          {/* Container with responsive margins */}
          <div className={`max-w-6xl mx-auto ${
            isMobile ? '' : ''
          }`}>
            {/* Header */}
            <div className="mb-6 md:mb-8 lg:mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Doctor Profile Form</h1>
              <p className="text-gray-600 text-sm md:text-base">Please fill in the details below to complete the doctor's profile</p>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Left Column */}
                <div className="space-y-6 md:space-y-8">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="Dr. John Doe"
                    />
                  </div>

                  {/* Gender and Date of Birth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-white"
                    >
                      <option value="">Select Branch</option>
                      {branchOptions.map((branch, index) => (
                        <option key={index} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Years of Experience */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Years of Experience <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="60"
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6 md:space-y-8">
                  {/* About */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      About <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="about"
                      value={formData.about}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none resize-none"
                      placeholder="Brief description about the doctor's expertise and approach..."
                      required
                    />
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-3 md:space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Qualifications <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newQualification}
                        onChange={(e) => setNewQualification(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                        className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                        placeholder="Add a qualification (e.g., MD, PhD)"
                      />
                      <button
                        type="button"
                        onClick={addQualification}
                        className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white font-semibold rounded-lg md:rounded-xl hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                    
                    {/* Qualifications List */}
                    {formData.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.qualifications.map((qual, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 md:px-4 md:py-2 rounded-full group hover:bg-blue-200 transition-all duration-200"
                          >
                            <span className="text-sm font-medium">{qual}</span>
                            <button
                              type="button"
                              onClick={() => removeQualification(index)}
                              className="text-blue-600 hover:text-blue-800 text-lg font-bold transition-colors duration-200"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Languages Spoken */}
                  <div className="space-y-3 md:space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Languages Spoken
                    </label>
                    
                    {/* Language Selection */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {languageOptions.map((language, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addLanguage(language)}
                            disabled={formData.languagesSpoken.includes(language)}
                            className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              formData.languagesSpoken.includes(language)
                                ? 'bg-blue-600 text-white cursor-default'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                            }`}
                          >
                            {language}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Selected Languages List */}
                    {formData.languagesSpoken.length > 0 && (
                      <div className="mt-3 md:mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected Languages:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.languagesSpoken.map((language, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 md:px-4 md:py-2 rounded-full group hover:bg-green-200 transition-all duration-200"
                            >
                              <span className="text-sm font-medium">{language}</span>
                              <button
                                type="button"
                                onClick={() => removeLanguage(index)}
                                className="text-green-600 hover:text-green-800 text-lg font-bold transition-colors duration-200"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 md:px-10 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg md:rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-lg w-full sm:w-auto"
                  >
                    Save Doctor Profile
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorForm;