"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Bell } from "lucide-react";
import { FriendRequestSidebar } from "./FriendRequestSidebar";

export function FriendRequestButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: pendingRequests } = api.friend.getPendingRequests.useQuery();
  
  const requestCount = pendingRequests?.length ?? 0;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="relative h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <Bell className="h-6 w-6 text-white" />
          {requestCount > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {requestCount > 9 ? "9+" : requestCount}
            </span>
          )}
        </Button>
      </div>
      
      <FriendRequestSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </>
  );
}
