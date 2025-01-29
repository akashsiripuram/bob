"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function QuestsPage() {
  const [quests, setQuests] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchQuests() {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/quests`
      );
      setQuests(response.data);
    } catch (error) {
      console.error("Error fetching quests:", error);
      setError("Failed to fetch quests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuests();
  }, []);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchQuests} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Available Quests</h1>
      {quests && quests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <QuestCard
              key={quest._id}
              quest={quest}
              onClick={() => router.push(`/quests/${quest._id}`)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No quests available at the moment.
        </p>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}

function QuestCard({ quest, onClick }) {
  const router = useRouter();
  const [startLoading, setStartLoading] = useState(true);
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.HxV79tFMPfBAIo0BBF-sOgHaEy%26pid%3DApi&f=1&ipt=a268266726f41f05a21e0625db3b5e8b0c5b11e7bf23e0bd23ddcc1bb2a259bb&ipo=images"
          alt={quest.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <Badge
          variant={quest.status === "open" ? "default" : "secondary"}
          className="absolute top-4 right-4"
        >
          {quest.status}
        </Badge>
      </div>
      <CardHeader>
        <h2 className="text-xl font-semibold line-clamp-2">{quest.title}</h2>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 mb-4">
          {quest.description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{quest.bounty} Sol</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <span className="text-muted-foreground">
            {quest.attempts} attempts
          </span>
        </div>
      </CardFooter>
      <div className="px-6 pb-4">
        {startLoading ? (
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setStartLoading(true);
              router.push(`/answer/${quest._id}`);
              setStartLoading(false);
            }}
          >
            Take Quest
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Loading...
          </Button>
        )}
      </div>
    </Card>
  );
}
