import { createBrowserRouter, Navigate } from 'react-router';
import AdminDashboard from './components/admin/pages/dashboard/AdminDashboard.js';
import AdminListingReview from './components/admin/pages/listing-review/AdminListingReview.js';
import AdminAgentReview from './components/admin/pages/agent-review/AdminAgentReview.js';
import { AdminAgentDetails, AdminListingDetails } from './components/admin/shared/DetailsView.js';
import AgentApp, { AgentIndexRedirect } from './components/agent/AgentApp.js';
import AgentDashboard from './components/agent/pages/dashboard/AgentDashboard.js';
import AgentListings from './components/agent/pages/listings/AgentListings.js';
import AgentAddListing from './components/agent/pages/add-listing/AgentAddListing.js';
import AgentListingDetails from './components/agent/pages/listing-details/AgentListingDetails.js';
import AgentWorkspacePage from './components/agent/pages/workspace/AgentWorkspacePage.js';
import App from './App.js';
import AuthLogin from './auth/AuthLogin.js';
import BuyerApp, { BuyerIndexRedirect, BuyerRoutePlaceholder } from './buyer/BuyerApp.js';
import BuyerHome from './buyer/pages/BuyerHome/BuyerHome.js';
import BuyerMessages from './buyer/pages/BuyerMessages/BuyerMessages.js';
import BuyerMap from './buyer/pages/BuyerMap/BuyerMap.js';
import BuyerNotifications from './buyer/pages/BuyerNotifications/BuyerNotifications.js';
import BuyerProfile from './buyer/pages/BuyerProfile/BuyerProfile.js';
import BuyerProperties from './buyer/pages/BuyerProperties/BuyerProperties.js';
import BuyerPropertyDetails from './buyer/pages/BuyerPropertyDetails/BuyerPropertyDetails.js';
import BuyerSaved from './buyer/pages/BuyerSaved/BuyerSaved.js';
import BuyerViewings from './buyer/pages/BuyerViewings/BuyerViewings.js';
import PropertyMapPage from './shared/maps/PropertyMapPage.js';
import StaffGate from './shared/maps/StaffGate.js';
import StaffMapPage from './shared/maps/StaffMapPage.js';

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/auth/login', Component: AuthLogin },
  {
    path: '/admin',
    Component: () => <StaffGate role="admin" />,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'map', Component: () => <StaffMapPage role="admin" /> },
      { path: 'listing-reviews', Component: AdminListingReview },
      { path: 'listing-reviews/:listId', Component: AdminListingDetails },
      { path: 'agent-reviews', Component: AdminAgentReview },
      { path: 'agent-reviews/:agentId', Component: AdminAgentDetails },
    ],
  },
  {
    path: '/buyer',
    element: <BuyerApp />,
    children: [
      { index: true, Component: BuyerIndexRedirect },
      { path: 'home', element: <BuyerHome /> },
      { path: 'messages', element: <BuyerMessages /> },
      { path: 'map', element: <BuyerMap /> },
      { path: 'viewings', element: <BuyerViewings /> },
      { path: 'properties', element: <BuyerProperties /> },
      { path: 'properties/:propertyId', element: <BuyerPropertyDetails /> },
      { path: 'saved', element: <BuyerSaved /> },
      { path: 'offers', element: <BuyerRoutePlaceholder title="Offers" /> },
      { path: 'notifications', element: <BuyerNotifications /> },
      { path: 'profile', element: <BuyerProfile /> },
      { path: '*', element: <Navigate to="/buyer/home" replace /> },
    ],
  },
  { path: '/visitor', Component: () => <PropertyMapPage role="visitor" mode="list" /> },
  { path: '/visitor/map', Component: () => <PropertyMapPage role="visitor" mode="map" /> },
  { path: '/agent', Component: AgentApp, children: [
    { index: true, Component: AgentIndexRedirect },
    { path: 'dashboard', Component: AgentDashboard },
    { path: 'my-listings/:listingId', Component: AgentListingDetails },
    { path: 'my-listings', Component: AgentListings },
    { path: 'map', Component: () => <StaffMapPage role="agent" /> },
    { path: 'add-listings', Component: AgentAddListing },
    { path: 'viewings', Component: AgentWorkspacePage },
    { path: 'activity', Component: AgentWorkspacePage },
    { path: 'inquiries', Component: AgentWorkspacePage },
    { path: 'messages', Component: AgentWorkspacePage },
    { path: 'profile', Component: AgentWorkspacePage },
  ] },
]);

export default router;
