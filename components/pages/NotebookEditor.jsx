import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const NotebookEditor = () => {
  const { notebookId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [notebook, setNotebook] = useState(null)
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState(null)
  const [noteContent, setNoteContent] = useState('')
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [notebookTitle, setNotebookTitle] = useState('')
  const [isAddingTab, setIsAddingTab] = useState(false)
  const [newTabTitle, setNewTabTitle] = useState('')
  const [isRenamingTab, setIsRenamingTab] = useState(false)
  const [editingTabId, setEditingTabId] = useState(null)
  const [renameTabTitle, setRenameTabTitle] = useState('')

  // Debounce save function
  const debounce = (func, delay) => {
    let timeoutId
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const debouncedSave = debounce(saveNote, 1000)

  useEffect(() => {
    if (notebookId && user) {
      fetchNotebookData()
    }
  }, [notebookId, user])

  useEffect(() => {
    if (activeTabId && noteContent) {
      debouncedSave()
    }
  }, [noteContent])

  const fetchNotebookData = async () => {
    try {
      setLoading(true)
      
      // Fetch notebook details
      const { data: notebookData, error: notebookError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('id', notebookId)
        .single()
      
      if (notebookError) throw notebookError
      
      setNotebook(notebookData)
      setNotebookTitle(notebookData.title)
      
      // Fetch tabs for the notebook
      const { data: tabsData, error: tabsError } = await supabase
        .from('tabs')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('position', { ascending: true })
      
      if (tabsError) throw tabsError
      
      setTabs(tabsData || [])
      
      // Set active tab to the first tab if available
      if (tabsData && tabsData.length > 0) {
        const firstTab = tabsData[0]
        setActiveTabId(firstTab.id)
        
        // Fetch note content for the active tab
        await fetchNoteContent(firstTab.id)
      }
    } catch (error) {
      console.error('Error fetching notebook data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchNoteContent = async (tabId) => {
    try {
      // Fetch note content for the tab
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('tab_id', tabId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "row not found" error
        throw error
      }
      
      // If note exists, set content, otherwise set empty content
      setNoteContent(data?.content || '')
    } catch (error) {
      console.error('Error fetching note content:', error.message)
      setNoteContent('')
    }
  }

  const handleTabChange = async (tabId) => {
    try {
      // Save current note content before switching tabs
      if (activeTabId && noteContent) {
        await saveNote()
      }
      
      setActiveTabId(tabId)
      await fetchNoteContent(tabId)
    } catch (error) {
      console.error('Error changing tab:', error.message)
    }
  }

  async function saveNote() {
    if (!activeTabId || !noteContent || saving) return
    
    try {
      setSaving(true)
      
      // Check if note exists
      const { data: existingNote, error: checkError } = await supabase
        .from('notes')
        .select('id')
        .eq('tab_id', activeTabId)
        .maybeSingle()
      
      if (checkError) throw checkError
      
      let saveError
      
      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update({ content: noteContent })
          .eq('id', existingNote.id)
        
        saveError = error
      } else {
        // Insert new note
        const { error } = await supabase
          .from('notes')
          .insert([{ tab_id: activeTabId, content: noteContent }])
        
        saveError = error
      }
      
      if (saveError) throw saveError
      
      // Update last saved timestamp
      setLastSaved(new Date())
      
      // Update notebook updated_at timestamp
      await supabase
        .from('notebooks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notebookId)
      
    } catch (error) {
      console.error('Error saving note:', error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateNotebookTitle = async () => {
    if (!notebookTitle.trim()) {
      setNotebookTitle(notebook.title)
      setIsEditingTitle(false)
      return
    }
    
    try {
      const { error } = await supabase
        .from('notebooks')
        .update({ title: notebookTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', notebookId)
      
      if (error) throw error
      
      setNotebook({ ...notebook, title: notebookTitle.trim() })
    } catch (error) {
      console.error('Error updating notebook title:', error.message)
      setNotebookTitle(notebook.title)
    } finally {
      setIsEditingTitle(false)
    }
  }

  const createNewTab = async () => {
    if (!newTabTitle.trim()) {
      setIsAddingTab(false)
      setNewTabTitle('')
      return
    }
    
    try {
      // Find the highest position
      const highestPosition = tabs.length > 0 
        ? Math.max(...tabs.map(tab => tab.position)) 
        : -1
      
      const { data, error } = await supabase
        .from('tabs')
        .insert([
          {
            notebook_id: notebookId,
            title: newTabTitle.trim(),
            position: highestPosition + 1
          }
        ])
        .select()
      
      if (error) throw error
      
      // Update notebook updated_at timestamp
      await supabase
        .from('notebooks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notebookId)
      
      // Add the new tab to tabs state
      const newTab = data[0]
      setTabs([...tabs, newTab])
      
      // Switch to the new tab
      setActiveTabId(newTab.id)
      setNoteContent('')
      
    } catch (error) {
      console.error('Error creating new tab:', error.message)
    } finally {
      setIsAddingTab(false)
      setNewTabTitle('')
    }
  }

  const startRenamingTab = (tabId, currentTitle) => {
    setEditingTabId(tabId)
    setRenameTabTitle(currentTitle)
    setIsRenamingTab(true)
  }

  const renameTab = async () => {
    if (!renameTabTitle.trim() || !editingTabId) {
      setIsRenamingTab(false)
      setEditingTabId(null)
      setRenameTabTitle('')
      return
    }
    
    try {
      const { error } = await supabase
        .from('tabs')
        .update({ title: renameTabTitle.trim() })
        .eq('id', editingTabId)
      
      if (error) throw error
      
      // Update tabs state
      setTabs(tabs.map(tab => 
        tab.id === editingTabId 
          ? { ...tab, title: renameTabTitle.trim() } 
          : tab
      ))
      
      // Update notebook updated_at timestamp
      await supabase
        .from('notebooks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notebookId)
      
    } catch (error) {
      console.error('Error renaming tab:', error.message)
    } finally {
      setIsRenamingTab(false)
      setEditingTabId(null)
      setRenameTabTitle('')
    }
  }

  const deleteTab = async (tabId) => {
    if (tabs.length <= 1) {
      alert('Cannot delete the only tab. Notebooks must have at least one tab.')
      return
    }
    
    if (!confirm('Are you sure you want to delete this tab? This action cannot be undone.')) {
      return
    }
    
    try {
      // Delete the tab (cascade will delete associated notes)
      const { error } = await supabase
        .from('tabs')
        .delete()
        .eq('id', tabId)
      
      if (error) throw error
      
      // Update tabs state
      const updatedTabs = tabs.filter(tab => tab.id !== tabId)
      setTabs(updatedTabs)
      
      // If the active tab is being deleted, switch to another tab
      if (activeTabId === tabId && updatedTabs.length > 0) {
        const newActiveTab = updatedTabs[0]
        setActiveTabId(newActiveTab.id)
        fetchNoteContent(newActiveTab.id)
      }
      
      // Update notebook updated_at timestamp
      await supabase
        .from('notebooks')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', notebookId)
      
    } catch (error) {
      console.error('Error deleting tab:', error.message)
    }
  }

  const deleteNotebook = async () => {
    if (!confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) {
      return
    }
    
    try {
      // Delete the notebook (cascade will delete tabs and notes)
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId)
      
      if (error) throw error
      
      // Navigate back to dashboard
      navigate('/')
      
    } catch (error) {
      console.error('Error deleting notebook:', error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="loading-spinner" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Notebook not found</h2>
        <p className="text-gray-600 mt-2">This notebook may have been deleted or you don't have access to it.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 btn btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="notebook-editor">
      <div className="flex justify-between items-center mb-6">
        {isEditingTitle ? (
          <div className="flex items-center">
            <input
              type="text"
              value={notebookTitle}
              onChange={(e) => setNotebookTitle(e.target.value)}
              className="input mr-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateNotebookTitle()
                if (e.key === 'Escape') {
                  setNotebookTitle(notebook.title)
                  setIsEditingTitle(false)
                }
              }}
            />
            <button
              onClick={updateNotebookTitle}
              className="btn btn-primary"
            >
              Save
            </button>
            <button
              onClick={() => {
                setNotebookTitle(notebook.title)
                setIsEditingTitle(false)
              }}
              className="btn btn-secondary ml-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 mr-2">{notebook.title}</h1>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 text-gray-500 hover:text-blue-500"
              title="Edit Notebook Title"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center">
          {lastSaved && (
            <span className="text-sm text-gray-500 mr-4">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {saving && (
            <span className="text-sm text-gray-500 mr-4">Saving...</span>
          )}
          <button
            onClick={deleteNotebook}
            className="btn btn-danger"
            title="Delete Notebook"
          >
            Delete Notebook
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="notebook-tabs border-b">
          {tabs.map((tab) => (
            <div 
              key={tab.id}
              className={`tab group flex items-center ${activeTabId === tab.id ? 'active' : ''}`}
            >
              {isRenamingTab && editingTabId === tab.id ? (
                <div className="flex items-center">
                  <input
                    type="text"
                    value={renameTabTitle}
                    onChange={(e) => setRenameTabTitle(e.target.value)}
                    className="w-32 px-2 py-1 border rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') renameTab()
                      if (e.key === 'Escape') {
                        setIsRenamingTab(false)
                        setEditingTabId(null)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      renameTab()
                    }}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => handleTabChange(tab.id)}
                    className="cursor-pointer"
                  >
                    {tab.title}
                  </span>
                  <div className="ml-2 hidden group-hover:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startRenamingTab(tab.id, tab.title)
                      }}
                      className="p-1 text-gray-500 hover:text-blue-500"
                      title="Rename Tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTab(tab.id)
                      }}
                      className="p-1 text-gray-500 hover:text-red-500"
                      title="Delete Tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {isAddingTab ? (
            <div className="tab flex items-center">
              <input
                type="text"
                value={newTabTitle}
                onChange={(e) => setNewTabTitle(e.target.value)}
                placeholder="Tab name"
                className="w-32 px-2 py-1 border rounded text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createNewTab()
                  if (e.key === 'Escape') {
                    setIsAddingTab(false)
                    setNewTabTitle('')
                  }
                }}
              />
              <button
                onClick={createNewTab}
                className="ml-1 text-blue-500 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsAddingTab(false)
                  setNewTabTitle('')
                }}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTab(true)}
              className="tab flex items-center text-gray-500 hover:text-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Tab
            </button>
          )}
        </div>
        
        <div className="tab-content">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="text-editor"
            placeholder="Start typing your notes here..."
          />
        </div>
      </div>
    </div>
  )
}

export default NotebookEditor