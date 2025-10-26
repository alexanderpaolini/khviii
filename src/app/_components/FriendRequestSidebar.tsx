"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { X, User, Check } from "lucide-react";

interface FriendRequestSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestSidebar({
  isOpen,
  onClose,
}: FriendRequestSidebarProps) {
  const utils = api.useUtils();
  const { data: pendingRequests, isLoading } =
    api.friend.getPendingRequests.useQuery();
  const respondToRequest = api.friend.respondToRequest.useMutation();
  const sendFriendRequest = api.friend.sendFriendRequest.useMutation();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Search users with debouncing
  const { data: searchResults, isLoading: isSearching } = api.friend.searchUsers.useQuery(
    { query: searchQuery },
    { 
      enabled: searchQuery.length > 2,
      refetchOnWindowFocus: false,
    }
  );

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleRespond = async (
    requestId: string,
    status: "ACCEPTED" | "REJECTED",
  ) => {
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

  const handleSendFriendRequest = async (friendCode: string, message?: string) => {
    try {
      await sendFriendRequest.mutateAsync({ friendCode, message });
      console.log("Friend request sent successfully!");
      setSearchQuery("");
      setShowSearchResults(false);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.length > 2);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="bg-opacity-50 fixed inset-0 z-40 bg-black transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-96 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"} `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
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
            <div className="py-8 text-center">Loading...</div>
          ) : pendingRequests && pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between rounded-lg border bg-gray-50 p-4"
                >
                  <div className="flex flex-1 items-start space-x-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {request.requester.contact?.firstName}{" "}
                        {request.requester.contact?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.requester.contact?.nickname ??
                          request.requester.name}
                      </p>
                      {request.message && (
                        <p className="mt-2 rounded border bg-white p-2 text-sm text-gray-600">
                          &quot;{request.message}&quot;
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.contact?.nickname || user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.email || user.contact?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col space-y-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(request.id, "ACCEPTED")}
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled={respondToRequest.isPending}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(request.id, "REJECTED")}
                      disabled={respondToRequest.isPending}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm mt-2">Try searching by name, email, or phone number.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <User className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg font-medium">No pending friend requests</p>
              <p className="mt-2 text-sm">
                When someone sends you a friend request, it will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
