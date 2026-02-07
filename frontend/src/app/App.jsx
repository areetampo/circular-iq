import React from 'react';
import AppProvider from './AppProvider';
import AppRoutes from './AppRoutes';

/**
 * App - Main application component (Phase 5 refactor)
 *
 * Clean separation of concerns:
 * - AppProvider: Wraps providers (ErrorBoundary, BrowserRouter, Toaster)
 * - AppRoutes: Defines all routes with lazy-loaded pages
 * - App.jsx: Minimal wrapper - NO logic, NO state, NO API calls
 *
 * All business logic, state, and API calls are handled by:
 * - Custom hooks in src/features/assessments/hooks/
 * - API layer in src/features/assessments/api/assessmentApi.js
 * - Page components that consume hooks
 */

// export default function App() {
//   return (
//     <AppProvider>
//       <AppRoutes />
//     </AppProvider>
//   );
// }

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

// import {
//   Dropdown,
//   DropdownTrigger,
//   DropdownMenu,
//   DropdownSection,
//   DropdownItem,
// } from '@heroui/dropdown';
// import { Button, Avatar } from '@heroui/react';
// import { useState } from 'react';

// export default function App() {
//   const [isOpen, setIsOpen] = useState(false);
//   const toggleOpen = () => setIsOpen((prev) => !prev);
//   return (
//     <div className="flex items-center justify-center h-screen">
//       <Dropdown placement="bottom">
//         <DropdownTrigger onPress={toggleOpen}>
//           <Avatar>
//             <Avatar.Image
//               alt="John Doe"
//               src="https://img.heroui.chat/image/avatar?w=400&h=400&u=3"
//             />
//             <Avatar.Fallback>JD</Avatar.Fallback>
//           </Avatar>
//         </DropdownTrigger>
//         <DropdownMenu
//           aria-label="User Actions"
//           variant="flat"
//           isOpen={isOpen}
//           onOpenChange={setIsOpen}
//         >
//           <DropdownItem key="profile">Signed in as @tonyreichert</DropdownItem>
//           <DropdownItem key="settings">My Settings</DropdownItem>
//           <DropdownItem key="team_settings">Team Settings</DropdownItem>
//           <DropdownItem key="analytics">Analytics</DropdownItem>
//           <DropdownItem key="system">System</DropdownItem>
//           <DropdownItem key="configurations">Configurations</DropdownItem>
//           <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
//           <DropdownItem key="logout" color="danger">
//             Log Out
//           </DropdownItem>
//         </DropdownMenu>
//       </Dropdown>
//     </div>
//   );
// }

// ('use client');
// import { Tabs } from '@heroui/react';
// export default function App() {
//   const [open, setOpen] = React.useState(false);
//   const toggleOpen = () => setOpen((prev) => !prev);
//   return (
//     <div className="flex items-center justify-center h-screen">
//       <Tabs className="w-full max-w-md" orientation="vertical">
//         <Tabs.ListContainer>
//           <Tabs.List aria-label="Options">
//             <Tabs.Tab id="overview">
//               Overview
//               <Tabs.Indicator />
//             </Tabs.Tab>
//             <Tabs.Tab id="analytics">
//               Analytics
//               <Tabs.Indicator />
//             </Tabs.Tab>
//             <Tabs.Tab id="reports">
//               Reports
//               <Tabs.Indicator />
//             </Tabs.Tab>
//           </Tabs.List>
//         </Tabs.ListContainer>
//         <Tabs.Panel className="pt-4" id="overview">
//           <p>View your project overview and recent activity.</p>
//         </Tabs.Panel>
//         <Tabs.Panel className="pt-4" id="analytics">
//           <p>Track your metrics and analyze performance data.</p>
//         </Tabs.Panel>
//         <Tabs.Panel className="pt-4" id="reports">
//           <p>Generate and download detailed reports.</p>
//         </Tabs.Panel>
//       </Tabs>
//     </div>
//   );
// }
