
import React, { useEffect, useRef, useState } from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa'
import axios from 'axios'
import { ServerUrl } from '../App'
import { BsArrowRight } from 'react-icons/bs'

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions = [] } = interviewData || {}

  const username =
    interviewData?.username ||
    interviewData?.user?.name ||
    "there"

  const [submitError, setSubmitError] = useState("")
  const [isIntroPhase, setIntroPhase] = useState(true)
  const [isMicOn, setIsMicOn] = useState(false)

  const recognitionRef = useRef(null)
  const isMicRunning = useRef(false)

  const [isAiPlaying, setIsAiPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedBack, setFeedback] = useState("")
  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  )

  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voiceGender, setVoiceGender] = useState("female")
  const [subTitle, setSubTitle] = useState("")

  const videoRef = useRef(null)

  const currentQuestion = questions[currentIndex]

  // Load AI voices
  useEffect(() => {
    const loadVoices = () => {
      const Voices = window.speechSynthesis.getVoices()

      const femaleVoice = Voices.find(v =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female")
      )

      if (femaleVoice) {
        setSelectedVoice(femaleVoice)
        setVoiceGender("female")
        return
      }

      const maleVoice = Voices.find(v =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male")
      )

      if (maleVoice) {
        setSelectedVoice(maleVoice)
        setVoiceGender("male")
        return
      }

      if (Voices.length > 0) {
        setSelectedVoice(Voices[0])
        setVoiceGender("female")
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo

  // Start microphone
  const startMic = () => {
    if (
      recognitionRef.current &&
      !isAiPlaying &&
      !isMicRunning.current
    ) {
      try {
        isMicRunning.current = true
        recognitionRef.current.start()
      } catch (error) {
        isMicRunning.current = false
        console.log(error)
      }
    }
  }

  // Stop microphone
  const stopMic = () => {
    if (recognitionRef.current && isMicRunning.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log(error)
      }
    }
  }

  // Speak function
  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const humanText = String(text || "")
        .replace(/,/g, ", ... ")
        .replace(/\./g, ". ...")

      const utterance = new SpeechSynthesisUtterance(humanText)

      utterance.voice = selectedVoice
      utterance.rate = 0.92
      utterance.pitch = 1.05
      utterance.volume = 1

      utterance.onstart = () => {
        setIsAiPlaying(true)
        stopMic()
        videoRef.current?.play()
      }

      utterance.onend = () => {
        videoRef.current?.pause()

        if (videoRef.current) {
          videoRef.current.currentTime = 0
        }

        setIsAiPlaying(false)

        setSubTitle("")

        resolve()
      }

      utterance.onerror = () => {
        setIsAiPlaying(false)
        videoRef.current?.pause()
        setSubTitle("")
        resolve()
      }

      setSubTitle(text || "")

      window.speechSynthesis.speak(utterance)
    })
  }

  // Intro and question speaking
  useEffect(() => {
    if (!selectedVoice) return

    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${username}, it's great to meet you today. I hope you're feeling confident and ready.`
        )

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        )

        setIntroPhase(false)

      } else if (currentQuestion) {
        await new Promise((r) => setTimeout(r, 800))

        if (currentIndex === questions.length - 1) {
          await speakText(
            "Alright, this one might be a bit more challenging"
          )
        }

        await speakText(currentQuestion.question)

        // Start microphone after AI finishes speaking
        setIsMicOn(true)
        startMic()
      }
    }

    runIntro()

  }, [selectedVoice, isIntroPhase, currentIndex])

  // Timer
  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion ||
      isSubmitting ||
      feedBack
    ) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)

  }, [isIntroPhase, currentIndex, isSubmitting, feedBack])

  // Speech recognition setup
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return

    const recognition = new window.webkitSpeechRecognition()

    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onstart = () => {
      isMicRunning.current = true
    }

    recognition.onend = () => {
      isMicRunning.current = false
    }

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript

      setAnswer((prev) => prev + " " + transcript)
    }

    recognitionRef.current = recognition

  }, [])

  // Toggle microphone
  const toggleMic = () => {
    if (isMicOn) {
      stopMic()
      setIsMicOn(false)
    } else {
      setIsMicOn(true)
      startMic()
    }
  }

  // Submit answer
  const submitAnswer = async () => {
    if (isSubmitting) return

   if (!answer.trim()) {
  const message = "You didn't submit an answer."
  setSubmitError(message)
  speakText(message)
  return
}

    setIsSubmitting(true)
    setSubmitError("")
    stopMic()
    setIsMicOn(false)

    try {
      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken: (currentQuestion.timeLimit || 60) - timeLeft,
        },
        { withCredentials: true }
      )

      console.log("Submit Answer Response:", result.data)

      const feedback =
        result.data.feedBack || result.data.feedback

      if (!feedback) {
        console.log("Feedback missing in backend response")
        setFeedback("Your answer has been submitted successfully.")
      } else {
        setFeedback(feedback)
        speakText(feedback)
      }

    } catch (error) {
      console.log(
        "Submit Answer Error:",
        error.response?.data || error.message
      )

      setSubmitError(
        error.response?.data?.message ||
        "Failed to submit answer. Please try again."
      )

    } finally {
      setIsSubmitting(false)
    }
  }

  // Next question
  const handleNext = async () => {
    setAnswer("")
    setFeedback("")
    setSubmitError("")
    setIsMicOn(false)

    if (currentIndex + 1 >= questions.length) {
      finishInterview()
      return
    }

    await speakText("Alright, let's move to the next question.")

    const nextIndex = currentIndex + 1

    setTimeLeft(questions[nextIndex]?.timeLimit || 60)
    setCurrentIndex(nextIndex)
  }

  // Finish interview
 const finishInterview = async () => {
  stopMic()
  setIsMicOn(false)

  try {
    console.log("Finishing Interview...");
    console.log("Interview ID:", interviewId);

    const result = await axios.post(
      ServerUrl + "/api/interview/finish",
      { interviewId },
      { withCredentials: true }
    )

    console.log("Finish API Response:", result.data);

    onFinish(result.data)

  } catch (error) {
    console.log(
      "Finish Interview Error:",
      error.response?.data || error.message
    )
  }
}

  // Auto submit when timer reaches zero
  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return

    if (timeLeft === 0 && !isSubmitting && !feedBack) {
      submitAnswer()
    }

  }, [timeLeft])

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (error) {
          console.log(error)
        }
      }

      window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className='min-h-screen bg-linear-to-br from-emerald-50 via-white to-teal-100
    flex items-center justify-center p-4 sm:p-6'>

      <div className='w-full max-w-350 min-h-[80vh] bg-white rounded-3xl
      shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden'>

        {/* video section */}
        <div className='w-full lg:w-[35%] bg-white flex flex-col items-center
        p-6 space-y-6 border-r border-gray-200'>

          <div className='w-full max-w-md rounded-2xl overflow-hidden shadow-xl'>
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload='auto'
              className='w-full h-auto object-cover'
            />
          </div>

          {/* subtitle */}
          {subTitle && (
            <div className='w-full max-w-md bg-gray-50 border border-gray-200
            rounded-xl p-4 shadow-sm'>

              <p className='text-gray-700 text-sm sm:text-base font-medium
              text-center leading-relaxed'>
                {subTitle}
              </p>

            </div>
          )}

          {/* timer area */}
          <div className='w-full max-w-md bg-white border border-gray-200
          rounded-2xl shadow-md p-6 space-y-5'>

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-500'>
                Interview Status
              </span>

              {isAiPlaying && (
                <span className='text-sm font-semibold text-emerald-600'>
                  AI Speaking
                </span>
              )}
            </div>

            <div className='h-px bg-gray-200'></div>

            <div className='flex justify-center'>
              <Timer
                timeLeft={timeLeft}
                totalTime={currentQuestion?.timeLimit || 60}
              />
            </div>

            <div className='h-px bg-gray-200'></div>

            <div className='grid grid-cols-2 gap-6 text-center'>

              <div>
                <span className='text-2xl font-bold text-emerald-600'>
                  {currentIndex + 1}
                </span>

                <span className='text-xs text-gray-400'>
                  Current Question
                </span>
              </div>

              <div>
                <span className='text-2xl font-bold text-emerald-600'>
                  {questions.length}
                </span>

                <span className='text-xs text-gray-400'>
                  Total Questions
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Text section */}
        <div className='flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative'>

          <h2 className='text-xl sm:text-2xl font-bold text-emerald-600 mb-6'>
            AI Smart Interview
          </h2>

          {!isIntroPhase && (
            <div className='relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl
            border border-gray-200 shadow-sm'>

              <p className='text-xs sm:text-sm text-gray-400 mb-2'>
                {currentIndex + 1} of {questions.length}
              </p>

              <div className='text-base sm:text-lg font-semibold text-gray-800
              leading-relaxed'>
                {currentQuestion?.question}
              </div>

            </div>
          )}

          <textarea
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
            placeholder='Type Your answer here...'
            className='flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none
            outline-none border border-gray-200 focus:ring-2
            focus:ring-emerald-500 transition text-gray-800'
          />

          {submitError && (
            <p className="text-red-500 mt-3 text-sm">
              {submitError}
            </p>
          )}

          {!feedBack ? (
            <div className='flex items-center gap-4 mt-6'>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMic}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center
                justify-center rounded-full bg-black text-white shadow-lg"
              >
                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash size={20} />
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={submitAnswer}
                disabled={isSubmitting}
                className='flex-1 bg-gradient-to-r from-emerald-600
                to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg
                hover:opacity-90 transition font-semibold disabled:bg-gray-500'
              >
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </motion.button>

            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mt-6 bg-emerald-50 border border-emerald-200
              p-5 rounded-2xl shadow-sm'
            >

              <p className='text-emerald-700 font-medium mb-4'>
                {feedBack}
              </p>

              <button
                onClick={handleNext}
                className='w-full bg-gradient-to-r from-emerald-600
                to-teal-500 text-white py-3 rounded-xl shadow-sm
                hover:opacity-90 transition flex items-center justify-center gap-1'
              >
                Next Question <BsArrowRight size={18} />
              </button>

            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Step2Interview
