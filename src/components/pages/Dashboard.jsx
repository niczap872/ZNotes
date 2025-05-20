import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const [notebooks, setNotebooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchNotebooks()
  }, [user])

  const fetchNotebooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notebooks_with_tab_count')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotebooks(data || [])
    } catch (error) {
      console.error('Error fetching notebooks:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotebooks = notebooks.filter(notebook => 
    notebook.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Notebooks</h1>
        <div className="w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notebooks..."
            className="input"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="loading-spinner" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotebooks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                {searchTerm 
                  ? 'No notebooks match your search.' 
                  : 'You have no notebooks yet. Create one from the sidebar to get started!'}
              </p>
            </div>
          ) : (
            filteredNotebooks.map((notebook) => (
              <Link 
                key={notebook.id} 
                to={`/notebooks/${notebook.id}`}
                className="block"
              >
                <div className="card hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{notebook.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{notebook.description || 'No description'}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">
                      {notebook.tab_count} {notebook.tab_count === 1 ? 'tab' : 'tabs'}
                    </span>
                    <span className="text-gray-500">
                      {new Date(notebook.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard