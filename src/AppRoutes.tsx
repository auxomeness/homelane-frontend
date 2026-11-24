import { createBrowserRouter } from "react-router";
import AdminDashboard from "./components/admin/pages/dashboard/AdminDashboard"; 
import App from "./App";
import AdminListingReview from "./components/admin/pages/listing-review/AdminListingReview";
import AdminAddListing from "./components/admin/pages/listing-review/AdminAddListing";
import AdminAgentReview from "./components/admin/pages/agent-review/AdminAgentReview";
import AgentApp, { AgentIndexRedirect } from "./components/agent/AgentApp";
import AgentDashboard from "./components/agent/pages/dashboard/AgentDashboard";
import AgentListings from "./components/agent/pages/listings/AgentListings";
import AgentAddListing from "./components/agent/pages/add-listing/AgentAddListing";
import AgentListingDetails from "./components/agent/pages/listing-details/AgentListingDetails";
import AgentWorkspacePage from "./components/agent/pages/workspace/AgentWorkspacePage";
import DiscoveryApp, { DiscoveryIndexRedirect, DiscoveryPlaceholder } from "./discovery/DiscoveryApp";
import Messages from "./discovery/pages/Messages";
import Notifications from "./discovery/pages/Notifications";
import Viewings from "./discovery/pages/Viewings";
import PropertyMapPage from "./shared/maps/PropertyMapPage";
import RoleGate from "./shared/maps/RoleGate";
import RoleMapPage from "./shared/maps/RoleMapPage";
import AgentApplicationPage from "./shared/agents/AgentApplicationPage";
import { AdminAgentDetails, AdminListingDetails } from "./components/admin/shared/DetailsView";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/admin",
    Component: () => <RoleGate role="admin" />,
    // Component: AdminDashboard,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "map", Component: () => <RoleMapPage role="admin" /> },
      { path: "listing-reviews", Component: AdminListingReview },
      { path: "add-listing", Component: AdminAddListing },
      { path: "listing-reviews/:listId", Component: AdminListingDetails },

      { path: "agent-reviews", Component: AdminAgentReview },
      { path: "agent-reviews/:agentId", Component: AdminAgentDetails },
    ],
  },
  {
    path: "/visitor",
    Component: () => <PropertyMapPage role="visitor" mode="list" />,
  },
  {
    path: "/visitor/map",
    Component: () => <PropertyMapPage role="visitor" mode="map" />,
  },
  {
    path: "/buyer",
    Component: () => <PropertyMapPage role="buyer" mode="list" />,
  },
  {
    path: "/buyer/map",
    Component: () => <PropertyMapPage role="buyer" mode="map" />,
  },
  {
    path: "/discovery",
    Component: DiscoveryApp,
    children: [
      { index: true, Component: DiscoveryIndexRedirect },
      { path: "map", Component: () => <PropertyMapPage role="buyer" mode="map" basePath="/discovery" listPath="/discovery/properties" embedded /> },
      { path: "messages", Component: Messages },
      { path: "notifications", Component: Notifications },
      { path: "viewings", Component: Viewings },
      { path: "home", element: <DiscoveryPlaceholder title="Home" /> },
      { path: "properties", Component: () => <PropertyMapPage role="buyer" mode="list" basePath="/discovery" listPath="/discovery/properties" embedded /> },
      { path: "*", Component: DiscoveryIndexRedirect },
    ],
  },
  {
    path: "/agent",
    Component: AgentApp,
    children: [
      { index: true, Component: AgentIndexRedirect },
      { path: "dashboard", Component: AgentDashboard },
      { path: "my-listings/:listingId", Component: AgentListingDetails },
      { path: "my-listings", Component: AgentListings },
      { path: "map", Component: () => <RoleMapPage role="agent" /> },
      { path: "add-listings", Component: AgentAddListing },
      { path: "viewings", Component: AgentWorkspacePage },
      { path: "activity", Component: AgentWorkspacePage },
      { path: "inquiries", Component: AgentWorkspacePage },
      { path: "messages", Component: AgentWorkspacePage },
      { path: "profile", Component: AgentWorkspacePage },
    ],
  },
  {
    path: "/apply/agent",
    Component: AgentApplicationPage,
  },
]);

export default AppRoutes;
