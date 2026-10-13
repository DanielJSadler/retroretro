import { useEffect, useState, type ReactNode } from "react";
import { Input } from "../atoms/Input";
import { Button } from "../atoms/Button";

interface JoinFormProps {
  onSubmit: (name: string) => void;
  initialName?: string;
  buttonText?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

export function JoinForm({ onSubmit, initialName = "", buttonText = "Join", isLoading, children }: JoinFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [hasEditedName, setHasEditedName] = useState(false);

  useEffect(() => {
    if (!hasEditedName && initialName.trim()) {
      setName(initialName);
    }
  }, [hasEditedName, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Your name"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => {
          setHasEditedName(true);
          setName(e.target.value);
          if (error) setError("");
        }}
        error={error}
        autoFocus
      />
      {children}
      <Button type="submit" isLoading={isLoading} className="w-full">
        {buttonText}
      </Button>
    </form>
  );
}
