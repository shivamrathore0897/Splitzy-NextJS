"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Wallet, History, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils";
import { useIsFontLoaded } from "@/hooks/use-is-font-loaded";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Component for displaying a participant item in the list
const ParticipantItem = ({ index, participant, isPayer }) => (
  <li key={index} className="flex items-center space-x-2 py-1">
    {isPayer ? (
      <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
    ) : (
      <User className="mr-1 h-4 w-4 text-gray-500" />
    )}
    <span className="text-gray-700">{index + 1}. {participant}</span>
  </li>
);


export default function Home() {
  // State variables
  const [billAmount, setBillAmount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [owedAmounts, setOwedAmounts] = useState<{ [name: string]: number }>({});
  const [payer, setPayer] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [isCalculating, setIsCalculating] = useState(false);

  // Error states
  const [billAmountError, setBillAmountError] = useState<string | null>(null);
  const [participantNameError, setParticipantNameError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [payerError, setPayerError] = useState<string | null>(null);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // Validation function to check if the form is valid
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

    if (!currency) {
      setCurrencyError("Please select currency.")
      isValid = false;
    } else {
      setCurrencyError(null);
    }

    return isValid;
  };


  // Handler for adding a new participant to the list
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

  // Handler for calculating the split amount
  const handleCalculateSplit = () => {
    // Reset error states
    setBillAmountError(null);
    setParticipantsError(null);
    setPayerError(null);
    setCurrencyError(null);

    let isValid = true;

    // Validate bill amount
    if (billAmount === null || billAmount <= 0) {
      setBillAmountError("Bill amount must be greater than 0.");
      isValid = false;
    }

    // Validate form fields
    if (!isFormValid()) {
      isValid = false;
    }

    // If form is invalid, return
    if (!isValid) {
      return;
    }

    setIsCalculating(true);
    try {
      // Calculate split amount
      const splitAmount = billAmount! / participants.length;
      const newOwedAmounts: { [name: string]: number } = {};

      // Calculate owed amounts for each participant
      participants.forEach((participant) => {
        if (payer === participant) {
          newOwedAmounts[participant] = 0; // Payer already paid
        }
        else {
          newOwedAmounts[participant] = splitAmount;
        }
      });

      // Update owed amounts state
      setOwedAmounts(newOwedAmounts);
    } finally {
      setIsCalculating(false);
    }
  };

  // Check if calculation is disabled
  const isCalculateDisabled = !billAmount || !payer || !currency;

  const currencySymbols: any = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };

  const currencySymbol = currencySymbols[currency] || "$";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-4 bg-gradient-to-br from-green-100 to-teal-50 font-sans">
      <Card className="w-full max-w-md space-y-6 p-6 rounded-xl shadow-md bg-white/80 backdrop-blur-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold text-center text-gray-800">
            Splitzy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Bill Amount Section */}
          <section className="space-y-4">
            <Label htmlFor="billAmount" className="text-gray-700 font-medium">
              Bill Amount
            </Label>
            <div className="flex ">

              {/* Currency Selection Section */}

              <Select onValueChange={setCurrency} defaultValue={currency}>
                <SelectTrigger className="w-[80px] rounded-r-none">
                  {/* Manually render selected currency symbol */}
                  <span className="pl-2">{currencySymbols[currency]}</span>
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="USD">USD - $</SelectItem>
                  <SelectItem value="EUR">EUR - €</SelectItem>
                  <SelectItem value="GBP">GBP - £</SelectItem>
                  <SelectItem value="INR">INR - ₹</SelectItem>
                </SelectContent>
              </Select>

              <Input
                id="billAmount"
                type="number"
                placeholder="Enter bill amount"
                className="rounded-l-none text-gray-700 shadow-sm focus:ring-teal-500 focus:border-teal-500"
                value={billAmount === null ? "" : billAmount.toString()}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setBillAmount(isNaN(value) ? null : value);
                }}
              />
            </div>
            {billAmountError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{billAmountError}</AlertDescription>
              </Alert>
            )}
          </section>

          {/* Participants Section */}
          <section className="space-y-4">
            <Label htmlFor="participantName" className="text-gray-700 font-medium">
              Participants
            </Label>
            <div className="flex space-x-2">
              <Input
                id="participantName"
                type="text"
                placeholder="Enter participant name"
                className="rounded-md text-gray-700 shadow-sm focus:ring-teal-500 focus:border-teal-500"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
              <Button onClick={handleAddParticipant} className="bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md">
                <User className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            {participantNameError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{participantNameError}</AlertDescription>
              </Alert>
            )}
            {participants.length > 0 && (
              <div className="mt-2">
                <Label className="text-gray-700 font-medium">List of Participants:</Label>
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
          </section>

          {/* Payer Selection Section */}
          <section className="space-y-4">
            <Label className="text-gray-700 font-medium">Who Paid?</Label>
            <select
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:ring-teal-500 focus:border-teal-500"
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
          </section>



          {/* Calculate Split Button */}
          <Button
            className={cn(
              "w-full bg-teal-500 text-white hover:bg-teal-600 rounded-md shadow-md transition-colors duration-300",
              isCalculateDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleCalculateSplit}
            disabled={isCalculating || isCalculateDisabled}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Calculate Split
          </Button>

          {/* Owed Amounts Display Section */}
          {Object.keys(owedAmounts).length > 0 && (
            <section className="mt-6 space-y-4">
              <Label className="text-gray-700 font-medium">Owed Amounts:</Label>
              <ul>
                {Object.entries(owedAmounts).map(([name, amount]) => (
                  <li key={name} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      {payer === name ? (
                        <>
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          <span className="font-semibold text-gray-800">{name} (Payer)</span>
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-4 w-4 text-gray-500" />
                          <span className="text-gray-800">{name}</span>
                        </>
                      )}
                    </div>
                    <span className="text-gray-700">{currencySymbol}{amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </CardContent>
      </Card>

      <footer className="mt-8 text-center text-gray-500">
        <p>
          Made with ❤️ just for you
        </p>
      </footer>
    </div>
  );
}



