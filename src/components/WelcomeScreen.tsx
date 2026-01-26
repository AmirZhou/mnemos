import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button, Input, Select } from "./ui";

interface WelcomeScreenProps {
  onSelectUser: (userId: Id<"users">) => void;
}

export function WelcomeScreen({ onSelectUser }: WelcomeScreenProps) {
  const users = useQuery(api.users.list);
  const createUser = useMutation(api.users.create);

  const [showNewUser, setShowNewUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const userId = await createUser({ name: newName.trim() });
      onSelectUser(userId);
    } finally {
      setIsCreating(false);
    }
  };

  if (users === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-surface-900">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-100">Setting Tools</h1>
          <p className="text-gray-400">Daily Production Report</p>
        </div>

        {/* Main Card */}
        <div className="bg-surface-800 rounded-2xl p-6 space-y-6 shadow-xl">
          {!showNewUser ? (
            <>
              <h2 className="text-xl font-semibold text-gray-200">
                Select Operator
              </h2>

              {users.length > 0 ? (
                <div className="space-y-3">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => onSelectUser(user._id)}
                      className="w-full p-4 bg-surface-700 hover:bg-surface-600 rounded-xl text-left transition-colors"
                    >
                      <span className="text-lg text-gray-100">{user.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No operators yet
                </p>
              )}

              <div className="pt-2">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowNewUser(true)}
                >
                  + Add New Operator
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-200">
                New Operator
              </h2>

              <Input
                label="Name"
                placeholder="Enter your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setShowNewUser(false);
                    setNewName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateUser}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Continue"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
