"use client";

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Wallet, History } from 'lucide-react';

export default function Home() {
  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [payer, setPayer] = useState<string>("");

  const isFormValid = () => {
    return billAmount !== null && billAmount > 0 && participants.length > 0;
  };

  const handleAddParticipant = () => {
    if (participantName.trim() !== "") {
      setParticipants([...participants, participantName.trim()]);
      setParticipantName("");
    }
  };

  const handleCalculateSplit = () => {
    if (!isFormValid()) {
      alert("Please enter a valid bill amount and add at least one participant.");
      return;
    }

    const splitAmount = billAmount! / participants.length;
    const newOwedAmounts: { [name: string]: number } = {};

    participants.forEach((participant) => {
      if (payer === participant) {
        newOwedAmounts[participant] = 0; // Payer already paid
      }
      else {
        newOwedAmounts[participant] = splitAmount;
      }
    });

    setOwedAmounts(newOwedAmounts);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-secondary">
      <Card className="w-full max-w-md space-y-4 p-4 rounded-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Splitzy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Bill Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="billAmount">Bill Amount</Label>
            <Input
              id="billAmount"
              type="number"
              placeholder="Enter bill amount"
              value={billAmount === null ? "" : billAmount.toString()}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setBillAmount(isNaN(value) ? null : value);
              }}
            />
          </div>

          {/* Participants Input */}
          <div className="space-y-2">
            <Label htmlFor="participantName">Participants</Label>
            <div className="flex space-x-2">
              <Input
                id="participantName"
                type="text"
                placeholder="Enter participant name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
              <Button onClick={handleAddParticipant}><User className="mr-2 h-4 w-4"/>Add</Button>
            </div>
            {participants.length > 0 && (
              <div className="mt-2">
                <Label>List of Participants:</Label>
                <ul>
                  {participants.map((participant, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <User className="mr-1 h-4 w-4"/>
                      <span>{index + 1}. {participant}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Payer Selection */}
          <div className="space-y-2">
            <Label>Who Paid?</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => setPayer(e.target.value)}
              value={payer}
            >
              <option value="">Select Payer</option>
              {participants.map((participant, index) => (
                <option key={index} value={participant}>
                  {participant}
                </option>
              ))}
            </select>
          </div>

          {/* Calculate Split Button */}
          <Button className="w-full" onClick={handleCalculateSplit} disabled={!isFormValid()}>
            <Wallet className="mr-2 h-4 w-4"/>Calculate Split
          </Button>

          {/* Owed Amounts Display */}
          {Object.keys(owedAmounts).length > 0 && (
            <div className="mt-4">
              <Label>Owed Amounts:</Label>
              <ul>
                 {Object.entries(owedAmounts).map(([name, amount]) => (
                    <li key={name} className="flex items-center space-x-2">
                      {payer === name ? (
                        <>
                          <Wallet className="mr-1 h-4 w-4 text-green-500" />
                          <span>{name} (Payer):</span>
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-4 w-4" />
                          <span>{name}:</span>
                        </>
                      )}
                      <span>{amount.toFixed(2)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-muted-foreground">
        <p>
          Created by Firebase Studio
        </p>
      </footer>
    </div>
  );
}
