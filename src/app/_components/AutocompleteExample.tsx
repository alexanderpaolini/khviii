"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "~/components/ui/input";

interface AutocompleteExampleProps {
  onSelect: (value: string) => void;
  placeholder?: string;
}

// This is an example of how to implement autocomplete
export function AutocompleteExample({ onSelect, placeholder = "Type to search..." }: AutocompleteExampleProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock data for demonstration
  const mockData = [
    "John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson",
    "Diana Prince", "Eve Adams", "Frank Miller", "Grace Lee", "Henry Davis"
  ];

  // Filter suggestions based on input
  useEffect(() => {
    if (inputValue.length > 0) {
      const filtered = mockData.filter(item =>
        item.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect(suggestion);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? "bg-blue-100" : ""
              }`}
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/*
AUTOCOMPLETE IMPLEMENTATION GUIDE:

1. **State Management:**
   - inputValue: Current input text
   - suggestions: Array of filtered suggestions
   - showSuggestions: Boolean to control dropdown visibility
   - selectedIndex: Index of currently highlighted suggestion

2. **Key Features:**
   - Real-time filtering as user types
   - Keyboard navigation (Arrow keys, Enter, Escape)
   - Click to select
   - Click outside to close
   - Highlighted selection

3. **Performance Tips:**
   - Debounce API calls (wait 300ms after user stops typing)
   - Limit number of suggestions (e.g., 10-20 items)
   - Use virtual scrolling for large datasets
   - Cache results to avoid repeated API calls

4. **Advanced Features:**
   - Fuzzy search (fuse.js library)
   - Highlight matching text in suggestions
   - Group suggestions by category
   - Recent searches
   - Keyboard shortcuts

5. **Accessibility:**
   - ARIA attributes for screen readers
   - Proper focus management
   - Keyboard navigation support
   - Clear visual indicators

Example with debouncing:
```typescript
const [debouncedQuery, setDebouncedQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(inputValue);
  }, 300);
  
  return () => clearTimeout(timer);
}, [inputValue]);

// Use debouncedQuery for API calls
```
*/
