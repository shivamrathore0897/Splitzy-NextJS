"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Wallet, History, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ParticipantItem = ({ index, participant, isPayer }) => (
  <li key={index} className="flex items-center space-x-2">
    {isPayer ? (
      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
    ) : (
      <User className="mr-1 h-4 w-4" />
    )}
    <span>{index + 1}. {participant}</span>
  </li>
);


export default function Home() {
  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [payer, setPayer] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Error states
  const [billAmountError, setBillAmountError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [payerError, setPayerError] = useState<string | null>(null);

  const isFormValid = () => {
    let isValid = true;

    // Participants Validation
    if (participants.length === 0) {
      setParticipantsError("Please add at least one participant.");
      isValid = false;
    } else {
      setParticipantsError(null);
    }
    if (!payer) {
        setPayerError("Please select payer.")
        isValid = false;
    } else {
        setPayerError(null);
    }

    return isValid;
  };


  const handleAddParticipant = () => {
    if (participantName.trim() === "") {
      setParticipantNameError("Participant name cannot be empty.");
      return;
    } else {
      setParticipantNameError(null);
    }

    setParticipants([...participants, participantName.trim()]);
    setParticipantName("");
  };

  const handleCalculateSplit = () => {
    // Reset error states
    setBillAmountError(null);
    setParticipantsError(null);
    setPayerError(null);

    let isValid = true;

    if (billAmount === null || billAmount <= 0) {
      setBillAmountError("Bill amount must be greater than 0.");
      isValid = false;
    }

    if (!isFormValid()) {
        isValid = false;
    }
    
    if (!isValid) {
      return;
    }

    setIsCalculating(true);
    try {
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
    } finally {
      setIsCalculating(false);
    }
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
            {billAmountError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{billAmountError}</AlertDescription>
              </Alert>
            )}
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
            {participantNameError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{participantNameError}</AlertDescription>
              </Alert>
            )}
            {participants.length > 0 && (
              <div className="mt-2">
                <Label>List of Participants:</Label>
                <ul>
                  {participants.map((participant, index) => (
                    <ParticipantItem
                      key={index}
                      index={index}
                      participant={participant}
                      isPayer={payer === participant}
                    />
                  ))}
                </ul>
              </div>
            )}
            {participantsError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{participantsError}</AlertDescription>
              </Alert>
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
            {payerError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{payerError}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Calculate Split Button */}
          <Button className="w-full" onClick={handleCalculateSplit} disabled={isCalculating}>
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
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
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
