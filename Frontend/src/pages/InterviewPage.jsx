
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import Step1SetUp from '../components/Step1SetUp'
import Step2Interview from '../components/Step2Interview'
import Step3Report from '../components/Step3Report'

function InterviewPage() {
  const [step, setStep] = useState(1)
  const [interviewData, setInterviewData] = useState(null)

  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)

  return (
    <div className='min-h-screen bg-gray-50'>
      {step === 1 && (
        <Step1SetUp onStart={(data) => {
          setInterviewData(data)
          setStep(2)
        }} />
      )}

      {step === 2 && (
        <Step2Interview
          interviewData={interviewData}
          onFinish={(report) => {
            dispatch(setUserData({
              ...userData,
              credits: report.creditsLeft
            }))

            setInterviewData(report)
            setStep(3)
          }}
        />
      )}

      {step === 3 && (
        <Step3Report report={interviewData} />
      )}
    </div>
  )
}

export default InterviewPage
