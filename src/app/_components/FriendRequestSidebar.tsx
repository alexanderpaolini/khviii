"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { X, User, Check, X as RejectIcon, Plus, Search } from "lucide-react";

interface FriendRequestSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FriendRequestSidebar({ isOpen, onClose }: FriendRequestSidebarProps) {
  const utils = api.useUtils();
  const { data: pendingRequests, isLoading } = api.friend.getPendingRequests.useQuery();
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
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
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
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, social media, or company..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showSearchResults ? (
            // Search Results
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results</h3>
              {isSearching ? (
                <div className="text-center py-8">Searching...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {user.contact?.firstName} {user.contact?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {user.contact?.nickname || user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user.email || user.contact?.email}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => handleSendFriendRequest(user.friendCode || "")}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={sendFriendRequest.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
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
            // Pending Requests
            <>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : pendingRequests && pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Requests</h3>
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
