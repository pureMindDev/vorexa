import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import { SocketProvider } from './context/SocketContext';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import Learning from './pages/Learning/Learning';
import CourseDetail from './pages/CourseDetail/CourseDetail';
import LessonView from './pages/LessonView/LessonView';
import CBT from './pages/CBT/CBT';
import ExamTaking from './pages/ExamTaking/ExamTaking';
import ExamResult from './pages/ExamResult/ExamResult';
import ExamReview from './pages/ExamReview/ExamReview';
import AITutor from './pages/AITutor/AITutor';
import StudyTools from './pages/StudyTools/StudyTools';
import StudyPlanner from './pages/StudyPlanner/StudyPlanner';
import CalendarPage from './pages/Calendar/Calendar';
import PaymentHistory from './pages/PaymentHistory/PaymentHistory';
import AcademicJourney from './pages/AcademicJourney/AcademicJourney';
import CVBuilder from './pages/CVBuilder/CVBuilder';
import Opportunities from './pages/Opportunities/Opportunities';
import Feed from './pages/Feed/Feed';
import UserProfile from './pages/UserProfile/UserProfile';
import Messages from './pages/Messages/Messages';
import Leaderboard from './pages/Leaderboard/Leaderboard';
import Achievements from './pages/Achievements/Achievements';
import Certificate from './pages/Certificate/Certificate';
import StudyGroups from './pages/StudyGroups/StudyGroups';
import CreateGroup from './pages/CreateGroup/CreateGroup';
import GroupDetail from './pages/GroupDetail/GroupDetail';
import TutorMarketplace from './pages/TutorMarketplace/TutorMarketplace';
import TutorProfileDetail from './pages/TutorProfileDetail/TutorProfileDetail';
import MyBookings from './pages/MyBookings/MyBookings';
import Profile from './pages/Profile/Profile';
import Settings from './pages/Settings/Settings';
import Saved from './pages/Saved/Saved';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import NotFound from './pages/NotFound/NotFound';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import AppLayout from './components/AppLayout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import TutorRegister from './pages/tutor/TutorRegister/TutorRegister';
import TutorDashboard from './pages/tutor/TutorDashboard/TutorDashboard';
import TutorBookings from './pages/tutor/TutorBookings/TutorBookings';
import TutorProfileEdit from './pages/tutor/TutorProfileEdit/TutorProfileEdit';
import TutorReviews from './pages/tutor/TutorReviews/TutorReviews';
import TutorSettings from './pages/tutor/TutorSettings/TutorSettings';
import TutorLayout from './components/TutorLayout/TutorLayout';
import TutorProtectedRoute from './components/TutorProtectedRoute/TutorProtectedRoute';
import AdminLayout from './components/AdminLayout/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute/AdminProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers/AdminUsers';
import AdminTutors from './pages/admin/AdminTutors/AdminTutors';
import AdminPayments from './pages/admin/AdminPayments/AdminPayments';
import AdminModeration from './pages/admin/AdminModeration/AdminModeration';
import AdminSupportTickets from './pages/admin/AdminSupportTickets/AdminSupportTickets';
import AccountabilityPartners from './pages/AccountabilityPartners/AccountabilityPartners';
import LiveClasses from './pages/LiveClasses/LiveClasses';
import LiveClassRoom from './pages/LiveClassRoom/LiveClassRoom';
import ParentRegister from './pages/parent/ParentRegister/ParentRegister';
import ParentLayout from './components/ParentLayout/ParentLayout';
import ParentProtectedRoute from './components/ParentProtectedRoute/ParentProtectedRoute';
import ParentDashboard from './pages/parent/ParentDashboard/ParentDashboard';
import ParentLinkChild from './pages/parent/ParentLinkChild/ParentLinkChild';
import CentreRegister from './pages/centre/CentreRegister/CentreRegister';
import CentreProtectedRoute from './components/CentreProtectedRoute/CentreProtectedRoute';
import CentreLayout from './components/CentreLayout/CentreLayout';
import CentreDashboard from './pages/centre/CentreDashboard/CentreDashboard';
import CentreMembers from './pages/centre/CentreMembers/CentreMembers';
import CentreExams from './pages/centre/CentreExams/CentreExams';
import CentreExamBuilder from './pages/centre/CentreExamBuilder/CentreExamBuilder';
import CentreExamResults from './pages/centre/CentreExamResults/CentreExamResults';
import CentreReports from './pages/centre/CentreReports/CentreReports';

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <CallProvider><Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/tutor/register" element={<TutorRegister />} />
            <Route path="/parent/register" element={<ParentRegister />} />
            <Route path="/centre/register" element={<CentreRegister />} />
  
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
  
            <Route
              path="/certificate/:courseId"
              element={
                <ProtectedRoute>
                  <Certificate />
                </ProtectedRoute>
              }
            />
  
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learning" element={<Learning />} />
              <Route path="/learning/:id" element={<CourseDetail />} />
              <Route path="/learning/:courseId/lesson/:lessonId" element={<LessonView />} />
              <Route path="/cbt" element={<CBT />} />
              <Route path="/cbt/exam" element={<ExamTaking />} />
              <Route path="/cbt/result" element={<ExamResult />} />
              <Route path="/cbt/review/:attemptId" element={<ExamReview />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route path="/ai-tutor/:conversationId" element={<AITutor />} />
              <Route path="/study-tools" element={<StudyTools />} />
              <Route path="/study-planner" element={<StudyPlanner />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/payments" element={<PaymentHistory />} />
              <Route path="/academic-journey" element={<AcademicJourney />} />
              <Route path="/career/cv" element={<CVBuilder />} />
              <Route path="/career/opportunities" element={<Opportunities />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/users/:userId" element={<UserProfile />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:conversationId" element={<Messages />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/groups" element={<StudyGroups />} />
              <Route path="/groups/create" element={<CreateGroup />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/accountability" element={<AccountabilityPartners />} />
              <Route path="/live-classes" element={<LiveClasses />} />
              <Route path="/live-classes/:id" element={<LiveClassRoom />} />
              <Route path="/tutors" element={<TutorMarketplace />} />
              <Route path="/tutors/:id" element={<TutorProfileDetail />} />
              <Route path="/bookings" element={<MyBookings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/saved" element={<Saved />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
            </Route>
  
            <Route
              element={
                <TutorProtectedRoute>
                  <TutorLayout />
                </TutorProtectedRoute>
              }
            >
              <Route path="/tutor/dashboard" element={<TutorDashboard />} />
              <Route path="/tutor/bookings" element={<TutorBookings />} />
              <Route path="/tutor/profile" element={<TutorProfileEdit />} />
              <Route path="/tutor/reviews" element={<TutorReviews />} />
              <Route path="/tutor/settings" element={<TutorSettings />} />
              <Route path="/tutor/live-classes" element={<LiveClasses />} />
              <Route path="/tutor/live-classes/:id" element={<LiveClassRoom />} />
              <Route path="/tutor/feed" element={<Feed />} />
              <Route path="/tutor/messages" element={<Messages />} />
              <Route path="/tutor/messages/:conversationId" element={<Messages />} />
            </Route>

            <Route
              element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tutors" element={<AdminTutors />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/support" element={<AdminSupportTickets />} />
            </Route>

            <Route
              element={
                <ParentProtectedRoute>
                  <ParentLayout />
                </ParentProtectedRoute>
              }
            >
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/link-child" element={<ParentLinkChild />} />
            </Route>

            <Route
              element={
                <CentreProtectedRoute>
                  <CentreLayout />
                </CentreProtectedRoute>
              }
            >
              <Route path="/centre/dashboard" element={<CentreDashboard />} />
              <Route path="/centre/members" element={<CentreMembers />} />
              <Route path="/centre/live-classes" element={<LiveClasses />} />
              <Route path="/centre/live-classes/:id" element={<LiveClassRoom />} />
              <Route path="/centre/feed" element={<Feed />} />
              <Route path="/centre/messages" element={<Messages />} />
              <Route path="/centre/messages/:conversationId" element={<Messages />} />
              <Route path="/centre/exams" element={<CentreExams />} />
              <Route path="/centre/exams/new" element={<CentreExamBuilder />} />
              <Route path="/centre/exams/:id/results" element={<CentreExamResults />} />
              <Route path="/centre/reports" element={<CentreReports />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CallProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
