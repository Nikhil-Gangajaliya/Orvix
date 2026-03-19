import { Routes, Route } from 'react-router-dom'
import CandidateAuth from './cadidateAuth'
import CompanyAuth from './companyAuth'
const App = () => {
  return (
    <Routes>
      <Route path="/CandidateLogin" element={<CandidateAuth />} />
      <Route path="/" element={<CandidateAuth />} />
      <Route path="/CompanyLogin" element={<CompanyAuth />} />
    </Routes>

  )
}

export default App