import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';
import Agenda from './pages/Agenda.jsx';
import EventDetails from './pages/EventDetails.jsx';
import Secretaria from './pages/Secretaria.jsx';
import Announcements from './pages/Announcements.jsx';
import PrayerRequestForm from './pages/PrayerRequestForm.jsx';
import PrayerRequestsPublic from './pages/PrayerRequestsPublic.jsx';

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/eventos/:id" element={<EventDetails />} />
        <Route path="/secretaria" element={<Secretaria />} />
        <Route path="/avisos" element={<Announcements />} />
        <Route path="/oracao" element={<PrayerRequestsPublic />} />
        <Route path="/oracao/novo" element={<PrayerRequestForm />} />
      </Routes>
    </>
  );
}
