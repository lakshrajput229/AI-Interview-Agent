import React, { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import axios from "axios"
import { useDispatch } from 'react-redux'
import { setUserData } from './redux/userSlice'
import InterviewPage from './pages/InterviewPage'
import InterviewHistory from './pages/InterviewHistory'
import Pricing from './pages/Pricing'
import InterviewReport from './pages/InterviewReport'

export const ServerUrl = "https://ai-interview-agent-t2q0.onrender.com"

const App = () => {
  const [user, setUser] = useState(null)

  const dispatch = useDispatch()
  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(`${ServerUrl}/api/user/current-user`, { withCredentials: true })
        dispatch(setUserData(result.data))
        console.log("Current user fetched:", result.data)
        setUser(result.data)
      } catch (error) {
        console.log("Failed to fetch user:", error?.response?.data || error)
        dispatch(setUserData(null))
      }
    }
    getUser()
  }, [dispatch])

  return (
    <Routes>
      <Route path='/' element={<Home user={user} />} />
      <Route path='/auth' element={<Auth />} />
      <Route path='/interview' element={<InterviewPage />} />
      <Route path='/history' element={<InterviewHistory/>} />
      <Route path='/Pricing' element={<Pricing/>} />
      <Route path='/report/:id' element={<InterviewReport />} />
    </Routes>
  )
}

export default App
