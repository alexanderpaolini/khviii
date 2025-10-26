"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { X, User, Check, X as RejectIcon } from "lucide-react";

interface FriendRequestSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestSidebar({ isOpen, onClose }: FriendRequestSidebarProps) {
  const utils = api.useUtils();
  const { data: pendingRequests, isLoading } = api.friend.getPendingRequests.useQuery();
  const respondToRequest = api.friend.respondToRequest.useMutation();

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleRespond = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await respondToRequest.mutateAsync({ requestId, status });
      await utils.friend.getPendingRequests.refetch();
      await utils.friend.getAll.refetch();
      
      if (status === "ACCEPTED") {
        console.log("Friend request accepted!");
      } else {
        console.log("Friend request rejected.");
      }
    } catch (error) {
      console.error("Failed to respond to friend request:", error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Friend Requests</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {request.requester.contact?.firstName} {request.requester.contact?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.requester.contact?.nickname || request.requester.name}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-600 mt-2 p-2 bg-white rounded border">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(request.id, "ACCEPTED")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={respondToRequest.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(request.id, "REJECTED")}
                      disabled={respondToRequest.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <RejectIcon className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No pending friend requests</p>
              <p className="text-sm mt-2">When someone sends you a friend request, it will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
