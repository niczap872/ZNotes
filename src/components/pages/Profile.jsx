import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const Profile = () => {
  const { profile, updateProfile, loading } = useAuth()
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState({ message: '', error: false })

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveStatus({ message: '', error: false })

    try {
      const { error } = await updateProfile(formData)
      
      if (error) {
        setSaveStatus({ message: error.message, error: true })
      } else {
        setSaveStatus({ message: 'Profile updated successfully!', error: false })
        setIsEditing(false)
      }
    } catch (error) {
      setSaveStatus({ message: 'An unexpected error occurred.', error: true })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Your Profile</h2>
        </div>
        
        <div className="p-6">
          {saveStatus.message && (
            <div 
              className={`mb-4 p-3 rounded-md ${
                saveStatus.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}
            >
              {saveStatus.message}
            </div>
          )}
          
          <div className="flex items-center mb-6">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'}
                className="w-20 h-20 rounded-full mr-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : profile?.email.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium text-gray-700">
                {profile?.full_name || 'User'}
              </h3>
              <p className="text-gray-500">
                {profile?.email}
              </p>
            </div>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      full_name: profile?.full_name || '',
                    })
                  }}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Full Name</h4>
                <p className="text-gray-900">{profile?.full_name || 'Not set'}</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile