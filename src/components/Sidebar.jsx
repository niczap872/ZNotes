import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/contexts/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [notebooks, setNotebooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')

  useEffect(() => {
    if (user) {
      fetchNotebooks()
    }
  }, [user])

  const fetchNotebooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notebooks')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setNotebooks(data || [])
    } catch (error) {
      console.error('Error fetching notebooks:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const createNewNotebook = async () => {
    if (!newNotebookTitle.trim()) return
    
    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert([
          { 
            title: newNotebookTitle.trim(),
            user_id: user.id 
          }
        ])
        .select()

      if (error) throw error
      
      // Create an initial tab for the new notebook
      if (data?.[0]?.id) {
        const { error: tabError } = await supabase
          .from('tabs')
          .insert([
            {
              notebook_id: data[0].id,
              title: 'First Tab',
              position: 0
            }
          ])
        
        if (tabError) throw tabError
      }
      
      setNewNotebookTitle('')
      setIsCreating(false)
      fetchNotebooks()
    } catch (error) {
      console.error('Error creating notebook:', error.message)
    }
  }

  return (
    <aside className="w-64 border-r bg-white overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">My Notebooks</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 text-gray-500 hover:text-blue-500"
            title="Create New Notebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {isCreating && (
          <div className="mb-4">
            <input
              type="text"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              placeholder="Notebook title"
              className="input mb-2"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={createNewNotebook}
                className="btn btn-primary text-sm flex-1"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewNotebookTitle('')
                }}
                className="btn btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <svg className="loading-spinner" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : (
          <ul className="space-y-1">
            {notebooks.length === 0 ? (
              <li className="text-sm text-gray-500 py-2">
                No notebooks yet. Create one to get started!
              </li>
            ) : (
              notebooks.map((notebook) => (
                <li key={notebook.id}>
                  <Link
                    to={`/notebooks/${notebook.id}`}
                    className={`block px-3 py-2 rounded-md text-sm ${
                      location.pathname === `/notebooks/${notebook.id}`
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {notebook.title}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default Sidebar