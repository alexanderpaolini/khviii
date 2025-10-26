"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Plus } from "lucide-react";
import { FriendRequestSidebar } from "./FriendRequestSidebar";

export function FriendRequestButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: pendingRequests } = api.friend.getPendingRequests.useQuery();

  const requestCount = pendingRequests?.length ?? 0;

  return (
    <>
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="relative h-14 w-14 rounded-full bg-blue-600 shadow-lg hover:bg-blue-700"
          size="icon"
        >
          <Plus className="h-6 w-6 text-white" />
          {requestCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
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
